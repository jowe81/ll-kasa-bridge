import _ from "lodash";
import { makeLiveDeviceObject } from '../TargetDataProcessor.js';
import constants from "../../constants.js";
import { log, debug } from '../Log.js';

const localConstants = constants.DEVICETYPE_DEFAULTS[constants.DEVICETYPE_VIRTUAL][constants.SUBTYPE_THERMOSTAT];

class ThermostatHandler {
  
  constructor(devicePool, thermostat) {
    this.initialized = false;

    this.devicePool = devicePool;
    this.thermostat = thermostat;    

    this.init() 
  };

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
  };

  getLiveDevice() {
    return makeLiveDeviceObject(this.thermostat, [
        // Include
        'powerState',
      ], {
        // Default
        'display': true,
      }, [
        // Exclude
      ],
      // Use global defaults
      true,
    );
  };


  init() {
    if (!(this.thermostat && this.devicePool)) {
      return false;
    }


    let modes = [];
    if (this.thermostat.settings.heat) modes.push('heat');
    if (this.thermostat.settings.cool) modes.push('cool');

    if (!modes.length) {
      // No mode configured.
      return false;
    }

    this.thermostat.state.target = this.thermostat.settings.target ?? localConstants.TARGET_DEFAULT;    
    this.thermostat.interval = this.thermostat.settings.checkInterval;
    
    if (this.thermostat.interval < localConstants.CHECKING_INTERVAL_MIN) {
      this.thermostat.interval = localConstants.CHECKING_INTERVAL_DEFAULT;
    }

    // Target temperature
    let target = this.thermostat.settings.target;

    if (!(target >= localConstants.TARGET_MIN && target <= localConstants.TARGET_MAX)) {
      target = localConstants.TARGET_DEFAULT;
      this.thermostat.settings.target = target;
    }    

    // Turn off when first starting.
    this.thermostat.setPowerState(false);
    
    this.thermostat._deviceHandlers = this;

    this.thermostat.subscribeListener('powerState', (newPowerState) => {

      const location = this.devicePool.locations[this.thermostat.locationId];
      if (!newPowerState && location) {
        location.setHeating(false);
        location.setCooling(false);
        log(`Sending power-off command to heating and cooling in location ${location.name}.`, this.thermostat);
      }
    });
    
    log(`Initialized ${this.thermostat.subType} for location ${this.thermostat.location}. Mode is ${ modes.join(' and ') }, hysteresis is ${this.thermostat.settings.hysteresis}°C.`, this.thermostat);
    log(`Check-Interval: ${ Math.ceil(this.thermostat.interval / constants.SECOND) } seconds. Target: ${this.thermostat.settings.target}°C.`, this.thermostat);


    // Start the interval check
    if (this._checkingIntervalHandler) {
      clearInterval(this._checkingIntervalHandler);
    }

    this._checkingIntervalHandler = setInterval(() => this.thermostatIntervalHandler(), this.thermostat.interval ?? 5000); 
    
    this.initialized = true;
  };

  nudgeTarget(up) {
    if (!this.initialized) {
      return false;
    }

    const baseAmount = this.thermostat.settings?.nudgeBy ?? 0.5;
    const amount = up ? baseAmount : -baseAmount

    this.setTarget(this.thermostat.state.target + amount);
  };

  setTarget(tempC) {
    if (!this.initialized) {
      return false;
    }

    const minTarget = localConstants.TARGET_MIN;
    const maxTarget = localConstants.TARGET_MAX;

    if (!(tempC > 0 && tempC <= maxTarget && tempC >= minTarget)) {
      log(`Attempt to set invalid target temperature: ${tempC}°C. Allowed min/max: ${minTarget}°C / ${maxTarget}°C.`, this.thermostat);
      return;
    }

    log(`Setting target to ${tempC}°C`, this.thermostat);

    const currentState = this.thermostat.state;
    const newState = {
      ...currentState,
      target: tempC,
    };
    
    this.thermostat._updateState(newState);
  };

  thermostatIntervalHandler() {
    if (!this.initialized) {
      return false;
    }
    

    const location = this.devicePool.locations[this.thermostat.locationId];
    const { heat, cool, hysteresis } = this.thermostat.settings;
    const { target } = this.thermostat.state;
    const temperature = location.getTemperature(localConstants.SAFETY_SHUTOFF_DELAY);
    const currentTempC = temperature?.tempC;

    // Trigger shutoff if there no temperature at all, or only stale temperature, or limits exceeded.
    const safetyShutoff = !temperature || temperature.isStale || currentTempC > localConstants.SAFETY_SHUTOFF_HIGH_TEMP || currentTempC < localConstants.SAFETY_SHUTOFF_LOW_TEMP;

    let liveDeviceCount = 0;

    if (safetyShutoff) {
      let turnOffHeat = false;
      let turnOffAc = false;
      let reason = 'Unknown';

      if (!temperature) {
        turnOffHeat = true;
        turnOffAc = true;
        reason = `No temperature from location`;
      } else if (temperature.isStale) {
        turnOffHeat = true;
        turnOffAc = true;
        reason = `Temperature from location is stale (older than ${Math.round(localConstants.SAFETY_SHUTOFF_DELAY / 1000)} s)`;
      } else if (currentTempC > localConstants.SAFETY_SHUTOFF_HIGH_TEMP) {
        turnOffHeat = true;
        reason = `Temperature exceeds safety threshould (> ${localConstants.SAFETY_SHUTOFF_HIGH_TEMP})°C`;
      } else if (currentTempC < localConstants.SAFETY_SHUTOFF_LOW_TEMP) {
        turnOffAc = true;
        reason = `Temperature below safety minimum (< ${temperature < localConstants.SAFETY_SHUTOFF_LOW_TEMP})°C`;
      }

      if (turnOffHeat) {
        liveDeviceCount = location.setHeating(false);
      }
      if (turnOffAc) {
        liveDeviceCount = location.setCooling(false);
      }

      log(`Safety-shutoff triggered for ${location.name} ${turnOffHeat ? `heating` : `airconditioning`}. Reason: ${reason}.`, this.thermostat, safetyShutoff ? 'bgRed' : null);
    } else {
      // Normal operation
      if (this.thermostat.getPowerState()) {
        if (heat) {
          const isHeating = location.isHeating();
          const msg = `Temp is ${currentTempC}°C, target is ${target}°C, hysteresis is ${hysteresis}°, heat is ${isHeating ? "on" : "off"}; turn it ${isHeating ? "off" : "on"}`;
          
          let switchHeatTo = null;
          if (isHeating && (currentTempC >= target + hysteresis)) {
            switchHeatTo = false;
          }
  
          if (!isHeating && (currentTempC < target - hysteresis)) {
            switchHeatTo = true;
          }   
          
          // Override in case of safety shutoff
          if (safetyShutoff) {          
            switchHeatTo = false;
          }
  
          if (switchHeatTo !== null) {
            log(safetyShutoff ? 'Thermostat heating safety-shutoff triggered. No temperature from location or temperature is stale.' : msg, this.thermostat, safetyShutoff ? 'bgRed' : null);
            liveDeviceCount = location.setHeating(switchHeatTo);
          }
        }
  
        if (cool) {
          const isCooling = location.isCooling();
          const msg = `Temp is ${currentTempC}°C, target is ${target}°C, hysteresis is ${hysteresis}°, AC is ${isCooling ? "on" : "off"}; turn it ${isCooling ? "off" : "on"}`;
          
          let switchAcTo = null;
          if (!isCooling && (currentTempC >= target + hysteresis)) {
            switchAcTo = true;
          }
  
          if (isCooling && (currentTempC < target - hysteresis)) {
            switchAcTo = false;
          }   
          
          // Override in case of safety shutoff
          if (safetyShutoff) {          
            switchAcTo = false;
          }
  
          if (switchAcTo) {
            log(safetyShutoff ? 'Thermostat cooling safety-shutoff triggered. No temperature from location or temperature is stale.' : msg, this.thermostat, safetyShutoff ? 'bgRed' : null);
            liveDeviceCount = location.setCooling(switchAcTo);
          }
        }  
      }  
    }
      
    if (liveDeviceCount || safetyShutoff) {
      log(`Issued commands to ${liveDeviceCount ?? 0} devices.`, this.thermostat);
    }
  };

}

function thermostatHandler(devicePool, thermostat) {
  return new ThermostatHandler(devicePool, thermostat);
}

export default thermostatHandler;