import constants from "../../../constants.js";
import { getDeviceByChannel } from "../../../devicesHelpers";
import { getDynformsServiceRecords } from "./../../../dynformsHelpers";
import { getMidNight, getNDaysAgoMidnight, getTimeDifference } from "../calendar/calendarHelpers";
import "./medical.css"

function Medical() {
    const service = getDeviceByChannel(506);
    
    if (!service) {
        return;
    }
    const records = getDynformsServiceRecords(service.channel);

    const sampleData = [        
        getAverageSysDiaPulse(records, getMidNight(), new Date(), 'Today'),
        getAverageSysDiaPulse(records, getNDaysAgoMidnight(1), getMidNight(), 'Yesterday'),
        getAverageSysDiaPulse(records, getNDaysAgoMidnight(7), getMidNight(), '7 Days'),
        getAverageSysDiaPulse(records, getNDaysAgoMidnight(30), getMidNight(), '30 Days'),
    ];

    const lastSampleSysDiaPulse = getLastSampleSysDiaPulse(records[records.length - 1]);
    if (lastSampleSysDiaPulse) {
        sampleData.unshift(lastSampleSysDiaPulse);
    }

    const rowsJsx = sampleData
        .filter((avgData) => avgData)
        .map((avgData, index) => {
            const sysDia = !(isNaN(avgData?.sys) || isNaN(avgData?.dia)) ? `${avgData?.sys}/${avgData?.dia}` : "N/A";
            const pulse = !isNaN(avgData?.pulse) ? avgData?.pulse : "N/A";
            return (
                <tr key={index}>
                    <td>{avgData?.label}</td>
                    <td className="right-align">{sysDia}</td>
                    <td className="right-align">{pulse}</td>
                    <td className="right-align muted">{avgData?.samples}</td>
                </tr>
            );
        });

    return (
        <div className="medical-container">
            <div className="medical-header">Johannes Vitals</div>
            <div className="medical-items-container">
                <table className="blood-pressure-table">
                    <thead>
                        <tr>
                            <th><div className="left-align">Average for</div></th>
                            <th><div>Sys/Dia</div></th>
                            <th><div>Pulse</div></th>
                            <th><div>#Samples</div></th>
                        </tr>
                    </thead>
                    <tbody>{rowsJsx}</tbody>
                </table>
            </div>
        </div>
    );        
}

function getAverageSysDiaPulse(records, startTime: Date, endTime: Date, label: string) {
    if (!records) {
        return null;
    }

    const targetRecords = records.filter(record => { 
        const createdAt = new Date(record.created_at);
        return (createdAt > startTime) && (createdAt < endTime); 
    })

    let totalSys = 0, totalDia = 0, totalPulse = 0;
    let samplesSysDia = 0, samplesPulse = 0;

    targetRecords.forEach(({sys, dia, pulse}) => {       
        if (sys && dia) {
            totalSys += sys;
            totalDia += dia;
            samplesSysDia++;
        }

        if (pulse) {
            totalPulse += pulse;
            samplesPulse++; 
        }        
    });

    return {
        label,
        sys: Math.round(totalSys / samplesSysDia),
        dia: Math.round(totalDia / samplesSysDia),
        pulse: Math.round(totalPulse / samplesPulse),
        samples: targetRecords.length,
    };    
}

function getLastSampleSysDiaPulse(sample, sampleMaxAgeDays = 2) {
    if (!sample) {
        return null;
    }

    const lastSample = sample;
    let now = new Date();
    let lastSampleLabel;
    let lastSampleCreatedAt = new Date(lastSample.created_at);
    let lastSampleTimeDiff = getTimeDifference(now, lastSampleCreatedAt);
    let timeDiffHours = (Math.round(now.getTime() - lastSampleCreatedAt.getTime()) / constants.HOUR);

    if (now.getTime() - lastSampleCreatedAt.getTime() > sampleMaxAgeDays * constants.DAY) {
        // Don't show the last sample at all - too old.
        return null;
    }

    let colorClass = 'badge-neutral';
    if (timeDiffHours >= 5) {
        colorClass = 'badge-red';
    } else if (timeDiffHours >= 3) {
        colorClass = 'badge-orange';
    }

    const style = {
        display: 'inline-block',
        fontSize: '85%',
        padding: '1px 3px',
        borderRadius: '3px',
    }

    lastSampleLabel = <span style={style} className={colorClass}>{lastSampleTimeDiff} ago</span>;

    return {
        label: lastSampleLabel,
        sys: lastSample.sys,
        dia: lastSample.dia,
        pulse: lastSample.pulse,
        samples: 1,
    }
}

export default Medical;
