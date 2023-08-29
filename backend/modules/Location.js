import _ from 'lodash';
import constants from "../constants.js";
import { log } from "./Log.js";

const Location = {
  devicePool: null,
  deviceCount: 0,
  id: null,
  type: 'location',

  // Location will be considered online if at least one device is live
  isOnline: false,

  init(locationConfigObject, devicePool) {
    const { name, id } = locationConfigObject;
    if (!devicePool || !id) {
      return false;
    }

    id === 'loc-default' ?
      log(`Initializing default location.`, null, 'white') :
      log(`Initializing location '${name}'.`, null, 'white');

    this.devicePool = devicePool;
    this.id = id;
    this.name = name;

    return true;
  },

  getHeaters() {
    const filter= {
        locationId: this.id,
        hvacType: constants.SUBTYPE_AIR_HEAT,
    }

    return this.devicePool.getDeviceWrappersByFilter(filter);

  },

  getThermometers() {
    const filter= {
      locationId: this.id,
      subType: constants.SUBTYPE_THERMOMETER,
    }

    return this.devicePool.getDeviceWrappersByFilter(filter);
  },

  /**
   * Return true if at least one heater is turned on.
   * @returns boolean
   */
  isHeating() {
    let isHeating = false;
    this.getHeaters().every(heater => {
      if (!heater.getPowerState()) {
        return true;
      }

      isHeating = true;      
    });

    return isHeating;
  },

  isCooling() {

  },

  hasFanOn() {

  },

  getHvacInfo() {
    return {
      isHeating: this.isHeating(),
      isCooling: this.isCooling(),
      hasFanOn: this.hasFanOn(),
      tempC: this.getTemperature(),
    }
  },

  /**
   * Calculate location temperature by averaging out all thermometers
   * in the location. Returns on object with tempC, timestamp, isStale.
   * The stale flag will be set depending on the passed in safetyShutoffDelay.
   */
   getTemperature(safetyShutoffDelay) {
    const thermometers = this.getThermometers();

    if (!thermometers.length) {
      return null;
    }

    const temperatures = [];
    let latestTimestamp = 0;

    thermometers.forEach(thermometer => {
      if (thermometer.lastSeenAt > latestTimestamp) {
        latestTimestamp = thermometer.lastSeenAt;
      }

      if (typeof thermometer.state?.tempC !== 'undefined') {
        temperatures.push(thermometer.state.tempC);
      } else {
        log(`No live temperature from channel ${thermometer.channel}.`, this);
      }
    });

    if (!temperatures.length) {
      return null;
    }

    const averageTempC = temperatures.reduce((prev, current) => prev ? prev + current : current) / temperatures.length;

    // Calculate the isStale flag. Always true if no safetyShutoffDelay was passed.
    const isStale = safetyShutoffDelay ? Date.now() - latestTimestamp > safetyShutoffDelay : true;

    if (isStale) { 
      log(`Stale temperature! Last average was ${averageTempC} degrees at ${new Date(latestTimestamp).toLocaleTimeString()}, safety delay is ${Math.round(safetyShutoffDelay / constants.SECOND)}s`, this, 'bgRed');
    } else {
      log(`Average temperature from ${temperatures.length} readings is ${averageTempC}.`, this);
    }

    return {
      tempC: averageTempC, 
      timestamp: latestTimestamp,
      isStale,
    };

  },

  setCooling(powerState) {

  },

  setFan(powerState) {

  },

  setHeating(powerState) {
    let liveDeviceCount = 0;
    this.getHeaters().forEach(heater => { 
      if (heater.isOnline) {
        liveDeviceCount++;
        heater.setPowerState(powerState);
      }
    });
    return liveDeviceCount;
  },


};


export default Location;