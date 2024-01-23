import _ from "lodash";
import { createDAVClient } from "tsdav";
import nodeIcal from "node-ical";
import axios, { all } from "axios";
import { makeLiveDeviceObject } from "../TargetDataProcessor.js";
import constants from "../../constants.js";
import { log, debug } from "../Log.js";

const localConstants = constants.DEVICETYPE_DEFAULTS[constants.DEVICETYPE_VIRTUAL][constants.SUBTYPE_DAV_SERVICE];

class DavServiceHandler {
    constructor(devicePool, deviceHandler, cache) {
        this.initialized = false;

        this.devicePool = devicePool;
        this.deviceHandler = deviceHandler;
        this.init(cache);
    }

    analyzeStateChange(oldState, newState) {
        if (oldState === undefined) {
            // Have no current state. Just received the first update.
            return undefined;
        }

        let changeInfo = {};
        changeInfo.on_off = oldState?.powerState !== newState?.powerState;
        changeInfo.changed = changeInfo.on_off || changeInfo.deviceHandler;

        return changeInfo;
    }

    getLiveDevice() {
        const liveDevice = makeLiveDeviceObject(
            this.deviceHandler,
            [
                // Include
                "powerState",
            ],
            {
                // Default
                display: true,
            },
            [
                // Exclude
            ],
            // Use global defaults
            true
        );

        liveDevice.data = this.cache?.data;

        return liveDevice;
    }

    init(cache) {
        if (!(this.deviceHandler && this.devicePool && this.deviceHandler.settings)) {
            log(`Failed to initialize Dav deviceHandler.`, this, "red");
            return false;
        }

        if (!cache) {
            console.error("Dav init failed - did not get cache reference.");
            return false;
        }

        this.deviceHandler._deviceHandlers = this;

        // Store the cache reference.
        this.cache = cache;
        this.cache.data = {};

        this.resolveApiCredentials();

        // Turn on when first starting.
        this.deviceHandler.setPowerState(true);
        this.deviceHandler.subscribeListener("powerState", (newPowerState) => {});

        // Start the interval check
        if (this._checkingIntervalHandler) {
            clearInterval(this._checkingIntervalHandler);
        }

        const interval = this.deviceHandler.settings.checkInterval ?? localConstants.CHECKING_INTERVAL_DEFAULT;

        this._checkingIntervalHandler = setInterval(() => this.serviceIntervalHandler(), interval);

        this.initialized = true;

        log(`Initialized ${this.deviceHandler.subType} "${this.deviceHandler.alias}".`, this.deviceHandler);
        log(
            `Check-Interval: ${Math.round(interval / constants.SECOND)} seconds (~ ${Math.round(
                interval / constants.MINUTE
            )} minutes).`,
            this.deviceHandler
        );

        // Trigger an initial API call. THERES A TIMINIG ISSUE HERE - WITHOUT THE DELAY THE FRONTEND WONT GET THE UPDATE
        setTimeout(() => {
            this.serviceIntervalHandler();
        }, 5000);
    }

    resolveApiCredentials() {
        this.apiCredentials = [];

        const remotes = this.deviceHandler.settings?.remotes;
        if (Array.isArray(remotes)) {
            remotes.forEach((remoteSettings, index) => {
                const credentials = {};
                if (typeof remoteSettings.credentials === "object") {
                    Object.keys(remoteSettings.credentials).forEach((key) => {
                        const envKey = remoteSettings.credentials[key];
                        credentials[key] = process.env[envKey];
                    });
                }

                const { label, serverUrl, authMethod, defaultAccountType } = remoteSettings;

                this.apiCredentials.push({
                    index,
                    label,
                    defaultAccountType,
                    serverUrl,
                    authMethod,
                    credentials,
                });
            });
        }
    }

    async serviceIntervalHandler() {
        if (!this.initialized) {
            return false;
        }
        
        const calendarObjectsByRemotes = {};
        const promises = this.apiCredentials.map(async (settings, index) => {
            const { serverUrl, authMethod, defaultAccountType, credentials } = settings;

            try {
                const client = await createDAVClient({
                    serverUrl,
                    authMethod,
                    defaultAccountType,
                    credentials,
                });

                const calendars = await client.fetchCalendars();

                const calendarObjects = await client.fetchCalendarObjects({
                    calendar: calendars[0],
                });

                const convertedCalendarObjects = [];

                calendarObjects.forEach((calendarObject) => {
                    const parsed = nodeIcal.parseICS(calendarObject.data);
                    const items = Object.values(parsed).filter((item) => true || item.type === "VEVENT");

                    items.forEach((vevent) => {
                        convertedCalendarObjects.push({
                            ...vevent,
                            calendarLabel: settings.label,
                            calendarIndex: index,
                        });
                    });
                });
                calendarObjectsByRemotes[index] = convertedCalendarObjects;
            } catch (err) {
                log(`API Error: ${err.message}`, this.deviceHandler, "bgRed");
            }
        });

        log(`Pulling events from ${promises.length} calendars...`, this.deviceHandler);

        await Promise.all(promises);

        this.cache.data.calendarObjectsByRemotes = calendarObjectsByRemotes;
        this.processCachedApiResponse();    
    }

    /**
     * Update state after a request came back.
     */
    processCachedApiResponse() {
        const eventsByRemote = this.cache.data.calendarObjectsByRemotes ?? [];

        let allItems = [];

        Object.values(eventsByRemote).forEach(eventsFromRemote => {
            allItems.push(...eventsFromRemote);
        })

        let displayData = {
            allItems,
            events: allItems.filter(item => item.type === 'VEVENT').sort((a, b) => a.start > b.start ? 1 : -1),
        };

        this.deviceHandler._updateState(
            {
                powerState: this.deviceHandler.getPowerState(),
                api: displayData,
                settings: this.deviceHandler.settings,
            },
            true
        );
        log(
            `${this.deviceHandler.alias} received API data from ${this.deviceHandler.settings.remotes.length} remote(s): ${displayData.events.length} items.`,
            this.deviceHandler
        );
    }

}

function davServiceHandler(devicePool, deviceHandler, cache) {
    return new DavServiceHandler(devicePool, deviceHandler, cache);
}

export default davServiceHandler;