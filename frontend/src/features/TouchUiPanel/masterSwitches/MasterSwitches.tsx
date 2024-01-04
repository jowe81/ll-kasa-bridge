import { useAppSelector } from "../../../app/hooks.ts";
import { Device, Group } from "./../../../features/TouchUiMain/devices/dataSlice.ts";
import MasterSwitchButton from "./MasterSwitchButton.tsx";
import constants from "../../../constants.ts";

import "./../../../features/TouchUiMain/devices/devices.css";
import "./masterSwitches.css";



function MasterSwitches(props) {
    const devices = useAppSelector((state) => state.data.devices);
    const masterSwitches = getMasterSwitches(devices);

    if (!masterSwitches || !masterSwitches.length) {
      return;
    }

    const masterSwitch = masterSwitches[0];
    const buttonsConfig = masterSwitch.settings?.buttons;

    const buttonsJsx = buttonsConfig.map((button, index) => {
      const props = {
          button,
      };

      return <MasterSwitchButton key={index} {...props}/>
    });

    return (
        <div className="touch-ui-panel-item">
            <div className="master-switches-container">
                {props.fullScreenButton}
                <div className="master-switches-buttons-container">
                    {buttonsJsx}
                </div>
            </div>
        </div>
    );
}

function getMasterSwitches(devices: Device[]) {
  return devices.filter((device: Device) => device.subType === constants.SUBTYPE_MASTER_SWITCH);
}

export default MasterSwitches;
