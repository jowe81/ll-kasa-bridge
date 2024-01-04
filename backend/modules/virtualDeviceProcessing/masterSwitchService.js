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
        this.cache.data = [];

        // Turn on when first starting.
        this.masterSwitch.setPowerState(true);

        this.masterSwitch._deviceHandlers = this;

        this.masterSwitch.subscribeListener("powerState", (newPowerState) => {});

        log(
            `Initialized ${this.masterSwitch.subType} "${this.masterSwitch.alias}".`,
            this.masterSwitch
        );

        this.initialized = true;
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
