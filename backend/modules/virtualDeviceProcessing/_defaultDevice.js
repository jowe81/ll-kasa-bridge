import _ from "lodash";
import axios from "axios";
import { makeLiveDeviceObject } from "../TargetDataProcessor.js";
import constants from "../../constants.js";
import { log, debug } from "../Log.js";

const localConstants =
    constants.DEVICETYPE_DEFAULTS[constants.DEVICETYPE_VIRTUAL][
        constants.SUBTYPE_CLOCK
    ];

class ClockHandler {
    constructor(devicePool, clock, cache) {
        this.initialized = false;

        this.devicePool = devicePool;
        this.clock = clock;
        this.init(cache);
    }

    analyzeStateChange(oldState, newState) {
        if (oldState === undefined) {
            // Have no current state. Just received the first update.
            return undefined;
        }

        let changeInfo = {};
        changeInfo.on_off = oldState?.powerState !== newState?.powerState;
        changeInfo.changed = changeInfo.on_off || changeInfo.clock;

        return changeInfo;
    }

    getLiveDevice() {
        const liveDevice = makeLiveDeviceObject(
            this.clock,
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
        if (
            !(
                this.clock &&
                this.devicePool &&
                this.clock.settings
            )
        ) {
            log(`Failed to initialize Clock.`, this, "red");
            return false;
        }

        if (!cache) {
            console.error(
                "Clock init failed - did not get cache reference."
            );
            return false;
        }
        // Store the cache reference.
        this.cache = cache;
        this.cache.data = [];


        // Turn on when first starting.
        this.clock.setPowerState(true);

        this.clock._deviceHandlers = this;

        this.clock.subscribeListener(
            "powerState",
            (newPowerState) => {}
        );

        log(
            `Initialized ${this.clock.subType} "${this.clock.alias}".`,
            this.clock
        );
        log(
            `Check-Interval: ${Math.ceil(
                this.clock.settings.checkInterval / constants.MINUTE
            )} minutes.`,
            this.clock
        );

        // Start the interval check
        if (this._checkingIntervalHandler) {
            clearInterval(this._checkingIntervalHandler);
        }

        const interval =
            this.clock.settings.checkInterval ??
            localConstants.CHECKING_INTERVAL_DEFAULT;

        this._checkingIntervalHandler = setInterval(
            () => this.clockIntervalHandler(),
            interval
        );

        this.initialized = true;

        // Trigger an initial API call. THERES A TIMINIG ISSUE HERE - WITHOUT THE DELAY THE FRONTEND WONT GET THE UPDATE
        setTimeout(() => {
            this.clockIntervalHandler();
        }, 5000);
    }

    async clockIntervalHandler() {
        if (!this.initialized) {
            return false;
        }

        this.clock._updateState(
            {
                powerState: this.clock.getPowerState(),
                clock: displayData,
            },
            true
        );
    }
}

function clockHandler(devicePool, clock, cache) {
    return new ClockHandler(devicePool, clock, cache);
}

export default clockHandler;
