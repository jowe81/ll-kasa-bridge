import { getMasterSwitch } from "../../../devicesHelpers.tsx";
import MasterSwitchButton from "./MasterSwitchButton.tsx";

import "./../../../features/TouchUiMain/devices/devices.css";
import "./masterSwitches.css";



function MasterSwitches(props) {
    const masterSwitch = getMasterSwitch();

    if (!masterSwitch) {
        return;
    }

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

export default MasterSwitches;
