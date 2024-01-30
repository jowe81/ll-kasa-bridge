import {
    getCalendarEvents,
    isSameDay,
    isThisWeek,
    isToday,
    isTomorrow,
    getDaysDifference,
    getWeekNumber,
    getBeginningOfWeek,
} from "./calendarHelpers";

import "./calendar.css";

function Calendar() {
    const events = getCalendarEvents();

    const now = new Date();

    const dateFormatOptions: Intl.DateTimeFormatOptions = {
        month: "short", // Short month name (e.g., 'Apr')
        day: "numeric", // Numeric day of the month
    };
    const timeFormatOptions: Intl.DateTimeFormatOptions = {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    };

    const calendarItemsJsx: any = [];

    let lastEventStartDate: any = null;
    let lastEventWeekNumber: any = null;

    events?.forEach((event, index) => {
        const startDate = event.start ? new Date(event.start) : null;
        if (!startDate) {
            // At the very least we need a start date.
            return;
        }

        const endDate = event.end ? new Date(event.end) : startDate;

        const startDateStr = startDate?.toLocaleDateString(undefined, dateFormatOptions) ?? "";
        const startTimeStr = startDate?.toLocaleTimeString(undefined, timeFormatOptions) ?? '';
        
        const endDateStr = endDate?.toLocaleDateString(undefined, dateFormatOptions) ?? "";
        const endTimeStr = endDate?.toLocaleTimeString(undefined, timeFormatOptions) ?? "";

        const eventIsToday = isToday(startDate);
        const eventIsNow = (startDate < now) && (endDate > now);
        const eventIsOver = endDate < now;

        const eventStartsSoon = startsSoon(startDate, 90);

        let dateTimeStr = '';

        if (isSameDay(startDate, endDate)) {
            dateTimeStr = `${startDateStr}, ${startTimeStr} - ${endTimeStr}`;
        } else {
            dateTimeStr = `${startDateStr}, ${startTimeStr} - ${endDateStr}, ${endTimeStr}`;
        }

        if (!isSameDay(lastEventStartDate, startDate)) {
            // This event is on a future date. See if we want a divider.

            if (isThisWeek(startDate)) {
                if (isSameDay(startDate, endDate)) {
                    dateTimeStr = `${startTimeStr} - ${endTimeStr}`;
                }

                // It is within this week, divide every day.
                let dateLabel = '';
                if (isToday(startDate)) {
                    dateLabel = "Today";
                } else if (isTomorrow(startDate)) {
                    dateLabel = "Tomorrow";
                } else {
                    const daysDifference = getDaysDifference(now, startDate);

                    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(startDate);

                    if (daysDifference < 7) {
                        dateLabel = `${weekday} (${startDate?.toLocaleDateString(undefined, dateFormatOptions)})`;
                    } else {
                        dateLabel = `${startDate?.toLocaleDateString(undefined, {month: "long", day: "numeric"})}`;
                    }
                }

                calendarItemsJsx.push(
                    <div key={`divider_${index}`} className="calendar-event-divider-container">
                        {dateLabel}
                    </div>    
                )

            } else {
                // It is after this week
                const weekdayShort = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(startDate);

                if (isSameDay(startDate, endDate)) {
                    dateTimeStr = `${weekdayShort} ${startDateStr}, ${startTimeStr} - ${endTimeStr}`;
                } else {
                    dateTimeStr = `${weekdayShort} ${startDateStr}, ${startTimeStr} - ${endDateStr}, ${endTimeStr}`;
                }

                const thisEventWeekNumber = getWeekNumber(startDate);
                
                if (lastEventWeekNumber !== thisEventWeekNumber) {
                    let weekLabel = "";

                    if (lastEventWeekNumber + 1 === thisEventWeekNumber) {
                        weekLabel = `Next Week`;
                    } else {
                        const targetDate = getBeginningOfWeek(startDate);
                        weekLabel = `Week of ${targetDate.toLocaleDateString(undefined, {month: "long", day: "numeric"})}`;
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
            classNames+=` calendar-event-container-now`;
        } else if (eventIsToday && !eventIsOver) {
            classNames+=` calendar-event-container-today`;
        }

        calendarItemsJsx.push(
            <div key={index} className={classNames}>
                <div className="header-container">
                    <div className={`calendar-index-${event.calendarIndex}`}>
                        {event.location && <div className="event-location">@{event.location}</div>}
                        <div className="event-calendar-label">{event.calendarLabel}</div>
                    </div>
                    <div className="event-start-end">
                        {eventIsNow && <div className="event-happening-now-alert">In Progress</div>}
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
                <div className="calendar-header">Upcoming Events</div>
                <div className="calendar-items-container">{calendarItemsJsx}</div>
            </div>
        </div>
    );
}

function startsSoon(date: Date, maxMinutes: number) {
    if (!date) {
        date = new Date();
    }

    const diff = date.getTime() - Date.now();
    const minutesOut = Math.floor(diff / 60000); 

    return minutesOut > 0 && minutesOut <= maxMinutes;
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

    let output = ''
    if (hours > 0) {
        output += `${hoursFormatted}h, `;
    }

    output += `${minutesFormatted}m`;
    return output;
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
