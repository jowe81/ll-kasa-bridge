import { socket } from "../../websockets/socket.tsx";

const MasterSwitchButton = ({ button, powerState }) => {

    if (!button) {
      return;
    }

    function onClick(e) {
        const buttonContainerElem = e.target.closest(".master-switch-button");
        const buttonId = buttonContainerElem?.dataset?.buttonId;

        socket.emit('auto/command/masterSwitch', { buttonId });
        console.log(`Pressed master button ${buttonId}`);

    }

    const metaClass = `master-switch-button-meta-${button.buttonId}`;

    let powerStateString = 'none';
    if (powerState === true) {
        powerStateString = 'on';
    } else if (powerState === false) {
        powerStateString = 'off';
    }

    let html = (
        <>
            <div className={metaClass}>
                <div className="master-switch-button-top-text">
                  Lights Master
                </div>
                <div className="master-switch-button-label">
                    {button.displayLabel ?? button.alias}
                </div>
            </div>
            <div className="device-alias"></div>
        </>
    );
    
    return (
        <div
            className={`master-switch-button master-switch-button-background-${button.buttonId} master-switch-button-power-state-${button.buttonId}-${powerStateString}`}
            data-button-id={button?.buttonId}
            onClick={onClick}
        >
            {html}
        </div>
    );
};

export default MasterSwitchButton;
