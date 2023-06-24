// Constants
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const constants = {

  DEBUG: {
    debug: true,
    channels: [40],
  },

  // Time
  SECOND, 
  MINUTE, 
  HOUR,
  DAY,
  WEEK,

  // Device subtypes
  SUBTYPE_BULB: 'bulb',
  SUBTYPE_LED_STRIP: 'led-strip',
  SUBTYPE_PLUG: 'plug',
  SUBTYPE_SWITCH: 'switch',

  // Service names
  SERVICE_PERIODIC_FILTER: 'Periodic Filter Service',
  SERVICE_BACKEND: 'backend',
  
};

export default constants;