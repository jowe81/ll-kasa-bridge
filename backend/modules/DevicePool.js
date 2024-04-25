import TplinkSmarthomeApi from "tplink-smarthome-api";
import _ from "lodash";

import constants from "../constants.js";
import DeviceWrapper from "./DeviceWrapper.js";
import EspDeviceWrapper from "./EspDeviceWrapper.js";
import VirtualDeviceWrapper from "./VirtualDeviceWrapper.js";
import Location from "./Location.js";
import { spawn } from "child_process";

import { getPreset } from "./Presets.js";
import { log } from "./Log.js";

import {
    isBetweenDuskAndDawn,
    isDawnOrDusk,
    isDawn,
    isDusk,
    getFromSettingsForNextSunEvent,
} from "../helpers/jDateTimeUtils.js";
import { loadFilterPlugins } from "./Filters.js";
import { loadDeviceHandlerPlugins, loadCommandHandlerPlugins } from "./Plugins.js";

import { commandMatchesCurrentState, commandObjectToBoolean } from "./TargetDataProcessor.js";

import { globalConfig } from "../configuration.js";
import { socketHandler } from "./SocketHandler.js";

/**
 * The DevicePool encapsulates all automation device functionality.
 * It keeps an array of deviceWrappers to keep track of device status and
 * additional meta information (mapItem properties).
 * A callback function can be passed into intialize() that will be called
 * on device events (powerstate/lightstate changes).
 */

