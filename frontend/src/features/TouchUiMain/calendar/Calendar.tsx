import {
    getCalendarEvents,
    getDateString,
    getEndOfDay,
    isMidnightToMidnight,
    isSameDay,
    isSameTime,
    isThisWeek,
    isToday,
    isTomorrow,
    getDaysDifference,
    getWeekNumber,
    getBeginningOfWeek,
    getTimeDifference,
    startsSoon,
} from "./calendarHelpers";

import "./calendar.scss";

function Calendar() {
    const events = getCalendarEvents();

    const now = new Date();

    const dateFormatOptions: Intl.DateTimeFormatOptions = {
        month: "short", // Short month name (e.g., 'Apr')
        day: "numeric", // Numeric day of the month
        includeDayOfWeek: true, // Custom
    };
    const timeFormatOptions: Intl.DateTimeFormatOptions = {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    };

    const calendarItemsJsx: any = [];
    
    const thisWeekNumber = getWeekNumber(now);

    let lastEventStartDate: any = null;
    let lastEventWeekNumber: any = null;

    const eventsToday = events.filter(event => {
        const startDate = event.start ? new Date(event.start) : null;
        return event.start && isToday(startDate);
    })

    const haveEventsToday = eventsToday.length;

    events?.forEach((event, index) => {
        /* Loop through the events */
        const startDate = event.start ? new Date(event.start) : null;
        if (!startDate) {
            // At the very least we need a start date.
            return;
        }

        let endDate = event.end ? new Date(event.end) : startDate;
        if (now > endDate) {
            return;
        }

        if (endDate.getHours() === 0 && endDate.getMinutes() === 0 && endDate.getSeconds() === 0) {            
            endDate.setDate(endDate.getDate() - 1);
            endDate = getEndOfDay(endDate);
        }

        const startDateStr = getDateString(startDate, dateFormatOptions) ?? "";
        const startTimeStr = startDate?.toLocaleTimeString(undefined, timeFormatOptions) ?? "";

        const endDateStr = getDateString(endDate, dateFormatOptions) ?? "";
        const endTimeStr = endDate?.toLocaleTimeString(undefined, timeFormatOptions) ?? "";

        const eventIsToday = isToday(startDate);
        const eventStartsSoon = startsSoon(startDate, 180);
        const eventIsNow = startDate < now && endDate > now;
        const eventIsOver = endDate < now;

        let dateTimeStr = "";

        if (isSameDay(startDate, endDate)) {
            // Contained within a day - only start date.
            if (isMidnightToMidnight(startDate, endDate)) {
                // All day event - don't show a time.
                dateTimeStr = startDateStr;
            } else {
                dateTimeStr = `${startDateStr}, ${startTimeStr} - ${endTimeStr}`;
            }            
        } else {
            // Multiday - start/end date.
            dateTimeStr = `${startDateStr}, ${startTimeStr} - ${endDateStr}, ${endTimeStr}`;
        }

        if (!isSameDay(lastEventStartDate, startDate)) {
            // This event is on a later date than the previous one. See if we want a divider.
            if (lastEventStartDate === null && startDate > getEndOfDay()) {
                calendarItemsJsx.push(
                    <div key={`divider_${-1}`} className="calendar-event-divider-container">
                        Today, {getDateString(now, dateFormatOptions)}
                    </div>
                );

                if (!haveEventsToday) {
                    const nothingScheduledNote = `No scheduled events today.`;

                    calendarItemsJsx.push(
                        <div key={-1} className="calendar-no-more-events">
                            {nothingScheduledNote} Cheers! <span className="semi-opaque">&#127866;</span>
                        </div>
                    );
                }
            }
            if (isThisWeek(startDate)) {
                // It is within this week, divide every day.
                let dateLabel = "";
                if (isToday(startDate)) {
                    dateLabel = `Today`;
                } else if (isTomorrow(startDate)) {
                    dateLabel = "Tomorrow";
                } else {
                    const daysDifference = getDaysDifference(now, startDate);

                    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(startDate);

                    if (daysDifference < 7) {
                        dateLabel = `${weekday} (${startDate?.toLocaleDateString(undefined, dateFormatOptions)})`;
                    } else {
                        dateLabel = `${startDate?.toLocaleDateString(undefined, { month: "long", day: "numeric" })}`;
                    }
                }

                if (isSameDay(startDate, endDate)) {
                    // Contained within a day - only start date.
                    if (isMidnightToMidnight(startDate, endDate)) {
                        // All day event - don't show a time.
                        dateTimeStr = dateLabel;
                    } else {
                        dateTimeStr = `${startDateStr}, ${startTimeStr} - ${endTimeStr}`;
                    }
                } else {
                    if (!isSameTime(startDate, endDate)) {
                        if (isMidnightToMidnight(startDate, endDate)) {
                            dateTimeStr = `${startDateStr} - ${endDateStr}`;
                        } else {
                            dateTimeStr = `${dateLabel}, ${startTimeStr} - ${endDateStr}, ${endTimeStr}`;
                        }
                    }
                }

                calendarItemsJsx.push(
                    <div key={`divider_${index}`} className="calendar-event-divider-container">
                        {dateLabel}
                    </div>
                );
            } else {
                // It is after this week
                if (isSameDay(startDate, endDate)) {
                    // Contained within a day - only start date.
                    if (isMidnightToMidnight(startDate, endDate)) {
                        // All day event - don't show a time.
                        dateTimeStr = startDateStr;
                    } else {
                        dateTimeStr = `${startDateStr}, ${startTimeStr} - ${endTimeStr}`;
                    }
                } else {
                    if (!isSameTime(startDate, endDate)) {
                        if (isMidnightToMidnight(startDate, endDate)) {
                            dateTimeStr = `${startDateStr} - ${endDateStr}`;
                        } else {
                            dateTimeStr = `${startDateStr}, ${startTimeStr} - ${endDateStr}, ${endTimeStr}`;
                        }
                    }
                }
            
                const thisEventWeekNumber = getWeekNumber(startDate);

                if (lastEventWeekNumber !== thisEventWeekNumber) {
                    let weekLabel = "";

                    if (lastEventWeekNumber + 1 === thisWeekNumber + 1) {
                        weekLabel = `Next Week`;
                    } else {
                        const targetDate = getBeginningOfWeek(startDate);
                        weekLabel = `Week of ${targetDate.toLocaleDateString(undefined, {
                            month: "long",
                            day: "numeric",
                        })}`;
                    }

                    calendarItemsJsx.push(
                        <div key={`divider_${index}`} className="calendar-event-divider-container">
                            {weekLabel}
                        </div>
                    );
                }
            }
        }

        let classNames = `calendar-event-container`;
        if (eventIsNow) {
            classNames += ` calendar-event-container-now`;
        } else if (eventIsToday && !eventIsOver) {
            classNames += ` calendar-event-container-today`;
        }

        calendarItemsJsx.push(
            <div key={index} className={classNames}>
                <div className="header-container">
                    <div className={`calendar-index-${event.calendarIndex}`}>
                        {event.location && <div className="event-location">@{event.location}</div>}
                        <div className="event-calendar-label">{event.calendarLabel}</div>
                    </div>
                    <div className="event-start-end">
                        {(eventIsNow && isToday(endDate)) && <div className="event-happening-now-alert">In Progress</div>}
                        {eventStartsSoon && (
                            <div className="event-happening-soon-alert">In {getTimeDifference(startDate, now)}</div>
                        )}
                        {dateTimeStr}
                    </div>
                </div>
                <div className="body-container">
                    <div className="event-summary">{event.summary}</div>
                    <div className="event-description">{cutAtFirstWordAfterMaxChars(event.description ?? "", 120)}</div>
                </div>
            </div>
        );

        lastEventStartDate = startDate;
        lastEventWeekNumber = getWeekNumber(startDate);
    } );

    return (
        <div className="calendar-outer-container">
            <div className="calendar-container">
                <div className="calendar-header">Calendar</div>
                <div className="calendar-items-container">{calendarItemsJsx}</div>
            </div>
        </div>
    );
}


function cutAtFirstWordAfterMaxChars(text, maxChars) {
    if (!(typeof maxChars === 'number') || !(maxChars > 0)) {
        return text;
    }

    const tail = text.substring(maxChars - 1);
    const tailWords = tail.split(' ');

    if (tailWords.length < 5) {
        // Don't bother shortening if there's only a few words left.
        return text;
    }
    
    const firstTailWordLength = tailWords[0].length;
    const newTotalLength = maxChars + firstTailWordLength;
    
    let head = text.substring(0, newTotalLength - 1).trim();
    
    // If the last character was period, remove it so we don't get four periods in a row.
    if (head[head.length - 1] === '.') {
        head = head.substring(0, head.length - 1);
    }

    return head + '...';
}

export default Calendar;
