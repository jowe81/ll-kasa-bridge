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

  // Device types
  DEVICETYPE_KASA_SMARTPLUGSWITCH: 'IOT.SMARTPLUGSWITCH',
  DEVICETYPE_KASA_SMARTBULB: 'IOT.SMARTBULB',

  DEVICETYPE_ESP_THERMOMETER: 'ESP Thermometer',
  DEVICETYPE_ESP_RELAY: 'ESP_RELAY',
  DEVICETYPE_ESP_MAILBOX: 'ESP_MAILBOX',

  DEVICETYPE_VIRTUAL: 'Virtual',

  // Subtypes
  SUBTYPE_BULB: 'bulb',
  SUBTYPE_LED_STRIP: 'led-strip',
  SUBTYPE_PLUG: 'plug',
  SUBTYPE_SWITCH: 'switch',  

  SUBTYPE_THERMOMETER: 'thermometer',
  SUBTYPE_MAIL_COMPARTMENT: 'mailbox',

  SUBTYPE_AIR_FAN: 'fan',
  SUBTYPE_AIR_HEAT: 'heater',
  SUBTYPE_AIR_AC: 'a/c',
  SUBTYPE_LIGHT: 'light', // A non-smart plug-in-light
  SUBTYPE_ENTERTAINMENT: 'entertainment',

  SUBTYPE_THERMOSTAT: 'thermostat',
  SUBTYPE_TIMER: 'timer',

  // Service names
  SERVICE_PERIODIC_FILTER: 'Periodic Filter Service',
  SERVICE_BACKEND: 'backend',
  SERVICE_BACKEND_FLIP: 'backend (flip)',
  SERVICE_COMMAND_CACHE: 'Command Cache Service',

  // Default Location
  DEVICE_DEFAULT_LOCATION_ID: 'loc-default',
  
};

constants.DEVICETYPES_LIGHTING = [
  constants.SUBTYPE_LIGHT,
  constants.SUBTYPE_BULB,
  constants.SUBTYPE_LED_STRIP,
];

constants.DEVICETYPES_HVAC = [
  constants.SUBTYPE_AIR_AC,
  constants.SUBTYPE_AIR_FAN,
  constants.SUBTYPE_AIR_HEAT,
];


constants.DEVICETYPES_WITH_POWERSTATE = [
  constants.DEVICETYPE_KASA_SMARTPLUGSWITCH,
  constants.DEVICETYPE_KASA_SMARTBULB,
  constants.DEVICETYPE_ESP_RELAY,
  constants.DEVICETYPE_VIRTUAL,
]

constants.DEVICETYPES_CUSTOM_DISPLAY = [
  constants.SUBTYPE_TIMER,
]

export default constants;