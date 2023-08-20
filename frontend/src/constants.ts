// Constants
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const constants: any = {

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

  // Kasa subtypes
  SUBTYPE_BULB: 'bulb',
  SUBTYPE_LED_STRIP: 'led-strip',
  SUBTYPE_PLUG: 'plug',
  SUBTYPE_SWITCH: 'switch',
  SUBTYPE_THERMOMETER: 'thermometer',
  SUBTYPE_MAIL_COMPARTMENT: 'mailbox',
  
  // Device types
  DEVICETYPE_AIR_FAN: 'fan',
  DEVICETYPE_AIR_HEAT: 'heater',
  DEVICETYPE_AIR_AC: 'a/c',
  DEVICETYPE_LIGHT: 'light', // A non-smart plug-in-light
  DEVICETYPE_ENTERTAINMENT: 'entertainment',  
  
  DEVICETYPE_ESP: 'ESP',
  DEVICETYPE_ESP_RELAY: 'ESP_RELAY',
  DEVICETYPE_ESP_MAILBOX: 'ESP_MAILBOX',

  // Service names
  SERVICE_PERIODIC_FILTER: 'Periodic Filter Service',
  SERVICE_BACKEND: 'backend',
  SERVICE_BACKEND_FLIP: 'backend (flip)',
  SERVICE_COMMAND_CACHE: 'Command Cache Service',

  // Default Location
  DEVICE_DEFAULT_LOCATION_ID: 'loc-default',
  
};

constants.deviceTypesLighting = [
  constants.DEVICETYPE_LIGHT,
  constants.SUBTYPE_BULB,
  constants.SUBTYPE_LED_STRIP,
];

constants.deviceTypesHvac = [
  constants.DEVICETYPE_AIR_AC,
  constants.DEVICETYPE_AIR_FAN,
  constants.DEVICETYPE_AIR_HEAT,
];

export default constants;