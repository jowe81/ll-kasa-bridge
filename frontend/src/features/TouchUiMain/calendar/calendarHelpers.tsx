import { getCalendar } from "../../../devicesHelpers";
import { VirtualDevice } from "../devices/dataSlice";

function formatTime(formatString, currentDate) {
    if (!currentDate) {
        currentDate = new Date();
    }

    if (!formatString) {
        formatString = "H:MM"; // Default
    }

    let hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const seconds = currentDate.getSeconds();

    let formattedTime;

    if (formatString.includes("HH")) {
        formattedTime = formatString
            .replace("HH", hours.toString().padStart(2, "0"))
            .replace("MM", minutes.toString().padStart(2, "0"))
            .replace("SS", seconds.toString().padStart(2, "0"));
    } else {
        let suffix = ' AM';

        if (hours > 12) {
            suffix = ' PM';
            hours = hours - 12;
        }

        formattedTime = formatString
            .replace("H", hours.toString())
            .replace("MM", minutes.toString().padStart(2, "0"))
            .replace("SS", seconds.toString().padStart(2, "0"))
            + suffix;

    }
    return formattedTime;
}

function getCalendarEvents(calendar?: VirtualDevice) {
    if (!calendar) {
        calendar = getCalendar();
    }

    if (!calendar) {
        return [];
    }

    return calendar.state.api?.events;
}

function getDaysDifference(startDate, endDate) {
    // Calculate the difference in milliseconds
    var timeDifference = endDate.getTime() - startDate.getTime();

    // Convert the difference to days
    var daysDifference = timeDifference / (1000 * 60 * 60 * 24);

    // Round to the nearest whole number
    return Math.round(daysDifference);
}

function getTimeDifference(date1, date2) {
    // Calculate the difference in milliseconds
    var difference = date1 - date2;

    // Convert milliseconds to hours and minutes
    var hours = Math.floor(difference / 3600000); // 1 hour = 3600000 milliseconds
    var minutes = Math.floor((difference % 3600000) / 60000); // 1 minute = 60000 milliseconds

    // Format the hours and minutes to HH:MM
    var hoursFormatted = hours.toString();
    var minutesFormatted = minutes.toString().padStart(2, "0");

    let output = "";
    if (hours > 0) {
        output += `${hoursFormatted}h ${minutesFormatted}m`;
    } else {
        output = `${minutes}m`;
    }
    
    return output;
}

function getMidNight(date?: Date) {    
    const midnight = date ? date : new Date();
    midnight.setHours(0);
    midnight.setMinutes(0);
    midnight.setSeconds(0);
    return midnight;
}

function getEndOfDay(date?) {
    const eod = date ? date : new Date();
    eod.setHours(23);
    eod.setMinutes(59);
    eod.setSeconds(59);
    return eod;
}

function getEndOfTomorrow() {
    const tomorrow = getNDaysAgoMidnight(-1);
    return getEndOfDay(tomorrow);
}

function getEndOfYesterday() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getEndOfDay(yesterday);
}

function getEndOfWeek(date?: Date) {
    const targetDate = new Date();
    const weekday = targetDate.getDay();
    let daysOut = 7 - weekday;

    targetDate.setDate(targetDate.getDate() + daysOut)
    return getEndOfDay(targetDate);
}

function getBeginningOfWeek(date?: Date) {
    const targetDate = date ? date : new Date();
    const weekday = targetDate.getDay();
    let daysBack = weekday - 1; //Start Monday, not Sunday

    targetDate.setDate(targetDate.getDate() - daysBack);
    return getMidNight(targetDate);
}


function getWeekNumber(date?: Date) {
    if (!date) {
        date = new Date();
    }

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7)); // Set to Thursday of the current week
    var yearStart = new Date(d.getFullYear(), 0, 1);
    var weekNumber = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return weekNumber;
}

function getSecondsSinceMidnight() {
    return Math.round((Date.now() - getMidNight().getTime()) / 1000);
}

