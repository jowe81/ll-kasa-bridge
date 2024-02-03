import sunriseSunsetJs from 'sunrise-sunset-js';
import constants from '../constants.js';

// Vancouver
const DEFAULT_LAT = 49.28;
const DEFAULT_LONG = -123.12;

const DEFAULT_DAWN_DUSK_LENGTH = 60 * 60 * 1000;

/**
 * Internal use: get lat/long when none are provided
 */
const _getCoords = (coords) => {
  if (coords) {
    return coords;
  }

  return {
    lat: DEFAULT_LAT,
    long: DEFAULT_LONG,
  }
}

function formatDate(formatString, currentDate) {
    if (!currentDate) {
        currentDate = new Date();
    }

    var year = currentDate.getFullYear().toString();
    var month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
    var day = currentDate.getDate().toString().padStart(2, "0");

    // Replace placeholders in the format string with actual values
    formatString = formatString.replace("YYYY", year);
    formatString = formatString.replace("YY", year.slice(-2));
    formatString = formatString.replace("MM", month);
    formatString = formatString.replace("DD", day);

    return formatString;
}

function formatDateLong(formatString, currentDate) {
    if (!currentDate) {
        currentDate = new Date();
    }

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const dayOfWeek = dayNames[currentDate.getDay()];
    const month = monthNames[currentDate.getMonth()];
    const dayOfMonth = currentDate.getDate();
    const year = currentDate.getFullYear().toString();

    const getOrdinalSuffix = (number) => {
            switch (number) {
                case 1:
                    return "st";

                case 2:
                    return "nd";
                
                case 3:
                    return "rd";

                default:
                    return "th"
            }
    };

    formatString = formatString.replace("{dayOfWeek}", dayOfWeek);
    formatString = formatString.replace("{month}", month);
    formatString = formatString.replace("{dayOfMonth}", dayOfMonth);
    formatString = formatString.replace("{daySuffix}", getOrdinalSuffix(dayOfMonth));
    formatString = formatString.replace("{year}", year);
    
    return formatString;
}

function formatTime(formatString, currentDate) {
  if (!currentDate) {
    currentDate = new Date();
  }

  if (!formatString) {
    formatString = 'H:MM'; // Default
  }

  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();
  const seconds = currentDate.getSeconds();

  let formattedTime;

  if (formatString.includes("HH")) {
    formattedTime = formatString
        .replace("HH", hours.toString().padStart(2, "0"))
        .replace("MM", minutes.toString().padStart(2, "0"))
        .replace("SS", seconds.toString().padStart(2, "0"));
  } else {
    formattedTime = formatString
        .replace("H", hours.toString())
        .replace("MM", minutes.toString().padStart(2, "0"))
        .replace("SS", seconds.toString().padStart(2, "0"));
  }
  return formattedTime;    
}

/**
 * Get today's sunset from the library
 */
 const getSunset = (date, coords) => {
  const { lat, long } = _getCoords(coords);

  const now = date ? date : new Date();

  // Need to pass this into getSunset, or it gets yesterday's sunset time (?)
  const plus1Day = new Date(now.getTime() + 24 * 60 * 60 * 1000);  

  return sunriseSunsetJs.getSunset(lat, long, plus1Day);
}

