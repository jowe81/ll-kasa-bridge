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

    const raidStatus = systemInfo.raidStatus;
    const raidStatusJsx = raidStatus.map((info, index) => {
        return (
            <tr key={index}>
                <td>Raid {info.device}</td>
                <td>
                    {info.diskStatusOk && !info.syncing && (
                        <>
                            <span className="badge-green">OK</span> [{info.diskStatus}]
                        </>
                    )}
                    {!info.diskStatusOk && <span className="badge-red">[{info.diskStatus}]</span>}
                    {info.syncPercent && (
                        <>
                            [{info.diskStatus}] <span className="badge-orange"> {info.syncPercent}%</span>
                        </>
                    )}
                </td>
            </tr>
        );
    });


    const disks = systemInfo?.disks ?? {};
    const diskInfoJsx = Object.keys(disks).map((devicePath, index) => {
        const devicePathEscaped = <span>{devicePath.length > 10 ? '...' + devicePath.substr(-10) : devicePath}</span>
        return (
            <tr key={index}>
                <td>{devicePathEscaped}</td>
                <td>
                    {disks[devicePath].f_free} free
                </td>
            </tr>
        );
    });

    const ipAddresses = systemInfo?.ipAddresses ?? {};
    const ipAddressesInfoJsx = Object.keys(ipAddresses).map((interfaceName, index) => {
        return (
            <tr key={index}>
                <td>IP ({interfaceName}):</td>
                <td>{ipAddresses[interfaceName].join(', ')}</td>
            </tr>
        );
    });

    return (
        <div className="touch-ui-panel-item">
            <div className="system-info-container">
                <div className={`system-info-label`}>System Info</div>
                <div className="system-info-items-container">
                    <table className="system-info-table">
                        <thead></thead>
                        <tbody>
                            <tr>
                                <td className="system-info-table-leftcol">Uptime:</td>
                                <td>{systemInfo?.uptime}</td>
                            </tr>
                            <tr>
                                <td>DDNS Status:</td>
                                <td>
                                    {systemInfo?.publicHostnameStatus?.ok && (
                                        <>
                                            <span className="badge-green">OK</span>{" "}
                                            {systemInfo?.publicHostnameStatus?.message}
                                        </>
                                    )}
                                    {!systemInfo?.publicHostnameStatus?.ok && (
                                        <span className="badge-red">{systemInfo?.publicHostnameStatus?.message}</span>
                                    )}
                                </td>
                            </tr>
                            {raidStatusJsx}
                            {diskInfoJsx}
                            <tr>
                                <td>Memory:</td>
                                <td>{systemInfo?.freeMem} free</td>
                            </tr>
                            <tr>
                                <td>Load:</td>
                                <td>{systemInfo?.loadAvg}</td>
                            </tr>
                            {ipAddressesInfoJsx}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default SystemInfo