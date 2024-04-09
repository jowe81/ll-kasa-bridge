import React from 'react'
import constants from '../../../constants.ts';
import "./systemInfo.scss";
import { useAppSelector } from "../../../app/hooks.ts";
import { VirtualDevice } from "../../TouchUiMain/devices/dataSlice.ts";

function SystemInfo() {
    const devices: VirtualDevice[] = useAppSelector((state) => state.data.devices);
    const clock = devices.find(
        (device) => device.subType === constants.SUBTYPE_CLOCK && device.channel === constants.clock?.serviceChannel
    );
    const systemInfo = clock?.state?.system;
    
    const disks = systemInfo?.disks ?? {};
    console.log(disks);
    const diskInfoJsx = Object.keys(disks).map((devicePath, index) => {
        return <tr key={index}><td>{devicePath}</td><td>{disks[devicePath].f_total}, {disks[devicePath].freePercent}%, {disks[devicePath].avPercent}%</td></tr>
    });

    return (
        <div className="touch-ui-panel-item system-info-container">
            <div className={``}>
                <div className={`system-info-label`}>System Info</div>
                <div className="system-info-items-container">
                    <table className='system-info-table'>
                        <thead></thead>
                        <tbody>
                            <tr>
                                <td>Uptime:</td>
                                <td>{systemInfo.uptime}</td>
                            </tr>
                            <tr>
                                <td>Memory:</td>
                                <td>
                                    {systemInfo.freeMem} / {systemInfo.totalMem}
                                </td>
                            </tr>
                            <tr>
                                <td>Load:</td>
                                <td>
                                    {systemInfo.loadAvg}
                                </td>
                            </tr>
                            {diskInfoJsx}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default SystemInfo