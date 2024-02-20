import { log } from "./jUtils.js";
import { formatDate, isToday } from "./jDateTimeUtils.js";
import constants from "../constants.js";

function getDisplayDataFromApiResponse(responseData, settings, requestIndex) {
    // Currently not doing any processing here.
    let displayData = responseData;
    return displayData;
}

function requestShouldRun(requestConfig, lastExecuted) {
  const now = new Date();

  const timeInfo = requestConfig.retrieve?.time;  

  switch (timeInfo.frequency) {

    case 'minutes':
      if (!timeInfo.minutes) {
        // Expect a minimum of 1 minute to execute at all.
        return false;
      }

      if (!lastExecuted || lastExecuted.getTime() < Date.now() - (timeInfo.minutes * constants.MINUTE)) {
        return true;
      }
      
      break;

    case 'hourly':
      if (!lastExecuted || lastExecuted.getTime() < Date.now() - constants.HOUR) {
        // Either has never run, or not in more than an hour.
        return true;
      };

      break;

    case 'daily':
      const scheduledFor = new Date();
      scheduledFor.setHours(
        timeInfo.hours ?? 0,
        timeInfo.minutes ?? 0,
        0,
        0,
      );

      if (now > scheduledFor && !isToday(lastExecuted)) {
        // We're past the scheduled time of the day, and today the request didn't run yet.
        return true;
      }
      
      break;

    default:
      break;
  }  
} 


function applyCurrentDateFilter(match) {
    /**
     * Matching today's date, optionally with a range before/after.
     */

    const currentDate = new Date();
    
    const rangeStartDate = new Date(currentDate);

    if (match.daysBefore > 0) {
      rangeStartDate.setUTCDate(rangeStartDate.getUTCDate() - match.daysBefore);  
    }
    
    const rangeStartDateFormatted = formatDate(
        match.format,
        rangeStartDate
    );

    const rangeEndDate = new Date(currentDate);

    if (match.daysAfter > 0) {
        rangeEndDate.setUTCDate(rangeEndDate.getUTCDate() + match.daysAfter);
    }

    const rangeEndDateFormatted = formatDate(
        match.format,
        rangeEndDate
    );

    return {
        $gte: rangeStartDateFormatted,
        $lte: rangeEndDateFormatted,
    };
}

function applyStaticFilter(match, filter = {}) {
    const filterKeys = Object.keys(match);

    filterKeys.forEach(key => {
        switch (typeof match[key]) {
            case 'object':
                // Call recursively
                filter[key] = applyStaticFilter(match[key], filter[key]);
                break;

            case 'string':
                // Check for a placeholder
                const placeholder = getPlaceholderFromString(match[key]);

                filter[key] = placeholder ? 
                    resolvePlaceholder(placeholder) :
                    match[key]; // Copy the value
                break;

            default:
                // Copy the value
                filter[key] = match[key];
                break;
        }
    });

    return filter;
}

function getPlaceholderFromString(string) {
    if (!string || !(string.substring(0, 2) === '__')) {        
        return string;
    }

    const values = string.split('-');
    const key = values.shift();

    return { 
        key,
        values,
    }    
}

function resolvePlaceholder({key, values}) {
    if (!key || !values) {
        return null;
    }

    switch (key) {
        case "__DATE_DAYS_AGO":
            const date = new Date();
            date.setDate(date.getDate() - values[0]);
            return `__DATE-${date.getTime()}`;
    }

    return null;
}

function createAlert(message, level, serviceLabel) {
    return {
        message,
        level,
        serviceLabel,
        issued_at: new Date(),
    };
}

const dynformsDbFilters = {
    applyCurrentDateFilter,
    applyStaticFilter,
};

export { createAlert, dynformsDbFilters, getDisplayDataFromApiResponse, requestShouldRun };
