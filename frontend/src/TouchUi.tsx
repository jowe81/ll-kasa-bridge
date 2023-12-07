
import AutomationPanel from "./features/TouchUiMain/devices/AutomationPanel";
import TimerPanel from "./features/TouchUiMain/timer/TimerPanel";
import Photos from "./features/photos/Photos";
import Birthdays from "./features/TouchUiMain/birthdays/Birthdays";

import TouchUiPanel from "./features/TouchUiPanel/TouchUiPanel";

import './touch.css';
import { useState } from "react";



function TouchUi() {

  const [fullScreen, setFullScreen] = useState<boolean>(true);

  function toggleFullScreen() {
    setFullScreen(!fullScreen);
  }

  const fullScreenButton = <button onClick={toggleFullScreen}>{fullScreen ? `Close` : `Expand`}</button>;

  const photoProps = {
      fullScreen,
      fullScreenButton,
  };

  let content;

  if (fullScreen) {
    content = (
        <>
            <Photos {...photoProps} />
            <div className="touch-ui-panel-container">
                <TouchUiPanel />
            </div>
        </>
    );
  } else {
    content = (
        <>
            <div className="touch-ui-columns-container">
                <div className="touch-ui-main-column">
                    <TimerPanel />
                    <Birthdays />
                </div>
                <div className="touch-ui-main-column-remaining-space">
                  <Photos {...photoProps} />
                </div>
                <div className="touch-ui-main-column">
                    <AutomationPanel />
                </div>
            </div>
            <div className="touch-ui-panel-container">
                <TouchUiPanel />
            </div>
        </>
    );
  }
  return (
    <div className='touch-ui-container'>
      {content}
    </div>
  )
}

export default TouchUi;