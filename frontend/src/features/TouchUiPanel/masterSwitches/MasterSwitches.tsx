import { useAppSelector } from "../../../app/hooks.ts";
import { Device, Group } from "./../../../features/TouchUiMain/devices/dataSlice.ts";
import TouchButtonDevice from "./../../../features/TouchUiMain/devices/TouchButtonDevice.tsx";
import constants from "../../../constants.ts";

import "./../../../features/TouchUiMain/devices/devices.css";
import "./masterSwitches.css";



function MasterSwitches() {
    const devices = useAppSelector((state) => state.data.devices);
    const masterSwitches = getMasterSwitches(devices);

    if (!masterSwitches || !masterSwitches.length) {
      return;
    }

    return (
        <div className="touch-ui-panel-item">
            <div className="master-switches-container">
              MASTER SWITCHES
            </div>
        </div>
    );
}

function getMasterSwitches(devices: Device[]) {
  return devices.filter((device: Device) => device.subType === constants.SUBTYPE_MASTER_SWITCH);
}

export default MasterSwitches;
