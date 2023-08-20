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



  // Device types
  DEVICETYPE_KASA_SMARTPLUGSWITCH: 'IOT.SMARTPLUGSWITCH',
  DEVICETYPE_KASA_SMARTBULB: 'IOT.SMARTBULB',

  DEVICETYPE_ESP_THERMOMETER: 'ESP Thermometer',
  DEVICETYPE_ESP_RELAY: 'ESP_RELAY',
  DEVICETYPE_ESP_MAILBOX: 'ESP_MAILBOX',

  // Subtypes
  SUBTYPE_BULB: 'bulb',
  SUBTYPE_LED_STRIP: 'led-strip',
  SUBTYPE_PLUG: 'plug',
  SUBTYPE_SWITCH: 'switch',  

  SUBTYPE_THERMOMETER: 'thermometer',
  SUBTYPE_MAIL_COMPARTMENT: 'mailbox',

  SUBTYPE_AIR_FAN: 'fan',
  SUBTYPE_AIR_AC_HEAT: 'heater',
  SUBTYPE_AIR_AC: 'a/c',
  SUBTYPE_LIGHT: 'light', // A non-smart plug-in-light
  SUBTYPE_ENTERTAINMENT: 'entertainment',  



  // Service names
  SERVICE_PERIODIC_FILTER: 'Periodic Filter Service',
  SERVICE_BACKEND: 'backend',
  SERVICE_BACKEND_FLIP: 'backend (flip)',
  SERVICE_COMMAND_CACHE: 'Command Cache Service',

  // Default Location
  DEVICE_DEFAULT_LOCATION_ID: 'loc-default',

  // Default Poll interval
  ESP_DEFAULT_POLL_INTERVAL: 10 * SECOND,
  
};


constants.DEVICETYPES_LIGHTING = [
  constants.SUBTYPE_LIGHT,
  constants.SUBTYPE_BULB,
  constants.SUBTYPE_LED_STRIP,
];

constants.DEVICETYPES_HVAC = [
  constants.SUBTYPE_AIR_AC,
  constants.SUBTYPE_AIR_FAN,
  constants.SUBTYPE_AIR_AC_HEAT,
];


constants.DEVICETYPES_WITH_POWERSTATE = [
  constants.DEVICETYPE_KASA_SMARTPLUGSWITCH,
  constants.DEVICETYPE_KASA_SMARTBULB,
  constants.DEVICETYPE_ESP_RELAY,
]

export default constants;