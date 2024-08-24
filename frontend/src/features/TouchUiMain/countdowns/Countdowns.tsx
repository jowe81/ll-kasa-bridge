import { useEffect, useState } from "react";
import "./countdowns.scss";
import { getCountdownsService } from "../../../devicesHelpers";
import { getDynformsServiceRecords } from "../../../dynformsHelpers";

function Countdowns() {
    const service = getCountdownsService();
    const records = getDynformsServiceRecords(service?.channel, undefined, true);
    const record = getMostRecentDisplayableRecord(records);
    const elapsesAt = record?.elapses_at ? new Date(record.elapses_at) : null;
    const [timeLeftString, settimeLeftString] = useState('');

    useEffect(() => {
        const handle = setInterval(() => settimeLeftString(timeUntil(elapsesAt)))
        return () => clearInterval(handle);
    }, [elapsesAt]);

    const now = new Date();

    if (!record || !elapsesAt || elapsesAt.getTime() < now.getTime()) {
        return null;
    }

    const supportedColors = ["gray"];
    const colorClassName = mapRecordToColorClass(record, supportedColors);

    const description = record.description;
    const displayThisCountdown = description !== "__NONE__";

    if (!displayThisCountdown) {
        return null;
    }

    // Indicate the year only if it's not the current year.
    const year = elapsesAt.getFullYear() !== now.getFullYear() ? "numeric" : undefined;

    return (
        <div className={`countdowns-container ${colorClassName}`}>
            <div className="countdowns-header">{(record.name ?? `countdown`).toUpperCase()}</div>
            <div className="countdowns-countdown">{timeLeftString}</div>
            <div className="countdowns-elapse-date">
                {elapsesAt.toLocaleTimeString(undefined, { year, month: "short", day: "numeric", hour: 'numeric', minute: '2-digit' })}
            </div>
            <div className={`countdowns-message`} style={getMessageDivStyle(description)}>
                {description}
            </div>
        </div>
    );
}

function getMessageDivStyle(message) {
    const length = message?.split(/\s+/).length;
    let fontSize = 14;

    if (length < 20) {
        fontSize = 18;
    }

    if (length > 40) {
        fontSize = 10;
    }

    return {
        fontSize,
    };
}
function getMostRecentDisplayableRecord(records) {
    return records.find((record) => record.display && (record.elapses_at));
}

function mapRecordToColorClass(record, supportedColors) {
    if (supportedColors.includes(record?.color)) {
        return `countdowns-${record.color}`;
    }

    return "countdowns-gray";
}

function timeUntil(futureDate) {
    const now = new Date();
    const diff = futureDate.getTime() - now.getTime();

    if (diff <= 0) {
        return "0:00:00:00"; // If the future date is in the past or now
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    let result = '';
    if (days) {
        result += `${days}:`;
    }

    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (hours) {
        const padLengthHours = days ? 2 : 1;
        result += `${hours.toString().padStart(padLengthHours, "0")}:`;
    }

    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (minutes) {
        const padLengthMinutes = hours ? 2 : 1;
        result += `${minutes.toString().padStart(padLengthMinutes, "0")}:`;
    }
    
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    const padLengthSeconds = minutes ? 2 : 1;
    result += `${seconds.toString().padStart(padLengthSeconds, "0")}`;

    return result;
}

export default Countdowns;
