import sunriseSunsetJs from 'sunrise-sunset-js';

// Vancouver
const DEFAULT_LAT = 49.28;
const DEFAULT_LONG = -123.12;

const DEFAULT_DAWN_DUSK_LENGTH = 60 * 60 * 1000;

// Internal use: get lat/long when none are provided
const _getCoords = (coords) => {
  if (coords) {
    return coords;
  }

  return {
    lat: DEFAULT_LAT,
    long: DEFAULT_LONG,
  }
}

// Get today's sunset from library
const getSunset = (coords) => {
  const { lat, long } = _getCoords(coords);

  const now = new Date();
  // Need to pass this into getSunset, or it gets yesterday's sunset time (?)
  const plus1Day = new Date(now.getTime() + 24 * 60 * 60 * 1000);  

  return sunriseSunsetJs.getSunset(lat, long, plus1Day);
}

// Get today's sunrise from library
const getSunrise = (coords) => {
  const { lat, long } = _getCoords(coords);
  return sunriseSunsetJs.getSunrise(lat, long);
}

/**
 * Are we between today's sunrise and sunset?
 * @returns bool
 */
const isDaytime = (date = null, coords = null) => {
  const { lat, long } = _getCoords(coords);

  const now = date ? date : new Date();
  const sunset = getSunset({lat, long});
  const sunrise = getSunrise({lat, long});

  return sunrise < now && sunset > now;  
}

/**
 * Is it dark out (are we before sunrise or after sunset)?
 * @returns bool
 */
 const isNighttime = (date = null, coords = null) => !isDaytime(date, coords);
 

 /**
  * Return a percentage with indicates fully day (1), fully night (0), or dusk/dawn (0 < result < 1).
  * Without offset, transitionTime will be a twilight window with the sunrise/sunset at its centre.
  * 
  * @param {*} transitionTime ms
  * @param {*} date           Date
  * @param {*} offset         ms
  * @param {*} latitude 
  * @param {*} longitude 
  */
const getDaytimePercent = (transitionTime, date, offset, coords) => {
  const { lat, long } = _getCoords(coords);

  if (!transitionTime) {
    transitionTime = DEFAULT_DAWN_DUSK_LENGTH;
  }

  if (!date) {
    date = new Date();
  }

  date.setTime(date.getTime() - (offset ?? 0));

  // Get start and end of transition period, with the center beeing the current time (or date passed in), with offset
  const transitionStart = new Date();
  transitionStart.setTime(date.getTime() - (transitionTime / 2));

  const transitionEnd = new Date();
  transitionEnd.setTime(transitionStart.getTime() + transitionTime);

  if (isDaytime(date, coords) && isDaytime(transitionStart, coords) && isDaytime(transitionEnd, coords)) {    
    // Fully day: post dawn, pre dusk    
    return 1;
    
  } else if (isNighttime(date, coords) && isNighttime(transitionStart, coords) && isNighttime(transitionEnd, coords)) {
    // Fully night: post dusk, pre dawn    
    return 0;

  } else {
    // Twilight: dawn or dusk
    const isDawn = isDaytime(transitionEnd);

    const twilightStart = new Date();
    twilightStart.setTime(
      (isDawn ? getSunrise(coords).getTime() : getSunset(coords).getTime())
      - (transitionTime / 2)
    );

    const twilightEnd = new Date();
    twilightEnd.setTime(twilightStart.getTime() + transitionTime);

    const transitionPercent = (date.getTime() - twilightStart.getTime()) / transitionTime;

    return isDawn ? transitionPercent : 1 - transitionPercent;
  }
}

const getNighttimePercent = (transitionTime, date, offset, coords) => 1 - getDaytimePercent(transitionTime, date, offset, coords);

const isFullyDaytime = (transitionTime = null, date = null) => getDaytimePercent(transitionTime, null, date) === 1;


export {
  getSunrise,
  getSunset,
  getDaytimePercent,
  getNighttimePercent,
  isDaytime,  
  isFullyDaytime,
  isNighttime,
}