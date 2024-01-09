import { log } from "./jUtils.js";
import { formatDate, isToday } from "./jDateTimeUtils.js";
import constants from "../constants.js";

function getDisplayDataFromApiResponse(responseData, settings) {
    // Currently not doing any processing here.
    let displayData = responseData;

    if (settings.useSingleRequest) {
      // Return the results for the first request only; as a single object and not as an array.
      displayData = responseData.length ? responseData[0] : null;  
    }

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

const dynformsDbFilters = {
    applyCurrentDateFilter,    
};

export { 
  dynformsDbFilters,
  getDisplayDataFromApiResponse,
  requestShouldRun,
};
