import { getMasterSwitch } from "../../../devicesHelpers.tsx";
import PresetButton from "./PresetButton.tsx";

import "./../../../features/TouchUiMain/devices/devices.css";
import "./devicePresetButtons.scss";



function DevicePresetButtons(props) {
    const masterSwitch = getMasterSwitch();

    if (!masterSwitch) {
        return;
    }

    const buttonsConfig = masterSwitch.settings?.buttons?.filter(button => button.type === 'preset');


    const presetButtons = buttonsConfig?.filter((button) => button.type === "preset");
    const presetButtonsJsx = presetButtons.map((button, index) => {
        const props = {
            button,
            powerState: masterSwitch.state.buttons[button.buttonId],
        };

        return <PresetButton key={index} {...props} />;
    });


    return (
        <div className="touch-ui-panel-item">
            <div className="presets-container">
                <div className="preset-buttons-container">
                    {presetButtonsJsx}
                </div>
            </div>
        </div>
    );
}

export default DevicePresetButtons;
