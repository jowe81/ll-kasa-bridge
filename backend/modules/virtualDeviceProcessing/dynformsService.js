import _ from "lodash";
import axios from "axios";
import { makeLiveDeviceObject } from "../TargetDataProcessor.js";
import constants from "../../constants.js";
import { log, debug } from "../Log.js";
import { getDisplayDataFromApiResponse } from "../../helpers/dynformsData.js";

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
        changeInfo.changed = !_.isEqual(oldState, newState);
        changeInfo.on_off = oldState?.powerState !== newState.powerState;
        changeInfo.target = newState?.target !== oldState?.target;

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

    getFullUrl() {
        if (!this.dynformsService) {
            return false;
        }

        const { baseUrl, path, queryParams } = this.dynformsService.settings.api;

        if (!baseUrl) {
            return false;
        }

        let queryString = "";
        Object.keys(queryParams).forEach(
            (key) => (queryString += `&${key}=${queryParams[key]}`)
        );

        let fullUrl = `${baseUrl}${path}`;

        if (queryString) {
            fullUrl += "?" + queryString.substring(1);
        }

        return fullUrl;
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

        this.dynformsService.fullUrl = this.getFullUrl();

        // Turn on when first starting.
        this.dynformsService.setPowerState(true);

        this.dynformsService._deviceHandlers = this;

        this.dynformsService.subscribeListener(
            "powerState",
            (newPowerState) => {}
        );

        log(
            `Initialized ${this.dynformsService.subType} with ${this.dynformsService.fullUrl}`,
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

        this._checkingIntervalHandler = setInterval(
            () => this.dynformsServiceIntervalHandler(),
            this.dynformsService.settings.checkInterval ?? 3600000
        );

        this.initialized = true;

        // Trigger an initial API call.
        this.dynformsServiceIntervalHandler();
    }

    async dynformsServiceIntervalHandler() {
        if (!this.initialized) {
            return false;
        }

        try {
            //const data = await axios.get(this.dynformsService.fullUrl);
            const data = { data: {}};
            const responseData = data?.data;

            // Cache the response.
            this.cache.data = responseData;

            log(
                `Received API data from ${this.dynformsService.settings.api?.baseUrl}`,
                this
            );

            const displayData = getDisplayDataFromApiResponse(responseData);

            this.dynformsService._updateState(displayData, true);
        } catch (err) {
            console.log("Error when fetching dynforms data.");
            console.log(err);
        }
    }
}

function dynformsServiceHandler(devicePool, dynformsService, cache) {
    return new DynformsServiceHandler(devicePool, dynformsService, cache);
}

export default dynformsServiceHandler;
