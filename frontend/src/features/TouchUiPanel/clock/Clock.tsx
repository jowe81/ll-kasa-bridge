import { useAppSelector } from "../../../app/hooks.ts";

import constants from "../../../constants.ts";

import { VirtualDevice } from "../../TouchUiMain/devices/dataSlice.ts";

import "./clock.css";

function Clock() {
    const devices: VirtualDevice[] = useAppSelector(state => state.data.devices);
    const clock = devices.find(device => device.subType === constants.SUBTYPE_CLOCK && device.channel === constants.clock?.clockChannel);
    const clockData = clock?.state?.clock;

    return (
        <div className="fullscreen-panel-clock">
            <div className="fullscreen-panel-clock-time">
                {clockData?.displayTime ?? "N/A"}
            </div>
            <div className="fullscreen-panel-clock-bottom">
                <div>{currentDate(parseInt(clockData?.ms)) ?? "N/A"}</div>
                <div>Sunrise: {clockData?.sunrise ?? "N/A"}</div>
                <div>Sunset: {clockData?.sunset ?? "N/A"}</div>
            </div>
        </div>
    );
}

function currentDate(ms?: number) {
    if (!ms) {
        return null;        
    }

    const date = new Date(ms);

    const options: any = {
        month: "short",
        day: "numeric",
    };

    return date.toLocaleDateString("en-CA", options);
}

export default Clock;