/**
 * Get today's sunrise from the library
 */
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

  if (isPm(now)) {
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
 * Are we in dusk or dawn? 
 * Adds/subtracts paddingFromSunEvent to sunset/sunrise to determine this.
 *  
 * @returns bool
 */
const isDawnOrDusk = (date, coords, paddingFromSunEvent = 0) => {
  return isDusk(date, coords, paddingFromSunEvent) || isDawn(date, coords, paddingFromSunEvent);
}

const isDawn = (date, coords, paddingFromSunEvent = 0) => {
  const now = date ? date : new Date();

  if (isPm(now)) {
    // It's past noon, can't be dawn.
    return false;
  }

  return isWithinWindow(
    now, 
    getSunrise(now, coords), 
    paddingFromSunEvent
  );
}

const isDusk = (date, coords, paddingFromSunEvent = 0) => {
  const now = date ? date : new Date();

  if (isAm(now)) {
    // It's before noon, can't be dusk.
    return false;
  }

  return isWithinWindow(
    now, 
    getSunset(now, coords), 
    paddingFromSunEvent
  );
}

/**
 * Is the given date within the window that's spanned by
 * centerOfWindow +- padding?
 * 
 * @param Date    date            (defaults to current) 
 * @param Date    centerOfWindow
 * @param number  padding         (in ms)
 * 
 * @returns bool
 */
const isWithinWindow = (date, centerOfWindow, padding) => {
  if (!centerOfWindow) {
    return null;
  }

  const now = date ? date : new Date();

  const windowOpens = centerOfWindow.getTime() - padding;
  const windowCloses = centerOfWindow.getTime() + padding;

  return windowOpens < now && windowCloses > now;
}

/**
 * Is it before noon?
 */
const isAm = (date) => {
  const now = date ? date : new Date();

  return now.getHours() < 12;
}

/**
 * Is it after noon?
 */
 const isPm = (date) => !isAm(date);

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
 * Get 12:00 on the given day.
 * @returns Date
 */
const getNoon = (date = null) => {
  if (!date) {
    date = new Date();
  }

  date.setHours(12, 0, 0, 0);

  return date;
}

/**
 * Get the first timestamp of the next day.
 * @returns Date
 */
const getNextDay = (date = null) => {
  if (!date) {
    date = new Date();
  }

  const nextDay = new Date(date.getTime() + constants.DAY)
  nextDay.setHours(0, 0, 0, 0);
  return nextDay;
}

const getTomorrow = () => getNextDay();

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

/**
 * Determine the value of paramName for the next sunEvent.
 * The value may have been provided as a number or as an object
 * with a sunrise/sunset property, or not at all.
 */
 const getFromSettingsForNextSunEvent = (paramName, settings) => {

  if (!(settings && settings[paramName])) {
    // paramName not set at all - default to 0
    return 0;
  }

  let paramValue;

  switch (typeof settings[paramName]) {
    case 'number':
      // It's a number, use it for both sunrise and sunset
      paramValue = settings[paramName];
      break;

    case 'object':
      // It's an object, use sunrise/sunset properties
      paramValue = isAm() ? settings[paramName].sunrise : settings[paramName].sunset;
      break;
  }
  
  if (typeof paramValue !== 'number') {
    // Couldn't determine a value - default to 0
    paramValue = 0;
  }

  return paramValue;
};

const isToday = (date) => {
  if (!date) {
    return false;
  }

  const today = new Date();

  return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  );
} 

const logDates = (dates, label) => {
  if (!Array.isArray(dates)) {
    dates = [ dates ];
  }

  dates.forEach(date => {
    console.log(" - " + (label ?? ''), date?.toLocaleString(), date?.getTime());  
  })
}

function getBeginningOfDay(date) {
    if (!date) {
        date = new Date();
    }

    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);

    return date;
}

function getMonthsOfTheYear(short = false) {
    const monthsFull = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return short ? shortMonths : monthsFull;
}

function getDaysOfTheWeek(short = false) {
  const daysFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return short ? daysShort : daysFull;
}

function getDatesInMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // Getting the last day of the month

  const datesArray = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  // If it's February and the year is a leap year, adjust the array length
  if (month === 1 && isLeapYear(year)) {
    datesArray.push(29);
  }

  return datesArray;
}

function isLeapYear(year) {
  // Assuming you have a valid implementation of isLeapYear
  // You can replace this with your actual implementation
  // ...

  // For the sake of this example, a simple leap year check is provided
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}


export {
  formatDate,
  formatDateLong,
  formatTime,
  getBeginningOfDay,
  getDatesInMonth,
  getDaysOfTheWeek,
  getSunrise,
  getSunset,
  getDaytimePercent,
  getMonthsOfTheYear,
  getNighttimePercent,
  getNextSunEvent,
  getNoon,
  getNextDay,
  getTomorrow,
  isBetweenDuskAndDawn,
  isDawnOrDusk,
  isDawn,
  isDusk,
  isAm,
  isPm,
  isLeapYear,
  isDaytime,  
  isFullyDaytime,
  isNighttime,
  isToday,
  getFromSettingsForNextSunEvent,
  logDates,
}