import _ from "lodash";
import axios from "axios";
import {
    makeLiveDeviceObject,
    commandMatchesCurrentState,
    buildCommandObjectFromCurrentState,
    commandObjectToBoolean,
} from "../TargetDataProcessor.js";
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
                "settings",
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
        this.cache.data = {};

        // Turn on when first starting.
        this.masterSwitch.setPowerState(true);

        this.masterSwitch._deviceHandlers = this;

        this.masterSwitch.subscribeListener("powerState", (newPowerState) => {});

        this.masterSwitch.settings.buttons.forEach((button, index) => {
            // Create IDs for the buttons that don't have one.
            if (!button.buttonId) {
                button.buttonId = button.alias.toLowerCase().replace(/[^a-z]/g, "") + "_" + index;
            }
            // Resolve switch array state data if only powerstate (boolean) was given.
            if (Array.isArray(button.switch)) {
                button.switch.forEach((condition) => {
                    if (typeof condition.stateData !== "object") {
                        condition.stateData = {
                            on_off: condition.stateData ? 1 : 0,
                        };
                    }
                });
            }
        });

        log(`Initialized ${this.masterSwitch.subType} "${this.masterSwitch.alias}".`, this.masterSwitch);

        log(
            `Check-Interval: ${Math.ceil(this.masterSwitch.settings.checkInterval / constants.MINUTE)} minutes.`,
            this.masterSwitch
        );

        // Start the interval check
        if (this._checkingIntervalHandler) {
            clearInterval(this._checkingIntervalHandler);
        }

        const interval = this.masterSwitch.settings.checkInterval ?? localConstants.CHECKING_INTERVAL_DEFAULT;

        this._checkingIntervalHandler = setInterval(() => this.masterSwitchIntervalHandler(), interval);

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

        const buttons = this.getButtonsState();

        this.masterSwitch._updateState(
            {
                powerState: this.masterSwitch.getPowerState(),
                buttons,
            },
            false
        );
    }

    // Calculate if buttons have their conditions met (are 'active')
    getButtonsState() {
        let buttonsState = {};

        this.masterSwitch.settings.buttons.forEach((button, index) => {
            const log = false//button.buttonId === "movie_0";

            const conditions = button.switch;

            if (conditions) {
                const state = [];

                conditions.forEach((condition, index) => {
                    let conditionState = {};

                    conditionState.index = index;

                    if (!condition.ignoreForButtonState) {
                        if (condition.groupId) {
                            conditionState.groupId = condition.groupId;
                            conditionState.powerState = this.devicePool.getGroupPowerState(condition.groupId);
                            conditionState.deviceStateMatches = this.devicePool.groupStateMatchesState(
                                condition.groupId,
                                condition.stateData
                            );
                            log &&
                                console.log(
                                    `${condition.groupId} Condition/Actual`,
                                    condition.stateData,
                                    this.devicePool.getGroupLightState(condition.groupId)
                                );
                            log &&
                                console.log(
                                    `${condition.groupId} matches`,
                                    conditionState.deviceStateMatches
                                );
                        } else if (condition.channel) {
                            conditionState.channel = condition.channel;
                            const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(condition.channel);
                            conditionState.powerState = deviceWrapper.getPowerState();
                            conditionState.deviceStateMatches = commandMatchesCurrentState(
                                deviceWrapper,
                                condition.stateData
                            );
                            log &&
                                console.log(
                                    `${deviceWrapper.alias} Condition/Actual`,
                                    condition.stateData,
                                    buildCommandObjectFromCurrentState(deviceWrapper)
                                );
                            log &&
                                console.log(
                                    `${deviceWrapper.alias} matches`,
                                    conditionState.deviceStateMatches                                    
                                );
                        }
                    }

                    conditionState.fulfilled = conditionState.deviceStateMatches || condition.ignoreForButtonState;

                    state.push(conditionState);
                });

                const fullfilledConditions = state.filter((conditionState) => conditionState.fulfilled);

                // Only set result if either all or none of the conditions are met.
                if (fullfilledConditions.length === conditions.length) {
                    buttonsState[button.buttonId] = true;
                } else if (fullfilledConditions.length === 0) {
                    buttonsState[button.buttonId] = false;
                } else {                    
                    buttonsState[button.buttonId] = null;
                }

                log && console.log(`${button.buttonId} Set to `, buttonsState[button.buttonId]);
            }
        });

        return buttonsState;
    }

    execute(buttonId, origin) {
        if (!Array.isArray(this.masterSwitch.settings.buttons)) {
            return null;
        }

        const button = this.masterSwitch.settings.buttons.find((button) => button.buttonId === buttonId);

        if (!button || !button.switch?.length) {
            return null;
        }

        // Have the button; process it.

        let logItems = [];

        button.switch.forEach((item) => {
            let logId;
            let switchingThisItem = true;

            if (item.channel) {
                // Channel
                logId = item.channel;
                const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(item.channel);

                if (deviceWrapper) {
                    switchingThisItem = true;
                    if (
                        typeof item.stateData === "boolean" ||
                        ![constants.SUBTYPE_BULB, constants.SUBTYPE_LED_STRIP].includes(deviceWrapper.subType)
                    ) {
                        let setTo;
                        if (typeof item.stateData === "object") {
                            setTo = item.stateData?.on_off ? true : false;
                        } else {
                            setTo = !!item.stateData;
                        }

                        deviceWrapper.setPowerState(setTo, null, origin);
                    } else {
                        deviceWrapper.setLightState(item.stateData, null, origin, null, true);
                    }
                } else {
                    switchingThisItem = false;
                }
            } else if (item.groupId) {
                // Group
                logId = item.groupId;
                if (typeof item.stateData === "boolean") {
                    this.devicePool.switchGroup(item.groupId, item.stateData);
                } else {
                    this.devicePool.setGroupLightState(item.groupId, item.stateData);
                }
            }

            if (switchingThisItem) {
                logItems.push(`${logId}/${JSON.stringify(item.stateData)}`);
            }
        });

        let logText = `MasterSwitch ${buttonId}: ${logItems.join(", ")}`;

        log(logText, this.masterSwitch, "greenBright");
    }
}

function masterSwitchHandler(devicePool, masterSwitch, cache) {
    return new MasterSwitchHandler(devicePool, masterSwitch, cache);
}

export default masterSwitchHandler;
