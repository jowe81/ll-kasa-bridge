import { getCalendarEvents, isSameDay } from "./calendarHelpers";
import "./calendar.css";

function Calendar() {
    const events = getCalendarEvents();

    console.log(events);

    const dateFormatOptions: Intl.DateTimeFormatOptions = {
        month: "short", // Short month name (e.g., 'Apr')
        day: "numeric", // Numeric day of the month
    };
    const timeFormatOptions: Intl.DateTimeFormatOptions = {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    };

    const calendarItemsJsx = events.map((event, index) => {
        const startDate = event.start ? new Date(event.start) : null;
        const endDate = event.end ? new Date(event.end) : null;

        const startDateStr = startDate?.toLocaleDateString(undefined, dateFormatOptions) ?? "";
        const startTimeStr = startDate?.toLocaleTimeString(undefined, timeFormatOptions) ?? '';
        
        const endDateStr = endDate?.toLocaleDateString(undefined, dateFormatOptions) ?? "";
        const endTimeStr = endDate?.toLocaleTimeString(undefined, timeFormatOptions) ?? "";

        let dateTimeStr = '';

        if (isSameDay(startDate, endDate)) {
            dateTimeStr = `${startDateStr}, ${startTimeStr} - ${endTimeStr}`;
        } else {
            dateTimeStr = `${startDateStr}, ${startTimeStr} - ${endDateStr}, ${endTimeStr}`;
        }

        return (
            <div key={index} className="calendar-event-container">
                <div className="header-container">
                    <div className={`calendar-index-${event.calendarIndex}`}>
                        {event.location && <div className="event-location">@{event.location}</div>}
                        {event.calendarLabel}
                    </div>
                    <div className="event-start-end">{dateTimeStr}</div>
                </div>
                <div className="body-container">
                    <div className="event-summary">{event.summary}</div>
                    <div className="event-description">{cutAtFirstWordAfterMaxChars(event.description ?? '', 120)}</div>
                </div>
            </div>
        );
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
