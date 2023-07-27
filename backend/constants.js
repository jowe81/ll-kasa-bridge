// Constants
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const constants = {

  DEBUG: {
    debug: false,
    channels: [40],
  },

  // Time
  SECOND, 
  MINUTE, 
  HOUR,
  DAY,
  WEEK,

  // When a device goes offline the saved powerstate for its wrapper will be discarded after this timeout.
  DEVICE_POWERSTATE_TIMEOUT: 30 * SECOND,

  // Kasa subtypes
  SUBTYPE_BULB: 'bulb',
  SUBTYPE_LED_STRIP: 'led-strip',
  SUBTYPE_PLUG: 'plug',
  SUBTYPE_SWITCH: 'switch',

  // Device types
  DEVICETYPE_AIR_FAN: 'fan',
  DEVICETYPE_AIR_HEAT: 'heater',
  DEVICETYPE_AIR_AC: 'a/c',
  DEVICETYPE_LIGHT: 'light', // A non-smart plug-in-light
  DEVICETYPE_ENTERTAINMENT: 'entertainment',  

  // Service names
  SERVICE_PERIODIC_FILTER: 'Periodic Filter Service',
  SERVICE_BACKEND: 'backend',
  SERVICE_BACKEND_FLIP: 'backend (flip)',
  SERVICE_COMMAND_CACHE: 'Command Cache Service',

  // Default Location
  DEVICE_DEFAULT_LOCATION_ID: 'loc-default',
  
};

export default constants;