const devicePool = {
    /**
     *
     * @param {*} db
     * @param boolean useUdpDiscovery  Whether to rely on udp discovery or use stored sysinfo.
     * @param {*} deviceEventCallback
     */
    async initialize(db, useUdpDiscovery, deviceEventCallback) {
        this.db = db;
        this.dbDeviceMap = db.collection("DeviceMap");
        this.dbConfig = this.db.collection("Config");
        this.dbSysInfo = db.collection("SysInfo");
        this.devices = [];
        this.locations = {};

        // This function will be injected into the device wrapper and called on device events
        this.deviceEventCallback = (event, deviceWrapper) => {
            // Run the callback if one was passed in
            if (deviceEventCallback) {
                deviceEventCallback(event, deviceWrapper);
            }
        };

        // If a callback function has been passed in, store it.
        if (deviceEventCallback) {
            log(`Registered callback function '${deviceEventCallback.name}' in device pool.`, null, "white");
        }

        log(`Initializing device pool.`, null, "white");

        await this.loadGlobalConfiguration();

        await loadFilterPlugins();
        await loadDeviceHandlerPlugins();
        await loadCommandHandlerPlugins();
        await this.initDeviceWrappers();

        this.startPeriodicServices();
        this.initLocations();

        if (useUdpDiscovery) {
            this.startDiscovery();
        } else {
            this.initDevicesFromStoredSysInfo();
        }
    },

    startPeriodicServices() {
        // Filters
        const settings = this.globalConfig?.defaults?.periodicFilters;
        const interval = settings?.checkInterval ?? constants.MINUTE;
        log(`Starting periodic services at check interval (ms): ${interval}`, null, "white");

        setInterval(() => {
            this._runPeriodicFilters();            
        }, interval);

        // Alerts
        const alertsSettings = this.globalConfig?.defaults?.backendAlertHandler;
        const alertsInterval = alertsSettings?.checkInterval ?? constants.MINUTE;
        log(`Starting backend alert handler at check interval (ms): ${alertsInterval}`, null, "white");

        setInterval(() => this._handleBackendAlerts(), alertsInterval);
    },

    startDiscovery() {
        log(`Starting device discovery...`, null, "white");

        const client = new TplinkSmarthomeApi.Client();

        const options = {
            // Number of subsequent polling attempts before 'device-offline' is emitted.
            offlineTolerance: this.globalConfig.defaults.offlineTolerance,
            // Broadcast address for UDP discovery
            broadcast: process.env.UDP_DISCOVERY_BROADCAST ?? "255.255.255.255",
        };

        log(`Global offline tolerance is ${options.offlineTolerance} attempts.`, null, "white");
        log(`UDP Discovery broadcast address address is ${options.broadcast}.`, null, "white");
        client.startDiscovery(options).on("device-new", (device) => {
            device.getSysInfo().then((info) => {
                device.mic_mac = info.mic_mac;
                this.addDevice(device);
            });
        });

        log(`Attaching event listeners.`, null, "white");

        // Attach event listeners for device-online/device-offline
        client.on("device-offline", async (device) => {
            const deviceWrapper = await this.getDeviceWrapperById(device.id);
            if (deviceWrapper && deviceWrapper.isOnline) {
                log(`Device went offline.`, deviceWrapper, "yellow");
                deviceWrapper.setOffline();
            }
        });

        client.on("device-online", async (device) => {
            const deviceWrapper = await this.getDeviceWrapperById(device.id);
            if (deviceWrapper && !deviceWrapper.isOnline) {
                log(`Device came online.`, deviceWrapper, "yellow");
                deviceWrapper.setOnline();
            }
        });
    },

    // Add a newly discovered device.
    async addDevice(device) {
        let deviceWrapper;
        const mapItem = await this.getDeviceMapItemById(device.id);

        if (mapItem) {
            // Device is in the map and therefore has an existing wrapper; inject the device.
            deviceWrapper = this.getDeviceWrapperByChannel(mapItem.channel);
            deviceWrapper.injectDevice(device, mapItem, this.globalConfig, this.deviceEventCallback);

            // Create or update the sysInfo record.
            const sysInfoRecord = await this.getSysInfoRecord(mapItem._id);

            if (sysInfoRecord) {
                const { acknowledged } = await this.dbSysInfo.updateOne(
                    {
                        _id: sysInfoRecord._id,
                    },
                    {
                        $set: {
                            ...sysInfoRecord,
                            host: device.host,
                            port: device.port,
                            updated_at: new Date(),
                        },
                    }
                );
                if (acknowledged) {
                    log(`Updated sysInfo record.`, deviceWrapper);
                }
            } else {
                if (typeof device._sysInfo === "object") {
                    // Create a new sysInfo record.
                    const { acknowledged } = await this.dbSysInfo.insertOne({
                        mapItemId: mapItem._id,
                        _sysInfo: device._sysInfo,
                        host: device.host,
                        port: device.port,
                        created_at: new Date(),
                        updated_at: new Date(),
                    });

                    if (acknowledged) {
                        log(`Created sysInfo record.`, deviceWrapper);
                    }
                } else {
                    log(`Could not create sysInfo record: no data from device!`, deviceWrapper, "red");
                }
            }
        } else {
            // This device is not in the map (and therefore not in the pool and has no wrapper yet)
            deviceWrapper = this.initDeviceWrapper(null, device);
        }

        deviceWrapper.startPolling();
    },

    /**
     * Apply a preset to a set of devices by target type / target id
     */
    applyPresetTo(targetType, targetId, presetId, options, origin = "API") {
        const deviceWrappers = this.getDeviceWrappers(targetType, targetId);
        this.applyPreset(deviceWrappers, presetId, options, origin);
    },

    /**
     * Apply a preset to a set of devices
     */
    applyPreset(deviceWrappers, presetId, options, origin) {
        const preset = getPreset(presetId);

        deviceWrappers.forEach((deviceWrapper) => {
            log(`Applying preset ${presetId}`, deviceWrapper);

            if (preset?.stateData?.lightState) {
                deviceWrapper.setLightState(preset.stateData.lightState, null, origin, null, true);
            }

            if (preset?.stateData?.powerState) {
                deviceWrapper.setPowerState(preset.stateData.powerState, null, origin, null, true);
            }
        });
    },

    /**
     * Apply options to a set of devices by target type / target id
     */
    applyOptionsTo(targetType, targetId, options, origin = "API") {
        if (!(typeof options === "object" && Object.keys(options).length)) {
            return;
        }

        const deviceWrappers = this.getDeviceWrappers(targetType, targetId);
        this.applyOptions(deviceWrappers, options, origin);
    },

    /**
     * Apply options to a set of devices
     */
    applyOptions(deviceWrappers, options, origin) {
        deviceWrappers.forEach((deviceWrapper) => {
            const optionsText = [];

            if (options.suspendPeriodicFilters) {
                deviceWrapper.suspendPeriodicFilters();
                optionsText.push(`suspend periodic filters`);
            }

            if (options.resumePeriodicFilters) {
                deviceWrapper.resumePeriodicFilters();
                optionsText.push(`resume periodic filters`);
            }

            const optionsTextStr = optionsText.join(", ");

            log(`Applied options: ${optionsTextStr}`, deviceWrapper);
        });
    },

    /**
     * Get device wrappers by target type / target id
     */
    getDeviceWrappers(targetType, targetId) {
        let deviceWrappers = [];

        switch (targetType) {
            case "channel":
                const deviceWrapper = this.getDeviceWrapperByChannel(parseInt(targetId));
                if (!deviceWrapper) {
                    log(`Device on channel ${targetId} not found.`);
                } else {
                    deviceWrappers = [deviceWrapper];
                }
                break;

            case "class":
                deviceWrappers = this.getDeviceWrappersByClassName(targetId);
                if (!deviceWrappers.length) {
                    log(`No devices in class ${targetId}.`);
                }
                break;

            case "group":
                // Todo
                break;
        }

        return deviceWrappers;
    },

    getDeviceWrapperByChannel(channel) {
        return this.devices.find((deviceWrapper) => deviceWrapper.channel === channel);
    },

    getDeviceWrappersByType(type, subType) {
        const deviceWrappers = this.devices.filter((deviceWrapper) => {
            let result = true;

            if (type && deviceWrapper.type !== type) {
                // When type is specified it must match.
                result = false;
            }

            if (subType && deviceWrapper.subType !== subType) {
                // When subType is specified it must match.
                result = false;
            }

            return result;
        });

        return deviceWrappers;
    },

    getMasterSwitchDeviceWrapper() {
        const deviceWrappers = devicePool.getDeviceWrappersByType(
            constants.DEVICETYPE_VIRTUAL,
            constants.SUBTYPE_MASTER_SWITCH
        );

        return deviceWrappers.length && deviceWrappers[0];
    },

    getTimerDeviceWrapper() {
        const deviceWrappers = devicePool.getDeviceWrappersByType(
            constants.DEVICETYPE_VIRTUAL,
            constants.SUBTYPE_TIMER
        );
        const timerDeviceWrapper = deviceWrappers.length && deviceWrappers[0];
        return timerDeviceWrapper;
    },

    /**
     * Return an array of group ids that this channel belongs to
     */
    getGroupsForChannel(channel) {
        if (!Array.isArray(this.globalConfig.groups)) {
            return [];
        }

        const groups = this.globalConfig.groups
            .map((groupDefinition) => {
                if (Array.isArray(groupDefinition.channels)) {
                    if (groupDefinition.channels.includes(channel)) {
                        return groupDefinition.id;
                    }
                }

                return null;
            })
            .filter((item) => item);

        return groups;
    },

    getGroupPowerState(groupId) {
        let result = null;

        const group = this.globalConfig.groups.find((group) => group.id === groupId);

        if (group) {
            let powerOnCount = 0;
            let powerOffCount = 0;
            let naCount = 0;

            let deviceWrappers = [];

            group.channels.forEach((channel) => {
                const deviceWrapper = this.getDeviceWrapperByChannel(channel);

                if (!deviceWrapper) {
                    naCount++;
                } else {
                    deviceWrappers.push(deviceWrapper);
                }
            });

            deviceWrappers.forEach((deviceWrapper) => {
                deviceWrapper.getPowerState() ? powerOnCount++ : powerOffCount++;
            });

            // Consider the group powerState on or off only if all devices are on or off.
            if (powerOnCount === deviceWrappers.length) {
                result = true;
            } else if (powerOffCount === deviceWrappers.length) {
                result = false;
            }
        }

        return result;
    },

    getGroupLightState(groupId) {
        const deviceWrappers = this.getGroupMembers(groupId, true);

        if (!deviceWrappers || !deviceWrappers.length) {
            return {};
        }

        // Have a least 1 deviceWrapper.
        const referenceState = { ...deviceWrappers[0].getLightState() };
        const properties = Object.keys(referenceState);

        for (let i = 1; i < deviceWrappers.length - 1; i++) {
            const thisState = { ...deviceWrappers[i].getLightState() };

            // Any time a remaining state object has a property that doesn't match the reference, set that property on the reference to null.
            properties.forEach((property) => {
                if (referenceState[property] !== null && referenceState[property] !== thisState[property]) {
                    referenceState[property] = null;
                }
            });
        }

        // Now Remove all the null propertyies from the reference
        // so that only the parts of the state that match all group members remain.
        properties.forEach((property) => {
            if (referenceState[property] === null) {
                delete referenceState[property];
            }
        });

        // Remove a 0 color temp
        if (referenceState.color_temp === 0) {
            delete referenceState.color_temp;
        }

        // Remove saturation if color temp is present as it gets overwritten.
        if (referenceState.color_temp && referenceState.saturation) {
            delete referenceState.saturation;
        }

        return referenceState;
    },

    groupStateMatchesState(groupId, stateData) {
        const log = false//groupId === "group-livingroomLights";
        let result = true;

        // Ensure we have a state object.
        if (typeof stateData !== "object") {
            stateData = {
                on_off: stateData ? 1 : 0,
            };
        }

        const deviceWrappers = this.getGroupMembers(groupId);
        deviceWrappers.every((deviceWrapper) => {
            let stateDataMatchesCurrent = commandMatchesCurrentState(deviceWrapper, stateData);
            if (stateDataMatchesCurrent === null) {
                if ([undefined, null].includes(deviceWrapper.getPowerState()) && (!stateData || stateData.on_off === 0)) {
                    stateDataMatchesCurrent = true;
                }
            }

            log && console.log(groupId, "stateData", stateData, "current", this.getGroupLightState(groupId));
            log && console.log(groupId, "matchesCurrent", stateDataMatchesCurrent);

            if (!stateDataMatchesCurrent) {
                result = false;
                return false;
            }
            return true;
        });

        return result;
    },

    getGroupMembers(groupId, discoveredOnly = true) {
        const group = this.globalConfig.groups.find((group) => group.id === groupId);
        if (!group) {
            return null;
        }

        let naCount = 0;
        let deviceWrappers = [];

        group.channels.forEach((channel) => {
            const deviceWrapper = this.getDeviceWrapperByChannel(channel);

            if (!deviceWrapper) {
                naCount++;
            }

            if (deviceWrapper || !discoveredOnly) {
                deviceWrappers.push(deviceWrapper);
            }
        });

        return deviceWrappers;
    },

    getDeviceWrappersByClassName(className) {
        const deviceWrappers = [];

        this.devices.forEach((deviceWrapper) => {
            if (Array.isArray(deviceWrapper.classes) && deviceWrapper.classes.includes(className)) {
                deviceWrappers.push(deviceWrapper);
            }
        });

        return deviceWrappers;
    },

    getDeviceWrappersByLocation(locationId) {
        return this.getDeviceWrappersByFilter({ location: locationId });
    },

    getDeviceWrappersByFilter(filter) {
        if (!filter) {
            return [];
        }

        const deviceWrappers = [];

        this.devices.forEach((deviceWrapper) => {
            const keys = Object.keys(filter);
            let isMatch = true;

            keys.every((key) => {
                if (deviceWrapper[key] !== filter[key]) {
                    isMatch = false;
                    return false;
                }

                return true;
            });

            if (isMatch) {
                deviceWrappers.push(deviceWrapper);
            }
        });

        return deviceWrappers;
    },

    getLiveDeviceMap() {
        const map = [];
        this.devices.forEach((deviceWrapper) => map.push(deviceWrapper.getLiveDevice(deviceWrapper)));
        return map;
    },

    getDisplayGroups() {
        const groups = this.globalConfig.groups.filter((group) => group.display !== false);
        groups.forEach((group) => (group.display = true));
        return groups;
    },

    async getDeviceMapItemById(id) {
        return this.dbDeviceMap.findOne({ id });
    },

    async getDeviceMapFromDb() {
        return this.dbDeviceMap.find({}).toArray();
    },

    async getDeviceWrapperById(id) {
        const mapItem = await this.getDeviceMapItemById(id);
        if (mapItem) {
            return Promise.resolve(this.getDeviceWrapperByChannel(mapItem.channel));
        }
    },

    async getSysInfoRecord(mapItemId) {
        if (!mapItemId) {
            return;
        }

        const record = await this.dbSysInfo.findOne({ mapItemId });
        return record;
    },

    // Read exisiting SysInfo for the devices on the map instead of waiting for discovery.
    async initDevicesFromStoredSysInfo() {
        log(`Attempting to initialize devices from stored sysInfo records...`, "bgRed");

        const client = new TplinkSmarthomeApi.Client();
        const deviceMap = await this.getDeviceMapFromDb();

        deviceMap.forEach(async (mapItem) => {
            const sysInfoRecord = await this.getSysInfoRecord(mapItem._id);

            if (sysInfoRecord) {
                const host = sysInfoRecord.host;
                if (host) {
                    log(`Initializing ${mapItem.alias ?? mapItem.id ?? mapItem.channel} at ${host}`);

                    client
                        .getDevice({ host })
                        .catch((err) => {
                            log(`Device at ${host} is not responding: ${err.message}`, null, "bgRed");
                        })
                        .then((device) => this.addDevice(device));
                }
            }
        });
    },

    // Create deviceWrappers for all devices on the map.
    async initDeviceWrappers() {
        const deviceMap = await this.getDeviceMapFromDb();

        if (Array.isArray(deviceMap)) {
            const espCache = {};
            const virtualCache = {};

            deviceMap.forEach((mapItem) => {
                if (!mapItem.id) {
                    // Must have ID
                    log(`Ignoring device on channel ${mapItem.channel} without id. Please check configuration.`);
                    return;
                }

                let deviceWrapper;

                switch (mapItem.type) {
                    // ESP Devices
                    case constants.DEVICETYPE_ESP_THERMOMETER:
                    case constants.DEVICETYPE_ESP_RELAY:
                        deviceWrapper = Object.create(EspDeviceWrapper);
                        deviceWrapper.init(espCache, mapItem, globalConfig, null, this, socketHandler);
                        this.devices.push(deviceWrapper);
                        break;

                    case constants.DEVICETYPE_VIRTUAL:
                        deviceWrapper = Object.create(VirtualDeviceWrapper);
                        deviceWrapper.init(virtualCache, mapItem, globalConfig, null, this, socketHandler);
                        this.devices.push(deviceWrapper);
                        break;

                    // KASA Devices (have no type defined in configuration; assigned at discovery)
                    case constants.DEVICETYPE_KASA_SMARTBULB:
                    case constants.DEVICETYPE_KASA_SMARTPLUGSWITCH:
                    default:
                        this.initDeviceWrapper(mapItem, null);
                        break;
                }
            });
        }
    },

    initDeviceWrapper(mapItem, device) {
        const deviceWrapper = Object.create(DeviceWrapper);

        if (mapItem) {
            mapItem.groups = this.getGroupsForChannel(mapItem.channel);
            deviceWrapper.mapItemId = mapItem._id;
        } else {
            mapItem = {
                alias: "Unmapped device",
                channel: null,
                class: "class-unmappedDevices",
                id: device?.id,
            };
        }

        // Store the mac address retrieved from sysInfo
        mapItem.mic_mac = device?.mic_mac;

        // Store a backreference to the pool and to the socket deviceHandler in each wrapper
        deviceWrapper.devicePool = this;
        deviceWrapper.socketHandler = this.socketHandler;

        // For items on the deviceMap, injectDevice will first be called with null device. It will be called again once the device is discovered.
        deviceWrapper.injectDevice(device, mapItem, this.globalConfig, this.deviceEventCallback);

        this.devices.push(deviceWrapper);

        return deviceWrapper;
    },

    initLocations() {
        this.globalConfig.locations.forEach((locationConfigObject) => {
            if (!this.locations[locationConfigObject.id]) {
                const location = Object.create(Location);
                if (location.init(locationConfigObject, this)) {
                    this.locations[locationConfigObject.id] = location;
                }
            }
        });

        log(
            `Initialized ${Object.keys(this.locations).length} of ${this.globalConfig.locations.length} locations.`,
            null,
            "white"
        );
    },

    async loadGlobalConfiguration() {
        const globalConfig = await this.dbConfig.findOne();
        this.globalConfig = globalConfig;
        const noMapItems = await this.dbDeviceMap.countDocuments();
        log(`Loaded global configuration and found ${noMapItems} registered devices in the database.`, null, "white");
    },

    toggleGroup(groupId) {
        const group = this.globalConfig.groups.find((group) => group.id === groupId);

        if (group) {
            let powerOnCount = 0;
            let powerOffCount = 0;
            let naCount = 0;

            let deviceWrappers = [];

            group.channels.forEach((channel) => {
                const deviceWrapper = this.getDeviceWrapperByChannel(channel);

                if (!deviceWrapper) {
                    naCount++;
                } else {
                    deviceWrappers.push(deviceWrapper);
                }
            });

            deviceWrappers.forEach((deviceWrapper) => {
                deviceWrapper.powerState ? powerOnCount++ : powerOffCount++;
            });

            const targetState = powerOffCount ? true : false;

            deviceWrappers.forEach((deviceWrapper) => deviceWrapper.setPowerState(targetState));
        }
    },

    switchGroup(groupId, powerState) {
        const deviceWrappers = this.getDeviceWrappersByGroup(groupId);

        if (!deviceWrappers) {
            log(`Error: Cannot switch group ${groupId}: it does not exist.`, null, "red");
            return null;
        }

        deviceWrappers.forEach((deviceWrapper) => deviceWrapper.setPowerState(powerState));
    },

    setGroupLightState(groupId, lightState) {
        const deviceWrappers = this.getDeviceWrappersByGroup(groupId);

        if (!deviceWrappers) {
            log(`Error: Cannot switch group ${groupId}: it does not exist.`, null, "red");
            return null;
        }

        deviceWrappers.forEach((deviceWrapper) => {
            if (
                typeof lightState === "boolean" ||
                ![constants.SUBTYPE_BULB, constants.SUBTYPE_LED_STRIP].includes(deviceWrapper.subType)
            ) {
                // Device does not support setLightState (or the targetStaet is boolean anyway)
                deviceWrapper.setPowerState(commandObjectToBoolean(lightState));
            } else {
                deviceWrapper.setLightState(lightState, null, null, null, true);
            }
        });
    },

    getDeviceWrappersByGroup(groupId) {
        const group = this.globalConfig.groups.find((group) => group.id === groupId);

        if (!group) {
            return null;
        }

        let deviceWrappers = [];
        let naCount = 0;

        group.channels.forEach((channel) => {
            const deviceWrapper = this.getDeviceWrapperByChannel(channel);

            if (!deviceWrapper) {
                naCount++;
            } else {
                deviceWrappers.push(deviceWrapper);
            }
        });

        if (naCount) {
            log(`Warning: ${naCount} devices in group ${groupId} appear to be offline.`, null, "yellow");
        }

        return deviceWrappers;
    },

    // Internal

    // Any filter configured on a device that has an interval property > 0 set, will be applied by this function.
    _runPeriodicFilters() {
        const serviceName = "Periodic Filter Service";
        const tag = `${serviceName}: `;
        log(`${tag}Run filters...`, null);

        let devicesProcessed = 0,
            devicesSkipped = 0;
        let filtersProcessed = 0,
            filtersSkipped = 0;

        if (Array.isArray(this.devices)) {
            this.devices.forEach((deviceWrapper) => {
                const filtersToRun = this._getCurrentlyActivePeriodicFilters(deviceWrapper.filters);

                if (Array.isArray(filtersToRun) && filtersToRun.length) {
                    if (!deviceWrapper.periodicFiltersSuspended) {
                        if ([constants.SUBTYPE_PLUG, constants.SUBTYPE_SWITCH].includes(deviceWrapper.subType)) {
                            deviceWrapper.runPowerStateFilters({}, null, serviceName, filtersToRun);
                        } else {
                            deviceWrapper.setLightState({}, null, serviceName, filtersToRun);
                        }
                        filtersProcessed += filtersToRun.length;
                        devicesProcessed++;
                    } else {
                        filtersSkipped += filtersToRun.length;
                    }
                }

                if (deviceWrapper.periodicFiltersSuspended) {
                    devicesSkipped++;
                }
            });
        }

        let t = "";
        if (devicesProcessed) {
            t += `Processed ${filtersProcessed} filters on ${devicesProcessed} devices. `;
        }

        if (devicesSkipped) {
            t += `Skipped ${filtersSkipped} filters on ${devicesSkipped} devices. `;
        }

        log(tag + (t ? t : `Nothing to do.`));
    },

    // Filter out filters that shouldn't run
    _getCurrentlyActivePeriodicFilters(allFilters) {
        const filtersToRun = [];

        if (Array.isArray(allFilters) && allFilters.length) {
            // Get the default for all periodic filters
            const defaultPaddingFromSunEvent =
                this.globalConfig?.defaults?.periodicFilters?.paddingFromSunEvent ?? constants.HOUR * 2;

            allFilters.forEach((filterObject) => {
                // Has periodicallyActive set?
                if (filterObject && filterObject.periodicallyActive) {
                    const periodicallyActive = filterObject.periodicallyActive;

                    // Has a restriction set?
                    if (periodicallyActive.restriction) {
                        // Is restricted - evaluate.

                        // See if this filter has custom padding, otherwise use the default
                        const paddingFromSunEvent =
                            getFromSettingsForNextSunEvent("paddingFromSunEvent", periodicallyActive) ??
                            defaultPaddingFromSunEvent;

                        let runThisFilter = false;

                        switch (filterObject.periodicallyActive?.restriction) {
                            case "always":
                                runThisFilter = true;
                                break;

                            case "duskToDawn":
                                runThisFilter = isBetweenDuskAndDawn(null, null, paddingFromSunEvent);
                                break;

                            case "dawnAndDusk":
                            case "duskAndDawn":
                                runThisFilter = isDawnOrDusk(null, null, paddingFromSunEvent);
                                break;

                            case "dusk":
                                runThisFilter = isDusk(null, null, paddingFromSunEvent);

                            case "dawn":
                                runThisFilter = isDawn(null, null, paddingFromSunEvent);
                        }

                        if (runThisFilter) {
                            filtersToRun.push(filterObject);
                        }
                    } else {
                        // No restriction - run around the clock.
                        filtersToRun.push(filterObject);
                    }
                }
            });
        }

        return filtersToRun;
    },

    _handleBackendAlerts() {
        const allCurrentAlerts = [];

        this.devices.forEach((deviceWrapper) => {
            const deviceAlerts = deviceWrapper.getAlerts();

            if (Array.isArray(deviceAlerts)) {
                allCurrentAlerts.push(...deviceAlerts);
            }            
        });

        const now = new Date();
        const audiofilesToPlay = [];
        
        allCurrentAlerts.forEach(alert => {
            if (alert.audiofile && alert.playInterval && ['alert'].includes(alert.level)) {
                // This alert should play audio.
                if (!alert.lastPlayed || (alert.lastPlayed?.getTime() + alert.playInterval < now.getTime())) {
                    // It is due to play.
                    if (!audiofilesToPlay.includes(alert.audiofile)) {
                        audiofilesToPlay.push(alert.audiofile);
                    }
                    alert.lastPlayed = now;
                }        
            }
        })

        audiofilesToPlay.forEach((audiofile) => {
            this.playAudio(audiofile);
        });
    },

    createAlert(message, level, deviceWrapper, noDismiss = false, alertAudio = false, audiofile = null, playInterval = null, reactivateAfterMs = 0) {
        if (!deviceWrapper) {
            return null;
        }
        const alertsSettings = this.globalConfig?.defaults?.backendAlertHandler;

        const serviceLabel = deviceWrapper.displayLabel;
        const currentAlerts = deviceWrapper.getAlerts();
        const existingAlert = currentAlerts?.find(alert => alert.message === message && alert.level === level && alert.serviceLabel === serviceLabel);

        if (existingAlert) {
            existingAlert.reissued_at = new Date();

            if (existingAlert.dismissed) {
                const dismissedDate = new Date(existingAlert.dismissed);
                const now = new Date()
                if (reactivateAfterMs && (now.getTime() - dismissedDate.getTime() > reactivateAfterMs)) {
                    log(`Reactivating alert`, deviceWrapper, 'bgGreen');
                    delete existingAlert.dismissed;
                }
            }
            return existingAlert;
        }

        const now = new Date();

        const alert = {
            id: now.getTime(),
            channel: deviceWrapper.channel,
            message,
            level,
            serviceLabel,
            audiofile,
            playInterval,
            dismissable: !noDismiss,
            issued_at: now,
        };

        if (alertAudio) {
            alert.audiofile = audiofile ? audiofile : alertsSettings.defaultAudiofile ?? 'alert_error.mp3';
            alert.playInterval = playInterval ? playInterval : alertsSettings.defaultPlayInterval ?? 5 * MINUTE;
        }

        return alert;
    },

    playAudio(file, messageOnClose) {
        if (!file) {
            log(`Play audio file: no file provided.`, this.deviceWrapper, 'red');
            return;
        }

        const fullPath = './media-files/' + file;

        let playerInfo = (process.env.AUDIO_PLAYER_COMMAND ?? "afplay").split(" ");

        const player = playerInfo[0]; // First is the command itself
        const playerArgs = playerInfo.length > 1 ? playerInfo.slice(1) : [];
            
        const args = [...playerArgs, fullPath];

        log(`Playing audio file ${fullPath} with ${player}.`, this.deviceWrapper, "yellow");

        const thread = spawn(player, args);

        thread.on("error", (error) => {
            console.log(`error: ${error.message}`);
        });

        thread.on("close", (code) => {
            if (messageOnClose) {
                log(messageOnClose, this.deviceWrapper);
            }            
        });
    }

};

export { devicePool, constants };
