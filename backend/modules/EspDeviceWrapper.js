import _ from 'lodash';
import axios from 'axios';
import constants from '../constants.js';
import { log, debug } from './Log.js';
import { globalConfig } from '../configuration.js';
import { resolveDeviceDependencies } from './DependencyResolver.js';
import { makeLiveDeviceObject } from './TargetDataProcessor.js';
import { isToday } from "../helpers/jDateTimeUtils.js";

const espConstants = {

  thermo: {
    // How much does a reading need to differ from the previous to be considered and outlier?
    OUTLIER_THRESHOULD: 3,
  }
  
};


const EspDeviceWrapper = {
    device: null,
    initialized: false,

    addCallback(callbackFn, event) {
        log(`Adding callback to '${event}`, this);
    },

    init(cache, mapItem, globalConfig, deviceEventCallback, devicePool, socketHandler) {
        this.globalConfig = globalConfig;
        this.deviceEventCallback = deviceEventCallback;
        this.devicePool = devicePool;
        this.socketHandler = socketHandler;
        // Shared cache to keep ESP responses in and avoid querying for the same data multiple times.
        this.cache = cache;

        const requiredFields = [
            "alias",
            "channel",
            "id",
            "url",
            "settings",
            "display",
            "locationId",
            "type",
            "subType",
        ];

        this.alias = mapItem.alias;
        this.channel = mapItem.channel;
        this.id = mapItem.id;
        this.url = mapItem.url;
        const urlParts = mapItem.url.split(/[\/]+/);
        this.host = urlParts && urlParts.length > 1 ? urlParts[1] : "N/A";
        this.settings = mapItem.settings;
        this.display = mapItem.display;
        this.displayLabel = mapItem.displayLabel;
        this.displayType = mapItem.displayType;
        this.locationId = mapItem.locationId;
        this.type = mapItem.type;
        this.subType = mapItem.subType;

        resolveDeviceDependencies(this);

        requiredFields.forEach((field) => {
            if (!this.field) {
                return false;
            }
        });

        if (!cache.espUrls) {
            // Init cache.
            cache.espUrls = [];
            cache.espData = {};
            cache._pollingHandlers = {};
        }

        if (!cache.espUrls.includes(this.url)) {
            // Add this url to the urls array for polling.
            cache.espUrls.push(this.url);
        }

        // Query the esps at an interval and cache their responses.
        if (!cache._pollingIntervalHandler) {
            if (globalConfig[this.type]) {
                this.pollInterval = globalConfig[this.type].pollInterval;
            }

            if (!this.pollInterval) {
                this.pollInterval = constants.ESP_DEFAULT_POLL_INTERVAL ?? 10000;
            }

            if (!cache._pollingHandlers[this.url]) {
                // Not polling this url yet; spin up an interval.
                cache._pollingHandlers[this.url] = setInterval(async () => {
                    try {
                        const response = await axios(this.url);

                        cache.espData[this.url] = {
                            timestamp: Date.now(),
                            data: response?.data ?? null,
                        };
                    } catch (err) {
                        log(`Polling error for ${this.url}: ${err.message}`);
                    }
                }, this.pollInterval);
            }
        }
        this.startPolling();
    },

    // This will only poll the cache
    startPolling() {
        const pollInterval =
            (globalConfig[this.type] && globalConfig[this.type].pollInterval) ?? constants.ESP_DEFAULT_POLL_INTERVAL;
        log(`Polling and updating this ${this.type}-${this.subType} at ${this.url} every ${pollInterval} ms.`, this);

        if (this.subType === constants.SUBTYPE_THERMOMETER) {
            // Initialize the trend data cache (kept on this device)
            this.__trendData = {};

            Object.keys(this.settings.trends).forEach(
                (trendKey) =>
                    (this.__trendData[trendKey] = {
                        avgTempPast: null,
                        avgTempNow: null,
                        dataPoints: [],
                    })
            );
        }

        // Start the polling
        this._pollingIntervalHandler = setInterval(async () => {
            try {
                // Get the latest data for this device from the cache. This has a timestamp and a data field.
                const data = this.cache?.espData[this.url];
                this._updateOnlineState(data);

                // Payload is the actual new data in the cache for this device (which may be shared among several devices)
                let payload = data?.data;

                // Get changeInfo here for the entire ESP - may be overwritten by subtypes below.
                let changeInfo = this.analyzeStateChange(payload);

                if (data?.data) {
                    // Cache contains payload.
                    const { jsonPath, jsonPathId, jsonPathKey } = this.settings;

                    if (jsonPath && !data.data[jsonPath]) {
                        log(`Received invalid data.`, this, "bgRed");
                        return;
                    }

                    switch (this.subType) {
                        case constants.SUBTYPE_THERMOMETER:
                            // Multiple thermometers can be on an ESP device; look for the right temperature.
                            const payloadFieldKey = Object.keys(jsonPathId)[0];
                            payload = data.data[jsonPath].find(
                                (item) => item[payloadFieldKey] === jsonPathId[payloadFieldKey]
                            );

                            const latestDataPoint = this.getLatestDataPoint();
                            let temperaturePayload = payload[jsonPathKey] !== undefined ? 
                                this.mitigateOutlier(payload[jsonPathKey], latestDataPoint?.tempC) : 
                                undefined;

                            if (temperaturePayload === undefined) {
                                // No data.
                                log(`No data returned from device.`, this);
                                return;
                            }

                            changeInfo = this.analyzeStateChange(payload);

                            if (typeof changeInfo === "undefined") {
                                // This is the initial state update.
                                log(`Received initial state update.`, this);
                                this._updateState(payload);
                                this._emitDeviceStateUpdate(changeInfo);
                                return;
                            }

                            // Not the initial update, and may or may not have an actual change.

                            // This needs to be done regardless of whether the data changed from the last poll.
                            this.__trendData = this.processThermometerTrendData(this.__trendData, temperaturePayload);

                            // Inject the trends/trend field into the update payload (makes the addition of trend transparent).
                            payload.trends = {};

                            Object.keys(this.settings.trends).forEach((trendKey) => {
                                const diff = this.__trendData[trendKey] ? this.__trendData[trendKey].diff : 0;
                                const trend = this.__trendData[trendKey] ? this.__trendData[trendKey].trend : "n/a";
                                const historyLength = this.__trendData[trendKey]
                                    ? this.__trendData[trendKey].historyLength
                                    : "n/a";

                                payload.trends[trendKey] = {
                                    diff,
                                    trend,
                                    historyLength,
                                };
                            });

                            // Trenddata can change even if device data does not. Only trigger if significant part changes.
                            if (this.state?.diff?.toFixed(2) !== this.__trendData?.diff?.toFixed(2)) {
                                // Set changeInfo.changed to trigger a socket push.
                                changeInfo.changed = true;
                            }
                                                    
                            // Handle dayly min/max.
                            const now = new Date();
                            const daylyInitialData = {
                                date: now,
                                min: {
                                    tempC: temperaturePayload,
                                    updatedAt: now.getTime(),
                                },
                                max: {
                                    tempC: temperaturePayload,
                                    updatedAt: now.getTime(),
                                },
                            };
                            const dateChanged = this.state.dayly && !isToday(this.state.dayly.date);

                            if (!this.state.dayly) {
                                // Initialize (first run)
                                payload.dayly = daylyInitialData;
                            } else {
                                // Check if the date changed
                                if (dateChanged) {
                                    log(`Resetting dayly min/max temperature.`, this);
                                    // New day - reinit.
                                    payload.dayly = daylyInitialData;
                                } else {
                                    // Copy over the existing dayly field
                                    payload.dayly = { ...this.state.dayly };

                                    // Adjust data if needed.
                                    if (payload.dayly.min.tempC > temperaturePayload) {
                                        payload.dayly.min.tempC = temperaturePayload;
                                        payload.dayly.min.updatedAt = now.getTime();
                                    }
                                    if (payload.dayly.max.tempC < temperaturePayload) {
                                        payload.dayly.max.tempC = temperaturePayload;
                                        payload.dayly.max.updatedAt = now.getTime();
                                    }
                                }
                            }

                            if (this.settings.pushToDynforms) {
                                const measurement = {
                                    tempC: temperaturePayload,
                                    measuredAt: `__DATE-${now.getTime()}`,
                                };

                                if (!this._todaysData) {
                                    this._todaysData = {
                                        initialized: `__DATE-${now.getTime()}`,
                                        sensorId: this.id,
                                        sensorName: this.alias,
                                        sensorUrl: this.url,
                                        sensorLocationId: this.locationId,
                                        measurements: [],
                                    };
                                }

                                // Collect a sample at the configured interval.
                                if (
                                    !this._lastSampleCollect ||
                                    Date.now() - this._lastSampleCollect.getTime() >
                                        (this.settings.sampleCollectInterval ?? 5 * constants.MINUTE)
                                ) {
                                    this._lastSampleCollect = now;
                                    this._todaysData.measurements.push(measurement);
                                }

                                if (dateChanged) {
                                    log(
                                        `Sending yesterday's data to dynforms (${this._todaysData.measurements} samples)`,
                                        this
                                    );
                                    // Add in min/max for the day. (state.dayly is from previous day at this point and has the min/max.)
                                    const yesterdaysDayly = { ...this.state.dayly };
                                    this._todaysData.min = yesterdaysDayly.min.tempC;
                                    this._todaysData.minMeasuredAt = `__DATE-${yesterdaysDayly.min.updatedAt}`;
                                    this._todaysData.max = yesterdaysDayly.max.tempC;
                                    this._todaysData.maxMeasuredAt = `__DATE-${yesterdaysDayly.max.updatedAt}`;
                                    if (process.env.NODE_ENV === "development") {
                                        this._todaysData.env = "development";
                                    }
                                    // Add in mean from the available samples.
                                    const measurementsRaw = this._todaysData.measurements.map(
                                        (measurement) => measurement.tempC
                                    );
                                    const sum = measurementsRaw.reduce((acc, curr) => acc + curr, 0);
                                    this._todaysData.mean = parseFloat((sum / measurementsRaw.length).toFixed(2));

                                    // Send data and clear _todaysData.
                                    this.runPushRequest(this._todaysData).then(() => delete this._todaysData);
                                }
                            }
                            break;

                        case constants.SUBTYPE_BULB:
                            // All we care about here is the lights_on field
                            payload = payload.lights_on;
                            changeInfo = this.analyzeStateChange(payload);

                            if (typeof changeInfo === "undefined") {
                                // This is the initial state update.
                                log(`Received initial state update.`, this);
                                this._updateState(payload);
                                this._emitDeviceStateUpdate(changeInfo);
                                return;
                            }

                            break;

                        case constants.SUBTYPE_MAIL_COMPARTMENT:
                            // All we care about here is the door_locked field
                            if (payload.door_locked) {
                                if (payload.door_locked === "true") {
                                    const threshold = parseInt(payload.photo_circuit_threshold);
                                    const value = parseInt(payload.photo_circuit_raw2);
                                    if (value > threshold) {
                                        this.setAlerts([
                                            this.devicePool.createAlert(
                                                "Mailbox likely has a delivery.",
                                                "alert",
                                                this
                                            ),
                                        ]);
                                    } else {
                                        this.setAlerts([
                                            this.devicePool.createAlert(
                                                "Mailbox is locked but likely empty.",
                                                "warn",
                                                this
                                            ),
                                        ]);
                                    }
                                } else {
                                    this.setAlerts([]);
                                }
                            }

                            payload = payload.door_locked;

                            changeInfo = this.analyzeStateChange(payload);

                            if (typeof changeInfo === "undefined") {
                                // This is the initial state update.
                                log(`Received initial state update.`, this);
                                this._updateState(payload);
                                this._emitDeviceStateUpdate(changeInfo);
                                return;
                            }

                            break;

                        default:
                            break;
                    }

                    if (changeInfo?.changed) {
                        // This is an actual change.
                        this._updateState(payload);
                        this._emitDeviceStateUpdate(changeInfo);
                    } else {
                        // No change.
                        return;
                    }

                    switch (this.subType) {
                        case constants.SUBTYPE_THERMOMETER:
                            if (!Array.isArray(data.data[jsonPath])) {
                                throw new Error(
                                    `Bad data from device, expected array at jsonPath ${jsonPath} and got ${typeof data[
                                        jsonPath
                                    ]}.`
                                );
                            }

                            log(`${this.alias} temperature: ${this.state.tempC} °C`, this);
                            break;

                        default:
                            break;
                    }
                } else {
                    // No data in cache yet.
                }
            } catch (err) {
                log(`Polling error: ${err.message}`, this);
            }
        }, pollInterval);
    },

    /**
     * Calculate current trends from available history and add a new data point for currentTemp.
     *
     * @param {*} currTrendData
     * @returns {*} newTrendData
     */
    processThermometerTrendData(currTrendData, currentTemp) {
        const getAvgTempFromDataPoints = (dataPoints) =>
            dataPoints.reduce((prev, current, index) => {
                // First time the accumulator has the full object.
                const prevTemp = index === 1 ? prev.tempC : prev;

                const dataPointsAccumulated = index + 1;
                const newVal = (prevTemp * dataPointsAccumulated + Number(current.tempC)) / (dataPointsAccumulated + 1);

                return newVal;
            });

        const newDataPoint = {
            tempC: currentTemp,
            date: Date.now(),
        };

        const { trends } = this.settings;

        Object.keys(trends).forEach((trendKey) => {
            if (currTrendData) {
                const trendData = currTrendData[trendKey];

                if (trendData) {
                    trendData.dataPoints.push(newDataPoint);

                    const pollInterval = globalConfig[this.type].pollInterval;
                    const { avg_calc_history_length, avg_calc_data_window } = trends[trendKey];
                    const avg_calc_max_data_points = Math.round(avg_calc_data_window / pollInterval);
                    const cutoffDate = Date.now() - avg_calc_history_length;

                    // May discard one or a couple datapoints, depending on poll intervals.
                    while (trendData.dataPoints[0].date < cutoffDate) {
                        trendData.dataPoints.shift();
                    }

                    // Figure out how many data points we have and how many to use for the calculation.
                    const dataPointsAvailable = trendData.dataPoints.length;
                    const dataPointsToUse = Math.min(Math.floor(dataPointsAvailable / 2), avg_calc_max_data_points);

                    // Wait until at least 2 data points are available on each end of the history window.
                    if (dataPointsToUse > 1) {
                        /**
                         * The idea here is to average out the oldest and newest data points in two
                         * separate groups, then interpret the difference in avagerage temperature
                         * as the trend.
                         */
                        trendData.avgTempPast = getAvgTempFromDataPoints(
                            trendData.dataPoints.slice(0, dataPointsToUse)
                        );

                        trendData.avgTempNow = getAvgTempFromDataPoints(
                            trendData.dataPoints.slice(dataPointsAvailable - dataPointsToUse, dataPointsAvailable)
                        );

                        // diff represents the current trend.
                        trendData.diff = trendData.avgTempNow - trendData.avgTempPast;
                    }
                } else {
                    // No existing data.
                    trendData.avgTempPast = currentTemp;
                    trendData.avgTempNow = currentTemp;
                    trendData.dataPoints = [newDataPoint];
                }

                // Time window currently covered
                trendData.historyStart = Date.now();
                trendData.historyEnd = trendData.dataPoints[0].date;
                trendData.historyLength = trendData.historyStart - trendData.historyEnd;
            }
        });
        //[203, 204].includes(this.channel) && console.log('CurrTrenDData', currTrendData);
        return currTrendData;
    },

    /**
     * Compare newState against the current state of the device.
     *
     * @param   {} newState
     * @returns {} Infomation about the change or undefined if current state doesn't exist.
     */
    analyzeStateChange(newState) {
        if (this.state === undefined) {
            // Have no current state. Just received the first update.
            return undefined;
        }

        let changeInfo = {};
        changeInfo.changed = !_.isEqual(this.state, newState);

        switch (this.subType) {
            case constants.SUBTYPE_BULB:
            case constants.SUBTYPE_MAIL_COMPARTMENT:
                // These only have a boolean. So if 'state' changed, on_off changed too.
                changeInfo.on_off = changeInfo.changed;
                break;
        }

        return changeInfo;
    },

    getLatestDataPoint() {
        if (!this.__trendData) {
            return null;
        }

        const firstTrendKey = Object.keys(this.settings.trends)[0];
        const availableDatapoints = this.__trendData[firstTrendKey].dataPoints.length;

        if (!availableDatapoints) {
            return null;
        }

        return this.__trendData[firstTrendKey].dataPoints[availableDatapoints - 1];
    },

    getLiveDevice() {
        return makeLiveDeviceObject(
            this,
            [
                // Include
                "powerState",
                "hvacType",
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
    },

    /**
     * Return a state update to be emitted to the sockets
     */
    getLiveDeviceStateUpdate() {
        const data = {
            state: { 
                ...this.state,
                alerts: this.getAlerts(),
            },
            channel: this.channel,
            isOnline: this.isOnline,            
        };

        switch (this.type) {
            case constants.DEVICETYPE_ESP_RELAY:
                data.powerState = this.getPowerState();                
        }

        return data;
    },

    getAlerts() {
        if (!Array.isArray(this._alerts)) {
            return [];
        }

        return this._alerts;
    },

    setAlerts(alerts) {
        this._alerts = [...alerts];        
    },

    getPowerState() {
        switch (this.type) {
            case constants.DEVICETYPE_ESP_RELAY: // Includes mailbox lights, mailbox lock
                return !!this.state;
        }
    },

    async toggle() {
        switch (this.type) {
            case constants.DEVICETYPE_ESP_RELAY:
                const currentPowerState = this.getPowerState();

                try {
                    if (currentPowerState) {
                        await axios.get(this.settings.disengageUrl);
                        log(`Disengaging relay`, this);
                    } else {
                        await axios.get(this.settings.engageUrl);
                        log(`Engaging relay`, this);
                    }
                    const newPowerState = !currentPowerState;

                    this._updateCache(newPowerState);
                    this._updateState(newPowerState);
                    this._emitDeviceStateUpdate(this.analyzeStateChange(this.state));
                } catch (err) {
                    if (!this.__failCount) {
                        this.__failCount = 0;
                    }

                    this.__failCount++;

                    if (this.__failCount < 3) {
                        log(
                            `Error trying to switch relay: ${err.message}. Retrying (attempt ${this.__failCount + 1}).`,
                            this
                        );
                        // Try again
                        this.toggle();
                    } else {
                        log(`Error trying to switch relay: ${err.message}. Giving up.`, this);
                    }
                }

                break;
        }
    },

    // Send data to dynforms.
    async runPushRequest(record, extraData = {}) {
        const dynformsSettings = this.settings.dynformsSettings;
        if (!dynformsSettings) {
            return null;
        }

        const collectionName = dynformsSettings.request?.collectionName;
        if (!collectionName) {
            return null;
        }

        const request = {
            collectionName,
            record,
            ...extraData,
            clientId: this.getClientId(),
        };

        const url = this._constructFullUrlToPushEndpoint();
        log(
            `Running push request to ${url} (collection ${collectionName}), ${
                record?._id ? `updating record ${record._id}.` : `adding record: ${JSON.stringify(record)}`
            }`,
            this
        );
        return axios.post(url, request);
    },

    mitigateOutlier(tempC, previousTempC) {
        if (!previousTempC) {
            // If the first measurement isn't a reasonable reading, return 0 degrees.
            if (tempC > 50 || tempC < -50) {
                return 0;
            } else {
                return tempC;
            }            
        }

        // If it's a bad type, return previous
        if (typeof tempC !== 'number' || isNaN(tempC)) {
            return previousTempC;
        }

        if (Math.abs(previousTempC - tempC) >= espConstants.thermo.OUTLIER_THRESHOULD) {
            // Reading differs too much from previous.
            return previousTempC;
        } else {
            return tempC;
        }
    },

    getClientId() {
        // Construct a client ID that is specific to the app and service.
        return `${process.env.APP_NAME}.${this.id ?? this.channel}`;
    },

    _getBaseUrl() {
        let { protocol, baseUrl } = this.settings.dynformsSettings.api;

        if (!protocol) {
            protocol = "http";
        }

        if (!baseUrl) {
            baseUrl = `${protocol}://${process.env.DYNFORMS_HOST}:${process.env.DYNFORMS_PORT}`;
        }

        return baseUrl;
    },

    _constructFullUrlToPushEndpoint() {
        const baseUrl = this._getBaseUrl();
        if (!baseUrl) {
            return;
        }

        let path = this.settings.dynformsSettings?.api?.pathToPushEndpoint;
        if (!path) {
            path = process.env.DYNFORMS_M2M_PATH_PUSH ?? "/db/m2m/push";
        }

        return baseUrl + path;
    },


    _emitDeviceStateUpdate(changeInfo) {
        this.socketHandler.emitDeviceStateUpdate(this.getLiveDeviceStateUpdate(), changeInfo);
    },

    // Updates the timestamp on the cache entry for this device
    _updateCache(payload) {
        const data = this.cache?.espData[this.url];
        data.timestamp = Date.now();
        data.data = payload;
    },

    _updateOnlineState(cacheData) {
        if (cacheData?.timestamp > Date.now() - this.pollInterval * 2) {
            // Allow a bit of grace beyond the pollInterval
            this.isOnline = true;
            this.lastSeenAt = Date.now();
        } else {
            this.isOnline = false;
        }
    },

    _updateState(payload) {
        this.lastSeenAt = Date.now();

        if (typeof payload === "undefined") {
            log(`Error: Undefined payload in state update. Ignoring.`, this, "bgRed");
            return;
        }

        switch (this.type) {
            case constants.DEVICETYPE_ESP_RELAY:
                // It sends back a string! Dang!
                if (payload === "true") {
                    payload = true;
                }

                if (payload === "false") {
                    payload = false;
                }
                break;

            case constants.DEVICETYPE_ESP_THERMOMETER:
                // Handle the fact that some ESPs have different field names for the temperature field.
                const { jsonPathKey } = this.settings;

                if (jsonPathKey !== "tempC") {
                    payload.tempC = payload[jsonPathKey];
                    delete payload[jsonPathKey];
                }

                // Handle any outliers (invalid readings are included in outliers as they are extreme values like -127).
                const latestDataPoint = this.getLatestDataPoint();
                const latestTempC = latestDataPoint?.tempC;

                let readingIsOutlier = null;

                // If we have a previous sample, compare against, otherwise can't do anything.
                if (latestTempC) {
                    if (Math.random() > 0.5) {
                        payload.tempC = payload.tempC + 6;
                    }
                    if (Math.abs(latestTempC - payload.tempC) >= espConstants.thermo.OUTLIER_THRESHOULD) {
                        // Reading differs too much from previous.
                        readingIsOutlier = true;
                    } else {
                        readingIsOutlier = false;
                    }

                    if (readingIsOutlier) {
                        // Interpolate by overwriting the reading with the previous one.
                        payload.tempC = latestTempC;
                    }
                }

                if (latestTempC && Array.isArray(this.settings?.pushTo)) {
                    if (!this._pushTo) {
                        this._pushTo = {};
                    }

                    this.settings.pushTo.forEach(info => {
                        if (!info.id) {
                            return;
                        }

                        if (!this._pushTo[info.id] || (Date.now() - this._pushTo[info.id].getTime() > (info.interval ?? 5 * constants.MINUTE))) {
                            this._pushTo[info.id] = new Date();
                            axios
                                .post(info.url, {
                                    id: info.id,
                                    timestamp: Date.now(),
                                    locationId: this.locationId,
                                    tempC: latestTempC,
                                })
                                .then((data) => {
                                    log(`Pushed temperature to ${info.url}: ${latestTempC}. Response: ${JSON.stringify(data.data)}`, this, "yellow");                                    
                                })
                                .catch((err) => {
                                    log(`Unable to push temperature to ${info.url}: ${err.message}`, this, "bgRed");
                                });
                        }
                    })
                }
                break;
        }

        this.state = _.cloneDeep(payload);

        switch (this.type) {
            case constants.DEVICETYPE_ESP_RELAY:
                this.powerState = this.getPowerState();
                break;
        }
    },
};

export default EspDeviceWrapper;