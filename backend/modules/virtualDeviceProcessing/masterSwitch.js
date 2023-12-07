import _ from "lodash";
import axios from "axios";
import { makeLiveDeviceObject } from "../TargetDataProcessor.js";
import constants from "../../constants.js";
import { log, debug } from "../Log.js";

const localConstants =
    constants.DEVICETYPE_DEFAULTS[constants.DEVICETYPE_VIRTUAL][
        constants.SUBTYPE_MASTER_SWITCH
    ];

class MasterSwitchHandler {
    constructor(devicePool, masterSwitch, cache) {
        this.initialized = false;

        this.devicePool = devicePool;
        this.masterSwitch = masterSwitch;
        this.init(cache);
    }

    analyzeStateChange(oldState, newState) {
        if (oldState === undefined) {
            // Have no current state. Just received the first update.
            return undefined;
        }

        let changeInfo = {};
        changeInfo.on_off = oldState?.powerState !== newState?.powerState;
        changeInfo.changed = changeInfo.on_off || changeInfo.masterSwitch;

        return changeInfo;
    }

    getLiveDevice() {
        const liveDevice = makeLiveDeviceObject(
            this.masterSwitch,
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
        if (!(this.masterSwitch && this.devicePool && this.masterSwitch.settings)) {
            log(`Failed to initialize Master Switch.`, this, "red");
            return false;
        }

        if (!cache) {
            console.error("Master Switch init failed - did not get cache reference.");
            return false;
        }
        // Store the cache reference.
        this.cache = cache;
        this.cache.data = [];

        // Turn on when first starting.
        this.masterSwitch.setPowerState(true);

        this.masterSwitch._deviceHandlers = this;

        this.masterSwitch.subscribeListener("powerState", (newPowerState) => {});

        log(
            `Initialized ${this.masterSwitch.subType} "${this.masterSwitch.alias}".`,
            this.masterSwitch
        );
        log(
            `Check-Interval: ${Math.ceil(
                this.masterSwitch.settings.checkInterval / constants.MINUTE
            )} minutes.`,
            this.masterSwitch
        );

        // Start the interval check
        if (this._checkingIntervalHandler) {
            clearInterval(this._checkingIntervalHandler);
        }

        const interval =
            this.masterSwitch.settings.checkInterval ??
            localConstants.CHECKING_INTERVAL_DEFAULT;

        this._checkingIntervalHandler = setInterval(
            () => this.masterSwitchIntervalHandler(),
            interval
        );

        this.initialized = true;

        // Trigger an initial API call. THERES A TIMINIG ISSUE HERE - WITHOUT THE DELAY THE FRONTEND WONT GET THE UPDATE
        setTimeout(() => {
            this.masterSwitchIntervalHandler();
        }, 5000);
    }

    async masterSwitchIntervalHandler() {
        if (!this.initialized) {
            return false;
        }

        this.masterSwitch._updateState(
            {
                powerState: this.masterSwitch.getPowerState(),
                masterSwitch: displayData,
            },
            true
        );
    }
}

function masterSwitchHandler(devicePool, masterSwitch, cache) {
    return new MasterSwitchHandler(devicePool, masterSwitch, cache);
}

export default masterSwitchHandler;