function getNDaysAgoMidnight(n) {
    const midnight = getMidNight();
    midnight.setDate(midnight.getDate() - n);
    return midnight;
}

const isSameDay = (date1, date2) => {
    if (!date1 || !date2) {
        return false;
    }

    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
};

const isSameTime = (date1, date2) => {
    if (!date1 || !date2) {
        return false;
    }

    return (
        date1.getHours() === date2.getHours() &&
        date1.getMinutes() === date2.getMinutes() &&
        date1.getSeconds() === date2.getSeconds()
    );
};

const isInNDays = (date, n) => {
    if (!date) {
        return null;
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + n);
    return isSameDay(date, targetDate);

}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDateString(date, dateFormatOptions) {
    const leapYear = isLeapYear(date.getFullYear());
    
    if (leapYear && date.getMonth() === 2 && date.getDate(1)) {
        let result; 

        dateFormatOptions.includeDayOfWeek ? 
            result = getDayOfWeekString(date, 'short') + ' Feb 29' :
            result = 'Feb 29';

        return result;
    }

    return date?.toLocaleDateString(undefined, dateFormatOptions);    
}

function getDayOfWeekString(date, format) {
    if (!date) {
        return 'N/A';
    }

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const day = date.getDay();
    switch (format) {
        case 'short':
            return daysShort[day];

        default:
            return days[day];
            
    }
}


const eventIsNow = (event) => {
    const now = new Date();
    const startDate = event.start ? new Date(event.start) : null;
    if (!startDate) {
        // At the very least we need a start date.
        return null;
    }
    const endDate = event.end ? new Date(event.end) : startDate;
    return startDate < now && endDate > now;
}


const isToday = (date) => isInNDays(date, 0);

const eventIsToday = (event) => {
    const endOfDay = getEndOfDay();
    const startDate = event.start ? new Date(event.start) : null;
    if (!startDate) {
        // At the very least we need a start date.
        return null;
    }
    const endDate = event.end ? new Date(event.end) : startDate;
    return startDate < endOfDay || endDate < endOfDay;
};

const eventIsFuture = (event) => {
    const now = new Date();
    const startDate = event.start ? new Date(event.start) : null;
    if (!startDate) {
        // At the very least we need a start date.
        return null;
    }

    return eventIsToday(event) && startDate > now
}

const isTomorrow = (date) => {
    if (!date) {
        return null;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return isSameDay(date, tomorrow);
}

const eventIsTomorrow = (event) => {
    const endOfDay = getEndOfDay();
    const endOfTomorrow = getEndOfTomorrow();
    const startDate = event.start ? new Date(event.start) : null;
    if (!startDate) {
        // At the very least we need a start date.
        return null;
    }
    const endDate = event.end ? new Date(event.end) : startDate;
    return endDate > endOfDay && endDate < endOfTomorrow;

}

const isThisWeek = (date) => date <= getEndOfWeek();

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

function getConsecutiveNumbers(start, end) {
    const numbers = [];
    for(let i = start; i <= end; i++) {
        numbers.push(i);
    }
    return numbers;
}

export {
    eventIsFuture,
    eventIsNow,
    eventIsToday,
    eventIsTomorrow,
    formatTime,
    getBeginningOfWeek,
    getCalendarEvents,
    getConsecutiveNumbers,
    getDateString,
    getDatesInMonth,
    getDaysDifference,
    getDaysOfTheWeek,
    getTimeDifference,
    getDayOfWeekString,
    getEndOfDay,
    getEndOfWeek,
    getEndOfYesterday,
    getMidNight,
    getMonthsOfTheYear,
    getSecondsSinceMidnight,
    getNDaysAgoMidnight,
    getWeekNumber,
    isLeapYear,
    isSameDay,
    isSameTime,
    isThisWeek,
    isToday,
    isTomorrow,
    isInNDays
}