import PresetButton from "./PresetButton";
import './presets.css';

function Presets(props) {
    const timers = { ...props.configuredTimers } ?? {};

    const presetButtons: any = [];

    // Put this as the first button
    presetButtons.push({
        id: "__custom",
        topLabel: "Custom",
        subLabel: "Other",
        onClick: props.onCustomClick,
    });
  
    Object.keys(timers).forEach((key) => {
        if (!(timers[key].displayButton === false)) {
            presetButtons.push(timers[key]);
        }
    });

    const presetButtonsJsx = presetButtons.map((button, index) => {
        return (
            <PresetButton key={index} onClick={props.onClick} button={button} />
        );
    });

    return <div className="timer-panel-item presets">{presetButtonsJsx}</div>;
}

export default Presets;