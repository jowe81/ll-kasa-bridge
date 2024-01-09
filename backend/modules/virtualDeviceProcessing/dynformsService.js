import _ from "lodash";
import axios from "axios";
import { makeLiveDeviceObject } from "../TargetDataProcessor.js";
import constants from "../../constants.js";
import { log, debug } from "../Log.js";
import { getDisplayDataFromApiResponse, dynformsDbFilters, requestShouldRun } from "../../helpers/dynformsData.js";

const localConstants =
    constants.DEVICETYPE_DEFAULTS[constants.DEVICETYPE_VIRTUAL][
        constants.SUBTYPE_DYNFORMS_SERVICE
    ];

class DynformsServiceHandler {
    constructor(devicePool, dynformsService, cache) {
        this.initialized = false;

        this.devicePool = devicePool;
        this.dynformsService = dynformsService;
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
            this.dynformsService,
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

    _constructFullUrl() {
        if (!this.dynformsService) {
            return null;
        }

        let { protocol, baseUrl, path } = this.dynformsService.settings.api;

        if (!protocol) {
          protocol = "http";
        }

        if (!baseUrl) {
          baseUrl = `${protocol}://${process.env.DYNFORMS_HOST}:${process.env.DYNFORMS_PORT}`;
        }

        if (!path) {
          path = process.env.DYNFORMS_PATH ?? "/db/m2m/pull";          
        }

        return baseUrl + path;
    }

    _constructRequests() {
        if (!this.dynformsService) {
            return null;
        }

        const requestInfo = this.dynformsService.settings?.requests;

        if (!(Array.isArray(requestInfo) && requestInfo.length)) {
            // No requests configured.
            return null;
        }

        const requests = [];

        requestInfo.forEach((info, requestIndex) => {          
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
                case '__INDEX':                  
                  // Find out what the last requested index was.
                  let lastIndex = -1;

                  if (this.dynformsService.settings.useSingleRequest) {
                      lastIndex = this.dynformsService.state.api?.data?.index ?? -1;
                  } else {
                      const allData = this.dynformsService.state.api;

                      if (Array.isArray(allData) && allData.length > requestIndex) {
                          lastIndex = allData[requestIndex].data?.index ?? -1;
                      }
                  }

                  // Add one to get the next record.
                  request.settings.singleRecord.index = lastIndex + 1;
                  break;
                
                case '__SEMI_RANDOM':
                  // Use the dynforms semi-random algorithm
                  request.settings.singleRecord.semiRandom = true;
                  break;
                  
                default:
                  log(`Error: cannot construct request. Unkown single-record request type ${info.retrieve.singleRecord.type},`, this.dynformsService, 'red');
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
      
      filtersInfo.forEach(info => {
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
        }        
      });

      return resultFilter;
    }

    

    init(cache) {
        if (
            !(
                this.dynformsService &&
                this.devicePool &&
                this.dynformsService.settings?.api
            )
        ) {
            log(`Failed to initialize Dynforms service.`, this, "red");
            return false;
        }

        if (!cache) {
            console.error(
                "DynformsService init failed - did not get cache reference."
            );
            return false;
        }
        // Store the cache reference.
        this.cache = cache;
        this.cache.data = [];

        this.dynformsService.fullUrl = this._constructFullUrl();

        // Turn on when first starting.
        this.dynformsService.setPowerState(true);

        this.dynformsService._deviceHandlers = this;

        this.dynformsService.subscribeListener(
            "powerState",
            (newPowerState) => {}
        );

        log(
            `Initialized ${this.dynformsService.subType} "${this.dynformsService.alias}" with ${this.dynformsService.fullUrl}`,
            this.dynformsService
        );
        log(
            `Check-Interval: ${Math.ceil(
                this.dynformsService.settings.checkInterval / constants.MINUTE
            )} minutes.`,
            this.dynformsService
        );

        // Start the interval check
        if (this._checkingIntervalHandler) {
            clearInterval(this._checkingIntervalHandler);
        }

        const interval = this.dynformsService.settings.checkInterval ?? localConstants.CHECKING_INTERVAL_DEFAULT;

        this._checkingIntervalHandler = setInterval(
            () => this.dynformsServiceIntervalHandler(),
            interval
        );

        this.initialized = true;

        // Trigger an initial API call. THERES A TIMINIG ISSUE HERE - WITHOUT THE DELAY THE FRONTEND WONT GET THE UPDATE
        setTimeout(() => { this.dynformsServiceIntervalHandler() }, 5000);
    }

    async dynformsServiceIntervalHandler() {
        if (!this.initialized) {
            return false;
        }

        // Get those requests that are due to run. Construct them now, as they may contain a reference to the current date.
        const requestsReadyToRun = this._constructRequests().filter((requestInfo, requestIndex) => {
          const requestConfig = this.dynformsService.settings.requests[requestIndex];
          return requestShouldRun(requestConfig, requestConfig._lastExecuted) ? true : false;
        });

        if (!requestsReadyToRun.length) {
          // Nothing to do
          return;
        }

        log(`${this.dynformsService.alias} has ${requestsReadyToRun.length} request(s) ready to run.`, this.dynformsService);

        // Add the current timestamp to each of the requests that are about to be executed.
        const now = new Date();

        const promises = requestsReadyToRun.map((requestInfo, requestIndex) => {
            const requestConfig = this.dynformsService.settings.requests[requestIndex];
            requestConfig._lastExecuted = now;
            return axios.post(this.dynformsService.fullUrl, requestInfo);
        });

        Promise.all(promises)
          .then((allResponseData) => {
              // Cache the responses.
              this.cache.data = allResponseData.map((data, requestIndex) => data?.data);
              const displayData = getDisplayDataFromApiResponse(this.cache.data, this.dynformsService.settings);

              this.dynformsService._updateState({
                powerState: this.dynformsService.getPowerState(),
                api: displayData,
                settings: this.dynformsService.settings,
              }, true);

              log(`${this.dynformsService.alias} received API data from ${this.dynformsService.fullUrl}`, this.dynformsService);
          })
          .catch(err => {
            console.log(err.message, err);
          })
    }
}

function dynformsServiceHandler(devicePool, dynformsService, cache) {
    return new DynformsServiceHandler(devicePool, dynformsService, cache);
}

export default dynformsServiceHandler;
