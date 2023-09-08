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

  DEVICETYPE_VIRTUAL: 'Virtual Device',

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

  // Default Poll interval
  ESP_DEFAULT_POLL_INTERVAL: 10 * SECOND,
  
};

constants.SUBTYPES = [
  constants.SUBTYPE_AIR_AC,
  constants.SUBTYPE_AIR_FAN,
  constants.SUBTYPE_AIR_HEAT,
  constants.SUBTYPE_BULB,
  constants.SUBTYPE_ENTERTAINMENT,
  constants.SUBTYPE_LED_STRIP,
  constants.SUBTYPE_LIGHT,
  constants.SUBTYPE_MAIL_COMPARTMENT,
  constants.SUBTYPE_PLUG,
  constants.SUBTYPE_SWITCH,
  constants.SUBTYPE_THERMOMETER,
  constants.SUBTYPE_THERMOSTAT,
  constants.SUBTYPE_TIMER,
]

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
];

constants.DEVICETYPE_DEFAULTS = {
  [constants.DEVICETYPE_VIRTUAL]: {
    [constants.SUBTYPE_THERMOSTAT]: {
      // Do not check more often than the minimum set here.
      CHECKING_INTERVAL_MIN: 10 * constants.SECOND,
      CHECKING_INTERVAL_DEFAULT: 1 * MINUTE,
      // Boundaries for target temperature settings.
      TARGET_MAX: 28,
      TARGET_MIN: 15,
      TARGET_DEFAULT: 22,
  
      // If we haven't had a room temperature update during this time, shut off HVAC devices.
      SAFETY_SHUTOFF_DELAY: 2 * constants.MINUTE,

      // Shut off room heating if this temperature is exceeded (including when thermostat is off)
      SAFETY_SHUTOFF_HIGH_TEMP: 30,

      // Shut off airconditioning if it gets colder (including when thermostat is off)
      SAFETY_SHUTOFF_LOW_TEMP: 13,
    },

    [constants.SUBTYPE_TIMER]: {
      CHECKING_INTERVAL_MIN: 1 * constants.SECOND,
      CHECKING_INTERVAL_DEFAULT: 1 * constants.SECOND,

      AUDIO_PATH: './files/',
      AUDIO_FILE_EXPIRED_TIMER_DEFAULT: 'alert_default.mp3',
    },  
  },

};

export default constants;