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
                    <div className={`calendar-index-${event.calendarIndex}`}>{event.calendarLabel}</div>
                    <div className="event-start-end">{dateTimeStr}</div>
                </div>
                <div className="body-container">
                    <div className="event-summary">{event.summary}</div>
                    <div className="event-description">{event.description}</div>
                </div>
            </div>
        );
    } );

    return (
        <div className="calendar-container">
            <div className="touch-ui-sub-panel-header">Upcoming Events</div>
            <div className="calendar-items-container">{calendarItemsJsx}</div>
        </div>
    );
}

export default Calendar;
