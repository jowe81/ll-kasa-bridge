import { getCalendar } from "../../../devicesHelpers";
import { VirtualDevice } from "../devices/dataSlice";

function formatTime(formatString, currentDate) {
    if (!currentDate) {
        currentDate = new Date();
    }

    if (!formatString) {
        formatString = "H:MM"; // Default
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

function getMidNight(date?: Date) {    
    const midnight = date ? date : new Date();
    midnight.setHours(0);
    midnight.setMinutes(0);
    midnight.setSeconds(0);
    return midnight;
}

function getEndOfDay(date) {
    const eod = date ? date : new Date();
    eod.setHours(23);
    eod.setMinutes(59);
    eod.setSeconds(59);
    return eod;
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

const isInNDays = (date, n) => {
    if (!date) {
        return null;
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + n);
    return isSameDay(date, targetDate);

}

const isToday = (date) => isInNDays(date, 0);

const isTomorrow = (date) => {
    if (!date) {
        return null;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return isSameDay(date, tomorrow);
}

const isThisWeek = (date) => date <= getEndOfWeek();



export {
    formatTime,
    getBeginningOfWeek,
    getCalendarEvents,
    getDaysDifference,
    getEndOfDay,
    getEndOfWeek,
    getEndOfYesterday,
    getMidNight,
    getSecondsSinceMidnight,
    getNDaysAgoMidnight,
    getWeekNumber,
    isSameDay,
    isThisWeek,
    isToday,
    isTomorrow,
    isInNDays
}