import { getMasterSwitch } from "../../../devicesHelpers.tsx";
import MasterSwitchButton from "./MasterSwitchButton.tsx";

import "./../../../features/TouchUiMain/devices/devices.css";
import "./masterSwitches.css";



function MasterSwitches(props) {
    const masterSwitch = getMasterSwitch();

    if (!masterSwitch) {
        return;
    }

    const buttonsConfig = masterSwitch.settings?.buttons?.filter(button => button.type === 'master');

    const buttonsJsx = buttonsConfig.map((button, index) => {
      const props = {
          button,
          powerState: masterSwitch.state.buttons[button.buttonId]
      };

      return <MasterSwitchButton key={index} {...props}/>
    });

    return (
        <div className="touch-ui-panel-item">
            <div className="master-switches-container">
                {props.screenModeButtons}
                <div className="master-switches-buttons-container">
                    {buttonsJsx}
                </div>
            </div>
        </div>
    );
}

export default MasterSwitches;
