import { useAppSelector } from "../../../app/hooks.ts";
import { getDateString } from "../../TouchUiMain/calendar/calendarHelpers.tsx";

import constants from "../../../constants.ts";

import { VirtualDevice } from "../../TouchUiMain/devices/dataSlice.ts";

import "./clock.css";

function Clock() {
    const devices: VirtualDevice[] = useAppSelector(state => state.data.devices);
    const clock = devices.find(device => device.subType === constants.SUBTYPE_CLOCK && device.channel === constants.clock?.serviceChannel);
    const clockData = clock?.state?.clock;

    let sunEvents;

    if (clockData?.nextSunEvent === 'sunset') {
      sunEvents = <>
        <div>SS: <span>{clockData?.sunset ?? "N/A"}</span></div>
        <div>SR: <span>{clockData?.sunrise ?? "N/A"}+</span></div>
      </>
    } else if(clockData?.nextSunEvent ==='sunrise') {
      sunEvents = <>
        <div>SR: <span>{clockData?.sunrise ?? "N/A"}{clockData?.am ? '' : '+'}</span></div>
        <div>SS: <span>{clockData?.sunset ?? "N/A"}{clockData?.am ? '' : '+'}</span></div>
      </>
    }

    return (
        <div className="touch-ui-panel-item-nopad">
            <div className="fullscreen-panel-clock">
                <div className="fullscreen-panel-clock-time">
                    {clockData?.displayTime ?? "N/A"}
                </div>
                <div className="fullscreen-panel-clock-bottom">
                    <div>
                        <span>
                            {currentDate(parseInt(clockData?.ms)) ?? "N/A"}
                        </span>
                    </div>
                    {sunEvents}
                </div>
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
        month: "numeric",
        day: "numeric",
    };
    return getDateString(date, { ...options, includeDayOfWeek: 'long'});
}

export default Clock;
