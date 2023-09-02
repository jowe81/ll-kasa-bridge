import _ from "lodash";

import constants from "../../constants.js";
import { log, debug } from '..//Log.js';

const localConstants = constants.DEVICETYPE_DEFAULTS[constants.DEVICETYPE_VIRTUAL][constants.SUBTYPE_THERMOSTAT];

function thermostatHandler(devicePool, thermostat) {

  const _thermostat = thermostat;
  const _devicePool = devicePool;

  const thermostatIntervalHandler = () => {

    if (_thermostat.getPowerState()) {
      return setInterval(async () => {
        const location = _devicePool.locations[_thermostat.locationId];
        const { heat, cool, hysteresis } = _thermostat.settings;
        const { target } = _thermostat.state;
        const temperature = location.getTemperature(localConstants.SAFETY_SHUTOFF_DELAY);
        const currentTempC = temperature?.tempC;
  
        // Trigger shutoff if there no temperature at all, or only stale temperature
        const safetyShutoff = !temperature || temperature.isStale;
  
  
        let liveDeviceCount = 0;
        
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
            log(safetyShutoff ? 'Thermostat heating safety-shutoff triggered. No temperature from location or temperature is stale.' : msg, _thermostat, safetyShutoff ? 'bgRed' : null);
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
            log(safetyShutoff ? 'Thermostat cooling safety-shutoff triggered. No temperature from location or temperature is stale.' : msg, _thermostat, safetyShutoff ? 'bgRed' : null);
            liveDeviceCount = location.setHeating(switchAcTo);
          }
        }
  
        if (liveDeviceCount) {
          log(`Issued commands to ${liveDeviceCount} devices`, _thermostat);
        }
  
      }, _thermostat.interval);
    }
  
  };
  
  const init = () => {
    let modes = [];
    if (_thermostat.settings.heat) modes.push('heat');
    if (_thermostat.settings.cool) modes.push('cool');

    if (!modes.length) {
      // No mode configured.
      return false;
    }

    _thermostat.state.target = _thermostat.settings.target ?? localConstants.TARGET_DEFAULT;    
    _thermostat.interval = _thermostat.settings.checkInterval;
    
    if (_thermostat.interval < localConstants.CHECKING_INTERVAL_MIN) {
      _thermostat.interval = localConstants.CHECKING_INTERVAL_DEFAULT;
    }

    // Target temperature
    let target = _thermostat.settings.target;

    if (!(target >= localConstants.TARGET_MIN && target <= localConstants.TARGET_MAX)) {
      target = localConstants.TARGET_DEFAULT;
      _thermostat.settings.target = target;
    }    
    
    log(`Initialized ${_thermostat.subType} for location ${_thermostat.location}. Mode is ${ modes.join(' and ') }, hysteresis is ${_thermostat.settings.hysteresis}°C.`, _thermostat);
    log(`Check-Interval: ${ Math.ceil(_thermostat.interval / constants.SECOND) } seconds. Target: ${_thermostat.settings.target}°C.`, _thermostat);

    // Turn off when first starting.
    _thermostat.setPowerState(false);

  };

  const nudgeTarget = (up) => {
    const baseAmount = _thermostat.settings?.nudgeBy ?? 0.5;
    const amount = up ? baseAmount : -baseAmount

    setTarget(_thermostat.state.target + amount);
  };

  const setTarget = (tempC) => {
    const minTarget = localConstants.TARGET_MIN;
    const maxTarget = localConstants.TARGET_MAX;

    if (!(tempC > 0 && tempC <= maxTarget && tempC >= minTarget)) {
      log(`Attempt to set invalid target temperature: ${tempC}°C. Allowed min/max: ${minTarget}°C / ${maxTarget}°C.`, _thermostat);
      return;
    }

    log(`Setting target to ${tempC}°C`, _thermostat);

    const currentState = _thermostat.state;
    const newState = {
      ...currentState,
      target: tempC,
    };
    
    _thermostat._updateState(newState);
  };

  return {
    thermostatIntervalHandler,
    init,
    nudgeTarget,
    setTarget,
  }


  
}

export {
  thermostatHandler,
}