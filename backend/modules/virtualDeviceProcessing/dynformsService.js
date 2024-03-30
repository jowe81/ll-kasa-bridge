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

    _constructFullUrlToDeleteByIdEndpoint() {
        const baseUrl = this._getBaseUrl();
        if (!baseUrl) {
            return;
        }

        let path = this.service.settings.api?.pathToDeleteByIdEndpoint;
        if (!path) {
            path = process.env.DYNFORMS_M2M_PATH_DELETE_BY_ID ?? "/db/m2m/deleteById";
        }

        return baseUrl + path;
    }

    _constructFullUrlToMacroEndpoint() {
        const baseUrl = this._getBaseUrl();
        if (!baseUrl) {
            return;
        }

        let path = this.service.settings.api?.pathToMacroEndpoint;
        if (!path) {
            path = process.env.DYNFORMS_M2M_PATH_DELETE_BY_ID ?? "/db/m2m/macro";
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
            if (info.requestType === "push") {
                // Its a push request - ignored here altogether.
                return;
            }

            if (
                !(requestIndexes === null || (Array.isArray(requestIndexes) && requestIndexes.includes(requestIndex)))
            ) {
                return;
            }

            const request = {
                connectionName: info.connectionName ?? localConstants.connectionName,
                collectionName: info.collectionName,
                requestType: info.requestType,
                sessionId: null,
                settings: info.settings ?? {},
                filter: info.query?.filter ?? {},
                orderBy: info.retrieve?.orderBy ?? {},
            };

            switch (info.requestType) {
                case "macro":
                    break;

                case "pull":
                default:
                    if (info.retrieve?.filters) {
                        request.filter = this.resolveFilters(info.retrieve?.filters) ?? {};
                    }

                    if (info.retrieve?.singleRecord) {
                        request.settings.singleRecord = info.retrieve.singleRecord;

                        switch (info.retrieve.singleRecord.type) {
                            case "__RANDOMIZED_PREORDERED":
                                // Use the dynforms semi-random algorithm
                                request.settings.singleRecord.type = "__RANDOMIZED_PREORDERED";
                                break;

                            case "__CURSOR_INDEX":
                                request.settings.singleRecord.type = "__CURSOR_INDEX";
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
                    break;
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
                        break;
                }
            } else {
                dynformsDbFilters.applyStaticFilter(match, resultFilter);
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
        this.cache.pausedRequestIndexes = [];

        this.service.fullUrlPush = this._constructFullUrlToPushEndpoint();
        this.service.fullUrlDeleteById = this._constructFullUrlToDeleteByIdEndpoint();

        this.service.fullUrls = {
            pull: this._constructFullUrlToPullEndpoint(),
            push: this.service.fullUrlPush,
            deleteById: this.service.fullUrlDeleteById,
            macro: this._constructFullUrlToMacroEndpoint(),
        };

        // Turn on when first starting.
        this.service.setPowerState(true);

        this.service._deviceHandlers = this;

        this.service.subscribeListener("powerState", (newPowerState) => {});

        log(
            `Initialized ${this.service.subType} "${this.service.alias}" with pull@${
                this.service.fullUrls.pull ? this.service.fullUrls.pull : "(not configured)"
            }, push@${this.service.fullUrls.push ? this.service.fullUrls.push : "(not configured)"}, and deleteById@${
                this.service.fullUrls.deleteById ? this.service.fullUrls.deleteById : "(not configured)"
            }.`,
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

    getClientId() {
        // Construct a client ID that is specific to the app and service.
        return `${process.env.APP_NAME}.${this.service.id ?? this.service.channel}`;
    }

    pauseResumeRequest(requestIndex) {
        let { pausedRequestIndexes } = this.cache;
        let newIndexes;
        let result = null;

        if (pausedRequestIndexes.includes(requestIndex)) {
            newIndexes = pausedRequestIndexes.filter((index) => index !== requestIndex);
            result = "resume";
        } else {
            newIndexes = [...pausedRequestIndexes, requestIndex];
            result = "pause";
        }

        this.cache.pausedRequestIndexes = newIndexes;

        const newState = _.cloneDeep(this.service.state);
        newState.requests.pausedRequestIndexes = newIndexes;
        this.service._updateState(newState, true);

        return result;
    }

    getRequestConfig(requestIndex) {
        if ([null, undefined].includes(requestIndex)) {
            return null;
        }

        if (
            !Array.isArray(this.service.settings.requests) ||
            this.service.settings.requests.length < requestIndex + 1
        ) {
            // Request config not found
            return null;
        }

        return this.service.settings.requests[requestIndex];
    }

    async runDeleteByIdRequest(recordId, requestIndex) {
        const requestConfig = this.getRequestConfig(requestIndex);
        if (!requestConfig) {
            return null;
        }

        const collectionName = requestConfig.collectionName;

        const request = {
            collectionName,
            recordId,
            clientId: this.getClientId(),
        };

        const url = this.service.fullUrlDeleteById;
        log(
            `Running deleteById request  (${requestIndex}) to ${url} (collection ${collectionName}), removing record ${recordId}.`,
            this.service
        );
        return axios.post(url, request);
    }

    async runPushRequest(record, requestIndex, extraData = {}) {
        if ([null, undefined].includes(requestIndex)) {
            return null;
        }

        if (
            !Array.isArray(this.service.settings.requests) ||
            this.service.settings.requests.length < requestIndex + 1
        ) {
            // Request config not found
            return null;
        }
        const collectionName = this.service.settings.requests[requestIndex].collectionName;

        const request = {
            collectionName,
            record,
            ...extraData,
            clientId: this.getClientId(),
        };

        const url = this.service.fullUrlPush;
        log(
            `Running push request  (${requestIndex}) to ${url} (collection ${collectionName}), ${
                record?._id ? `updating record ${record._id}.` : `adding record: ${JSON.stringify(record)}`
            }`,
            this.service
        );
        return axios.post(url, request);
    }

    async runRequestNow(requestIndex, extraData) {
        if (!this.initialized) {
            return false;
        }

        if (!(typeof requestIndex === "number")) {
            log(`Error: no request index. `, this.service, "red");
        }

        const requests = this._constructRequests([requestIndex]);

        let request = {};

        const mainData = Array.isArray(requests) && requests.length ? requests[0] : null;
        if (mainData) {
            request = {
                ...mainData,
            };
        }

        if (extraData) {
            request = {
                ...request,
                ...extraData,
            };
        }

        let data;
        try {
            data = await this._executeRequest(request, requestIndex);
            this.cache.data[requestIndex] = data.data;
            this.processCachedApiResponse(requestIndex);
        } catch (err) {
            log(`${this.service.alias}: API request failed`, this.service, "red");
        }
        return data;
    }

    async _executeRequest(requestInfo, requestIndex) {
        const requestConfig = this.service.settings.requests[requestIndex];
        requestConfig._lastExecuted = new Date();
        requestInfo.clientId = this.getClientId();

        const url = this.service.fullUrls[requestInfo.requestType ?? "pull"];
        return axios.post(url, requestInfo);
    }

    async dynformsServiceIntervalHandler() {
        if (!this.initialized) {
            return false;
        }

        // Get those requests that are due to run. Construct them now, as they may contain a reference to the current date.
        let pausedRequestsCount = 0;

        const requestsReadyToRun = this._constructRequests().filter((requestInfo, requestIndex) => {
            const requestConfig = this.service.settings.requests[requestIndex];
            const requestIsDue = requestShouldRun(requestConfig, requestConfig._lastExecuted) ? true : false;

            if (requestIsDue) {
                if (!this.cache.pausedRequestIndexes.includes(requestIndex)) {
                    return true;
                }

                // Request is paused.
                pausedRequestsCount++;
            }

            return false;
        });

        if (pausedRequestsCount) {
            log(
                `${this.service.alias} has ${pausedRequestsCount} requests that are due to run but currently paused.`,
                this.service,
                "yellow"
            );
        }

        if (!requestsReadyToRun.length) {
            // Nothing to do
            return;
        }

        log(`${this.service.alias} has ${requestsReadyToRun.length} request(s) ready to run.`, this.service);

        // Add the current timestamp to each of the requests that are about to be executed.
        const now = new Date();

        const promises = requestsReadyToRun.map((requestInfo, requestIndex) => {
            const url = this.service.fullUrls[requestInfo.requestType ?? "pull"];
            const requestConfig = this.service.settings.requests[requestIndex];
            requestConfig._lastExecuted = now;
            log(
                `Request ${requestIndex}: ${url} ${JSON.stringify(requestInfo)}`,
                this.service,
                "yellow"
            );
            
            requestInfo.clientId = this.getClientId();

            return axios.post(url, requestInfo);
        });

        if (promises.length) {
            Promise.all(promises)
                .then((allResponseData) => {
                    // Cache the responses.
                    allResponseData.forEach((data, requestIndex) => {
                        this.cache.data[requestIndex] = data.data;
                        this.processCachedApiResponse(requestIndex);
                    });
                })
                .catch((err) => {
                    console.log(err.message, err);
                });
        } else {
            // No new data, but might still want to check if there might be alert changes?
        }
    }

    /**
     * Update state after a request came back.
     */
    processCachedApiResponse(requestIndex) {
        let displayData = getDisplayDataFromApiResponse(
            this.cache.data[requestIndex],
            this.service.settings,
            requestIndex
        );

        let processApiResponseHandler, getAlertsHandler;
        if (this.service.commandHandlersExtension) {
            // See if a _processApiResponse handler exists for this device.
            processApiResponseHandler = this.service.getCommandHandler("_processApiResponse");

            // See if a _getAlerts handler exists for this device.
            getAlertsHandler = this.service.getCommandHandler("_getAlerts");
        }

        if (processApiResponseHandler) {
            displayData = processApiResponseHandler(this.service, displayData, requestIndex);
        }

        const newState = {
            ...this.service.state,
            powerState: this.service.getPowerState(),
            api: displayData,
            requests: {
                ...this.service.state.requests,
                [requestIndex]: displayData,
                lastReturnedRequestIndex: requestIndex,
            },
            settings: this.service.settings,
        };

        if (getAlertsHandler) {
            const alerts = getAlertsHandler(this.service, displayData, requestIndex);
            if (alerts !== null) {
                newState.alerts = alerts;
            }            
        }

        this.service._updateState(newState, true);

        log(`${this.service.alias} received API data from request #${requestIndex}`, this.service);
    }
}

function dynformsServiceHandler(devicePool, service, cache) {
    return new DynformsServiceHandler(devicePool, service, cache);
}

export default dynformsServiceHandler;
