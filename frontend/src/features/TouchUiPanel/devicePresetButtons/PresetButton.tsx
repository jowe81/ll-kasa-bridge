import { socket } from "../../websockets/socket.tsx";

const PresetButton = ({ button, powerState }) => {
    if (!button) {
        return;
    }

    function onClick(e) {
        const buttonContainerElem = e.target.closest(".preset-button");
        const buttonId = buttonContainerElem?.dataset?.buttonId;

        socket.emit("auto/command/masterSwitch", { buttonId });
        console.log(`Pressed preset button ${buttonId}`);
    }

    let stateString = "not-satisfied";
    if (powerState === true) {
        stateString = "satisfied";
    } else if (powerState === false) {
        stateString = "not-satisfied";
    }

    let html = (
        <>
            <div className="preset-button-meta">
                <div className="preset-button-top-text">Preset</div>
                <div className="preset-button-label">{button.displayLabel ?? button.alias}</div>
            </div>
            <div className="device-alias"></div>
        </>
    );

    return (
        <div
            className={`preset-button preset-button-state-${stateString}`}
            data-button-id={button?.buttonId}
            onClick={onClick}
        >
            {html}
        </div>
    );
};

export default PresetButton;
