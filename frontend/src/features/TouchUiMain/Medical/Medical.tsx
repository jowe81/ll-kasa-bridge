import { getDeviceByChannel } from "../../../devicesHelpers";
import constants from "../../../constants";

import "./medical.css"

function Medical() {
    const device = getDeviceByChannel(506);
    
    console.log(device);

    if (!device) {
        return;
    }
    const records = device.state?.api?.data?.records;
    
    const sampleData = [        
        getAverageSysDiaPulse(records, getMidNight(), new Date(), 'Today'),
        getAverageSysDiaPulse(records, getNDaysAgoMidnight(1), getMidNight(), 'Yesterday'),
        getAverageSysDiaPulse(records, getNDaysAgoMidnight(7), getMidNight(), '7 Days'),
        getAverageSysDiaPulse(records, getNDaysAgoMidnight(30), getMidNight(), '30 Days'),
    ];

    const rowsJsx = sampleData
        .filter(avgData => avgData) 
        .map((avgData, index) => (
        <tr key={index}>
            <td>
                {avgData?.label}
            </td>
            <td className="right-align">
                {avgData?.sys}/{avgData?.dia}
            </td>
            <td className="right-align">
                {avgData?.pulse}
            </td>
            <td className="right-align muted">
                {avgData?.samples}
            </td>
        </tr>
    ));

    return (
        <div className="medical-container">
            <div className="medical-header">Johannes Vitals</div>
            <div className="medical-items-container">
                <table className="blood-pressure-table">
                    <thead>
                        <th><div className="left-align">Average for</div></th>
                        <th><div>Sys/Dia</div></th>
                        <th><div>Pulse</div></th>
                        <th><div>#Samples</div></th>
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

function getMidNight() {
    const midnight = new Date();
    midnight.setHours(0);
    midnight.setMinutes(0);
    midnight.setSeconds(0);    
    return midnight;
}

function getSecondsSinceMidnight() {
    return Math.round((Date.now() - getMidNight().getTime()) / 1000)
}

function getNDaysAgoMidnight(n) {
    const midnight = getMidNight();
    midnight.setDate(midnight.getDate() - n);    
    return midnight;
}

export default Medical;
