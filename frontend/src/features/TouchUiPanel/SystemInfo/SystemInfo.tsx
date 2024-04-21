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
        <div className="touch-ui-panel-item system-info-container">
            <div className={``}>
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
                                <td>Memory:</td>
                                <td>{systemInfo?.freeMem} free</td>
                            </tr>
                            <tr>
                                <td>Hostname:</td>
                                <td>{systemInfo?.publicHostnameStatus?.message}</td>
                            </tr>
                            <tr>
                                <td>Load:</td>
                                <td>{systemInfo?.loadAvg}</td>
                            </tr>
                            {diskInfoJsx}
                            {ipAddressesInfoJsx}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default SystemInfo