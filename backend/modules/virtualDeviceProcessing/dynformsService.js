import _ from "lodash";
import axios from "axios";
import { makeLiveDeviceObject } from "../TargetDataProcessor.js";
import constants from "../../constants.js";
import { log, debug } from "../Log.js";
import { getDisplayDataFromApiResponse, dynformsDbFilters, requestShouldRun } from "../../helpers/dynformsData.js";

const localConstants = constants.DEVICETYPE_DEFAULTS[constants.DEVICETYPE_VIRTUAL][constants.SUBTYPE_DYNFORMS_SERVICE];

class DynformsServiceHandler {
    constructor(devicePool, service, cache) {
        this.initialized = false;

        this.devicePool = devicePool;
        this.service = service;
        this.init(cache);
    }

    analyzeStateChange(oldState, newState) {
        if (oldState === undefined) {
            // Have no current state. Just received the first update.
            return undefined;
        }

        let changeInfo = {};
        changeInfo.on_off = oldState?.powerState !== newState?.powerState;
        changeInfo.api = !_.isEqual(oldState?.api?.data?.records, newState?.api?.data?.records);
        changeInfo.changed = changeInfo.on_off || changeInfo.api;

        return changeInfo;
    }

    getLiveDevice() {
        const liveDevice = makeLiveDeviceObject(
            this.service,
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

    _getBaseUrl() {
        if (!this.service) {
            return null;
        }

        let { protocol, baseUrl } = this.service.settings.api;

        if (!protocol) {
            protocol = "http";
        }

        if (!baseUrl) {
            baseUrl = `${protocol}://${process.env.DYNFORMS_HOST}:${process.env.DYNFORMS_PORT}`;
        }

        return baseUrl;
    }

    _constructFullUrlToPullEndpoint() {
        const baseUrl = this._getBaseUrl();
        if (!baseUrl) {
            return;
        }

        let path = this.service.settings.api?.pathToPullEndpoint;
        if (!path) {
            path = process.env.DYNFORMS_M2M_PATH_PULL ?? "/db/m2m/pull";
        }

        return baseUrl + path;
    }

    _constructFullUrlToPushEndpoint() {
        const baseUrl = this._getBaseUrl();
        if (!baseUrl) {
            return;
        }

        let path = this.service.settings.api?.pathToPushEndpoint;
        if (!path) {
            path = process.env.DYNFORMS_M2M_PATH_PUSH ?? "/db/m2m/push";
        }

        return baseUrl + path;
    }
    _constructRequests(requestIndexes = null) {
        if (!this.service) {
            return null;
        }

        const requestInfo = this.service.settings?.requests;

        if (!(Array.isArray(requestInfo) && requestInfo.length)) {
            // No requests configured.
            return null;
        }

        const requests = [];

        requestInfo.forEach((info, requestIndex) => {
            if (
                !(requestIndexes === null || (Array.isArray(requestIndexes) && requestIndexes.includes(requestIndex)))
            ) {
                return;
            }

            const request = {
                connectionName: info.connectionName ?? localConstants.connectionName,
                collectionName: info.collectionName,
                sessionId: null,
                settings: {},
                orderBy: info.retrieve.orderBy ?? {},
            };

            if (info.retrieve?.filters) {
                request.filter = this.resolveFilters(info.retrieve?.filters) ?? {};
            }

            if (info.retrieve?.singleRecord) {
                request.settings.singleRecord = info.retrieve.singleRecord;

                switch (info.retrieve.singleRecord.type) {
                    case "__INDEX":
                        // Find out what the last requested index was.
                        let lastIndex = -1;

                        if (this.service.settings.useSingleRequest) {
                            lastIndex = this.service.state.api?.data?.index ?? -1;
                        } else {
                            const allData = this.service.state.api;

                            if (Array.isArray(allData) && allData.length > requestIndex) {
                                lastIndex = allData[requestIndex].data?.index ?? -1;
                            }
                        }

                        // Add one to get the next record.
                        request.settings.singleRecord.index = lastIndex + 1;
                        break;

                    case "__RANDOMIZED_PREORDERED":
                        // Use the dynforms semi-random algorithm
                        request.settings.singleRecord.semiRandom = true;
                        break;

                    default:
                        log(
                            `Error: cannot construct request. Unkown single-record request type ${info.retrieve.singleRecord.type},`,
                            this.service,
                            "red"
                        );
                        return;
                }
            }

            requests.push(request);
        });

        return requests;
    }

    resolveFilters(filtersInfo) {
        const resultFilter = {};

        if (!Array.isArray(filtersInfo)) {
            return resultFilter;
        }

        filtersInfo.forEach((info) => {
            const { field, type, match } = info;
            const { filterName } = match;

            if (type === "dynamic") {
                switch (filterName) {
                    case "__CURRENT_DATE":
                        /**
                         * Matching today's date, optionally with a range before/after.
                         */
                        resultFilter[field] = dynformsDbFilters.applyCurrentDateFilter(match);
                        break;

                    default:
                        dynformsDbFilters.applyStaticFilter(match, resultFilter);
                        console.log(resultFilter);
                        break;
                }
            }
        });

        return resultFilter;
    }

    init(cache) {
        if (!(this.service && this.devicePool && this.service.settings?.api)) {
            log(`Failed to initialize Dynforms service.`, this, "red");
            return false;
        }

        if (!cache) {
            console.error("DynformsService init failed - did not get cache reference.");
            return false;
        }
        // Store the cache reference.
        this.cache = cache;
        this.cache.data = {};

        this.service.fullUrlPull = this._constructFullUrlToPullEndpoint();
        this.service.fullUrlPush = this._constructFullUrlToPushEndpoint();

        // Turn on when first starting.
        this.service.setPowerState(true);

        this.service._deviceHandlers = this;

        this.service.subscribeListener("powerState", (newPowerState) => {});

        log(
            `Initialized ${this.service.subType} "${this.service.alias}" with pull@${
                this.service.fullUrlPull ? this.service.fullUrlPull : "(not configured)"
            } and push@${this.service.fullUrlPush ? this.service.fullUrlPush : "(not configured)"}`,
            this.service
        );
        log(
            `Check-Interval: ${Math.ceil(this.service.settings.checkInterval / constants.MINUTE)} minutes.`,
            this.service
        );

        // Start the interval check
        if (this._checkingIntervalHandler) {
            clearInterval(this._checkingIntervalHandler);
        }

        const interval = this.service.settings.checkInterval ?? localConstants.CHECKING_INTERVAL_DEFAULT;

        this._checkingIntervalHandler = setInterval(() => this.dynformsServiceIntervalHandler(), interval);

        this.initialized = true;

        // Trigger an initial API call. THERES A TIMINIG ISSUE HERE - WITHOUT THE DELAY THE FRONTEND WONT GET THE UPDATE
        setTimeout(() => {
            this.dynformsServiceIntervalHandler();
        }, 5000);
    }

    async runPushRequest(record) {
        const url = this.service.fullUrlPush;
        log(`Running post request: ${url}`, this.service);
        return axios.post(url, { collectionName: "photosFileInfo", record });
    }

    async runRequestNow(requestIndex) {
        if (!this.initialized) {
            return false;
        }

        const requests = this._constructRequests([requestIndex]);
        const request = Array.isArray(requests) && requests.length ? requests[0] : null;

        this._executeRequest(request, requestIndex)
            .then((data) => {
                this.cache.data[requestIndex] = data.data;
            })
            .catch((err) => {
                log(`${this.service.alias}: API request failed`, this.service, "red");
            })
            .then((data) => {
                this.processCachedApiResponse();
            })
            .catch((err) => {
                log(`${this.service.alias}: Processing API response failed`, this.service, "red");
            });
    }

    async _executeRequest(requestInfo, requestIndex) {
        const requestConfig = this.service.settings.requests[requestIndex];
        requestConfig._lastExecuted = new Date();
        return axios.post(this.service.fullUrlPull, requestInfo);
    }

    async dynformsServiceIntervalHandler() {
        if (!this.initialized) {
            return false;
        }

        // Get those requests that are due to run. Construct them now, as they may contain a reference to the current date.
        const requestsReadyToRun = this._constructRequests().filter((requestInfo, requestIndex) => {
            const requestConfig = this.service.settings.requests[requestIndex];
            return requestShouldRun(requestConfig, requestConfig._lastExecuted) ? true : false;
        });

        if (!requestsReadyToRun.length) {
            // Nothing to do
            return;
        }

        log(`${this.service.alias} has ${requestsReadyToRun.length} request(s) ready to run.`, this.service);

        // Add the current timestamp to each of the requests that are about to be executed.
        const now = new Date();

        const promises = requestsReadyToRun.map((requestInfo, requestIndex) => {
            const requestConfig = this.service.settings.requests[requestIndex];
            requestConfig._lastExecuted = now;
            return axios.post(this.service.fullUrlPull, requestInfo);
        });

        Promise.all(promises)
            .then((allResponseData) => {
                // Cache the responses.
                this.cache.data = allResponseData.map((data, requestIndex) => data?.data);
                this.processCachedApiResponse();
            })
            .catch((err) => {
                console.log(err.message, err);
            });
    }

    /**
     * Update state after a request came back.
     */
    processCachedApiResponse() {
        let displayData = getDisplayDataFromApiResponse(this.cache.data, this.service.settings);

        // See if a _processApiResponse handler exists for this device.
        const commandHandler = this.service.commandHandlersExtension
            ? this.service.getCommandHandler("_processApiResponse")
            : null;

        if (commandHandler) {
            displayData = commandHandler(this.service, displayData);
        }

        this.service._updateState(
            {
                powerState: this.service.getPowerState(),
                api: displayData,
                settings: this.service.settings,
            },
            true
        );

        log(`${this.service.alias} received API data from ${this.service.fullUrlPull}`, this.service);
    }
}

function dynformsServiceHandler(devicePool, service, cache) {
    return new DynformsServiceHandler(devicePool, service, cache);
}

export default dynformsServiceHandler;
