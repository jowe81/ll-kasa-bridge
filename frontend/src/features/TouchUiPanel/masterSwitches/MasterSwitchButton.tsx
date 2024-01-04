import { useState, useEffect } from "react";
import { Device } from "../../TouchUiMain/devices/dataSlice.ts";
import constants from "../../../constants.ts";

import { socket } from "../../websockets/socket.tsx";

const MasterSwitchButton = ({ button }) => {

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
            className={`master-switch-button master-switch-button-background-${button.buttonId}`}
            data-button-id={button?.buttonId}
            onClick={onClick}
        >
            {html}
        </div>
    );
};

export default MasterSwitchButton;
