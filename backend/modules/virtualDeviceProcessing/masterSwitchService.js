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

        this.masterSwitch.settings.buttons.forEach((button) => {

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
                        } else if (condition.channel) {
                            conditionState.channel = condition.channel;
                            const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(condition.channel);
                            conditionState.powerState = deviceWrapper.getPowerState();
                        }
                    }

                    conditionState.targetPowerState = typeof condition.stateData === 'boolean' ? 
                        condition.stateData : 
                        !!condition.stateData?.lightState?.on_off;

                    conditionState.fulfilled =
                        (conditionState.targetPowerState === conditionState.powerState) || condition.ignoreForButtonState;

                    state.push(conditionState);
                })

                const fullfilledConditions = state.filter((conditionState) => conditionState.fulfilled);

                // Only set result if either all or none of the conditions are met.
                if (fullfilledConditions.length === conditions.length) {
                    buttonsState[button.buttonId] = true;
                } else if (fullfilledConditions.length === 0) {
                    buttonsState[button.buttonId] = false;
                } else {
                    buttonsState[button.buttonId] = null;
                }
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

      button.switch.forEach(item => {
        let logId;
        let switchingThisItem = true;

        if (item.channel) {
          // Channel
          logId = item.channel;          
          const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(item.channel);
          
          if (deviceWrapper) {
            switchingThisItem = true;
            if (typeof item.stateData === 'boolean') {
              deviceWrapper.setPowerState(item.stateData, null, origin);              
            } else {
              deviceWrapper.setLightState(item.stateData?.lightState, null, origin, null, true);            
            }
            
          } else {
            switchingThisItem = false;
          }

        } else if (item.groupId) {
          // Group
          logId = item.groupId;
          this.devicePool.switchGroup(item.groupId, item.stateData);          
        }

        if (switchingThisItem) {
          logItems.push(`${logId}/${JSON.stringify(item.stateData)}`);        
        }
        
      });

      let logText = `MasterSwitch ${buttonId}: ${logItems.join(', ')}`;

      log(logText, this.masterSwitch, "greenBright");
    }
}

function masterSwitchHandler(devicePool, masterSwitch, cache) {
    return new MasterSwitchHandler(devicePool, masterSwitch, cache);
}

export default masterSwitchHandler;
