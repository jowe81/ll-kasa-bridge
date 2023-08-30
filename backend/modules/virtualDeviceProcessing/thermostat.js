import _ from "lodash";

import constants from "../../constants.js";
import { log, debug } from '..//Log.js';
import { globalConfig } from '../../configuration.js';
import { devicePool } from "../DevicePool.js";

const localConstants = constants.DEVICETYPE_DEFAULTS[constants.DEVICETYPE_VIRTUAL][constants.SUBTYPE_THERMOSTAT];

const thermostatIntervalHandler = (devicePool, thermostat) => {

  if (thermostat.getPowerState()) {
    thermostat._checkingIntervalHandler = setInterval(async () => {
      const location = devicePool.locations[thermostat.locationId];
      const { heat, cool, hysteresis } = thermostat.settings;
      const { target } = thermostat.state;
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
          log(safetyShutoff ? 'Thermostat heating safety-shutoff triggered. No temperature from location or temperature is stale.' : msg, thermostat, safetyShutoff ? 'bgRed' : null);
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
          log(safetyShutoff ? 'Thermostat cooling safety-shutoff triggered. No temperature from location or temperature is stale.' : msg, thermostat, safetyShutoff ? 'bgRed' : null);
          liveDeviceCount = location.setHeating(switchAcTo);
        }
      }

      if (liveDeviceCount) {
        log(`Issued commands to ${liveDeviceCount} devices`, thermostat);
      }

    }, thermostat.interval);
  }

}

export {
  thermostatIntervalHandler,
}