import _ from "lodash";

import constants from "../../constants.js";
import { log, debug } from '..//Log.js';
import { globalConfig } from '../../configuration.js';
import { devicePool } from "../DevicePool.js";

const localConstants = constants.DEVICETYPE_DEFAULTS[constants.DEVICETYPE_VIRTUAL][constants.SUBTYPE_THERMOSTAT];

const thermostatIntervalHandler = (devicePool, thermostat) => {

  if (thermostat.getPowerState()) {
    thermostat._checkingIntervalHandler = setInterval(async () => {
      console.log('Thermostat Processing');
      const location = devicePool.locations[thermostat.locationId];
      const temperature = location.getTemperature(localConstants.SAFETY_SHUTOFF_DELAY);
      const currentTempC = temperature.tempC;
      console.log(thermostat.locationId, temperature, thermostat.settings);

      const { heat, cool, hysteresis, starget } = thermostat.settings;

      const target = 26;
      console.log(`Temp is ${currentTempC}, target is ${target}, heat is ${heat ? 'active' : 'inactive'}, heat powerstate is ${location.isHeating() ? 'on' : 'off'}`);

      let liveDeviceCount = 0;
      
      if (heat) {
        const isHeating = location.isHeating();
        if (isHeating && (currentTempC >= target + hysteresis)) {
          // Turn off the heat
          console.log('Turn off heat');
          liveDeviceCount = location.setHeating(false);
        }

        if (!isHeating && (currentTempC < target - hysteresis)) {
          // Turn on the heat
          console.log('Turn on heat');
          liveDeviceCount = location.setHeating(true);
        }
      }

      if (cool) {
        const isCooling = location.isCooling();
        if (isCooling && (currentTempC <= target - hysteresis)) {
          // Turn off the AC
          liveDeviceCount = location.setCooling(false);
        }

        if (!isCooling && (currentTempC > target + hysteresis)) {
          // Turn on the AC
          liveDeviceCount = location.setCooling(true);
        }
      }

      log(`Issued commands to ${liveDeviceCount} devices`, thermostat);

    }, thermostat.interval);
  }

}

export {
  thermostatIntervalHandler,
}