import _ from "lodash";
import axios from "axios";
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
        // Store the cache reference.
        this.cache = cache;
        this.cache.data = {};

        // Turn on when first starting.
        this.deviceHandler.setPowerState(true);

        this.deviceHandler._deviceHandlers = this;

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

    async serviceIntervalHandler() {
        if (!this.initialized) {
            return false;
        }

        this.deviceHandler._updateState(
            {
                powerState: this.deviceHandler.getPowerState(),
                api: null,
            },
            true
        );
    }
}

function davServiceHandler(devicePool, deviceHandler, cache) {
    return new DavServiceHandler(devicePool, deviceHandler, cache);
}

export default davServiceHandler;
