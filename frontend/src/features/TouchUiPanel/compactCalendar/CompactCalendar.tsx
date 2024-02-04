import {
    getCalendarEvents,
    getDateString,
    isSameDay,
    isSameTime,
    isThisWeek,
    eventIsFuture,
    eventIsNow,
    eventIsToday,
    isToday,
    eventIsTomorrow,
    isTomorrow,
    getDaysDifference,
    getWeekNumber,
    getBeginningOfWeek,
    getTimeDifference,
} from "./../../TouchUiMain/calendar/calendarHelpers";

import "./../../TouchUiMain/calendar/calendar.scss";

import "./compactCalendar.scss";

import { getSelectedRecordsInfo, getJsx } from "../../TouchUiMain/birthdays/birthdayHelpers.tsx";

function CompactCalendar({ birthdayRangeToDisplay }) {
    const timeFormatOptions: Intl.DateTimeFormatOptions = {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    };

    const events = getCalendarEvents().slice(0, 4);
    
    const eventsNow = events.filter((event) => eventIsNow(event));    
    const eventsToday = events.filter((event) => eventIsToday(event) && eventIsFuture(event));

    let eventsNowJsx;
    let noEventsNow = eventsNow.length;
    if (noEventsNow) {
        eventsNowJsx = eventsNow.slice(0, 2).map((event, index) => {
            return (
                <div className="calendar-compact-item-container calendar-compact-item-container-now">
                    <div className="calendar-compact-item-summary">{event.summary}</div>
                    <div className="calendar-compact-item-header">
                        <div className="header-time-now event-happening-now-alert">IN PROGRESS</div>
                        <div className={`header-index-${event.calendarIndex}`}>{event.calendarLabel}</div>
                    </div>
                </div>
            );
        });
    }

    let eventsTodayJsx;
    let noEventsToday = eventsToday.length;
    if (noEventsToday) {
        eventsTodayJsx = eventsToday.slice(0, 2).map((event, index) => {
            const startTimeStr = new Date(event.start).toLocaleTimeString(undefined, timeFormatOptions) ?? "";
            const endTimeStr = new Date(event.end).toLocaleTimeString(undefined, timeFormatOptions) ?? "";

            return (
                <div className="calendar-compact-item-container calendar-compact-item-container-today">
                    <div className="calendar-compact-item-summary">{event.summary}</div>
                    <div className="calendar-compact-item-header">
                        <div className="header-time-today">
                            {startTimeStr} - {endTimeStr}
                        </div>
                        <div className={`header-index-${event.calendarIndex}`}>{event.calendarLabel}</div>
                    </div>
                </div>
            );
        });
    }

    const haveEvents = eventsNowJsx || eventsTodayJsx;

    return (
        <div className="touch-ui-panel-item">
            <div className="calendar-compact-container">
                <div className="calendar-label">Calendar</div>
                {haveEvents && (
                    <div className="calendar-compact-items-container">
                        {eventsNowJsx}
                        {eventsTodayJsx}
                    </div>
                )}
                {!haveEvents && (
                    <div className="calendar-compact-nothing-scheduled">
                        <div>Nothing Scheduled<br/>for Today</div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CompactCalendar;
