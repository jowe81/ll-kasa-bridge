import sunriseSunsetJs from 'sunrise-sunset-js';
import constants from '../constants.js';

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
const getSunset = (date, coords) => {
  const { lat, long } = _getCoords(coords);

  const now = date ? date : new Date();

  // Need to pass this into getSunset, or it gets yesterday's sunset time (?)
  const plus1Day = new Date(now.getTime() + 24 * 60 * 60 * 1000);  

  return sunriseSunsetJs.getSunset(lat, long, plus1Day);
}

// Get today's sunrise from library
const getSunrise = (date, coords) => {
  const { lat, long } = _getCoords(coords);
  return sunriseSunsetJs.getSunrise(lat, long, date);
}

/**
 * Are we between dusk and dawn? 
 * Adds/subtracts paddingFromSunEvent to sunset/sunrise to determine this.
 *  
 * @returns bool
 */
const isBetweenDuskAndDawn = (date, coords, paddingFromSunEvent = 0) => {
  const now = date ? date : new Date();
  
  let sunset, sunrise;

  if (now.getHours() > 12) {
    // It is evening; need today's sunset and tomorrow's sunrise
    const tomorrow = new Date(now.getTime() + constants.DAY);

    sunset = getSunset(now, coords);
    sunrise = getSunrise(tomorrow, coords);
  } else {
    // It is morning; need yesterday's sunset and today's sunrise
    const yesterday = new Date(now.getTime() - constants.DAY);

    sunset = getSunset(yesterday, coords);
    sunrise = getSunrise(now, coords);  
  }

  const windowOpens = new Date(sunset.getTime() - paddingFromSunEvent);
  const windowCloses = new Date(sunrise.getTime() + paddingFromSunEvent);

  return windowOpens < now && windowCloses > now;
}

/**
 * Are we between today's sunrise and sunset?
 * @returns bool
 */
const isDaytime = (date = null, coords = null, offset = 0) => {
  const { lat, long } = _getCoords(coords);

  if (date && offset) {
    date.setTime(date.getTime() + offset);
  }

  const now = date ? date : new Date();

  const sunset = getSunset(now, {lat, long});
  const sunrise = getSunrise(now, {lat, long});

  return sunrise < now && sunset > now;  
}

/**
 * Get the date/time of the upcoming sunrise or sunset.
 * @returns Date
 */
const getNextSunEvent = (date = null, coords = null) => {  
  return isDaytime(date, coords) ? getSunset(date, coords) : getSunrise(date, coords)
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

const logDates = (dates, label) => {
  if (!Array.isArray(dates)) {
    dates = [ dates ];
  }

  dates.forEach(date => {
    console.log(" - " + (label ?? ''), date?.toLocaleString(), date?.getTime());  
  })
}

export {
  getSunrise,
  getSunset,
  getDaytimePercent,
  getNighttimePercent,
  getNextSunEvent,
  isBetweenDuskAndDawn,
  isDaytime,  
  isFullyDaytime,
  isNighttime,
  logDates,
}