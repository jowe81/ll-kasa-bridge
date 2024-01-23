import { getCalendar } from "../../../devicesHelpers";
import { VirtualDevice } from "../devices/dataSlice";

function getCalendarEvents(calendar?: VirtualDevice) {
    if (!calendar) {
        calendar = getCalendar();
    }

    if (!calendar) {
        return [];
    }

    return calendar.state.api?.events;
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

export {
    getCalendarEvents,
    isSameDay,
}