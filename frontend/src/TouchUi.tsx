
import TouchUiMainColumn from "./features/TouchUiMain/TouchUiMainColumn";
import TouchUiPanel from "./features/TouchUiPanel/TouchUiPanel";
import Photos from "./features/photos/Photos";
import './touch.css';
import { useState } from "react";



function TouchUi() {

  const [fullScreen, setFullScreen] = useState<boolean>(true);

  function toggleFullScreen() {
    setFullScreen(!fullScreen);
  }

  const fullScreenButton = <button onClick={toggleFullScreen}>{fullScreen ? `Close` : `Expand`}</button>;

  const props = {
      fullScreen,
      fullScreenButton,
  };

  const props1 = {
    ...props,
    style: { width: '315px' },
  };

  const props2 = {
    ...props,
    style: { width: '300px' }
  };

  const props3 = {
    ...props,
    style: { 
      padding: '0px',
      
    }
  }

  let content;


  if (fullScreen) {
    content = (
        <>
            <Photos {...props} />
            <div className="touch-ui-panel-container">
                <TouchUiPanel />
            </div>
        </>
    );
  } else {
    content = (
        <>
            <div className="touch-ui-columns-container">
                <TouchUiMainColumn {...props1} columnId="1" />
                <TouchUiMainColumn {...props2} columnId="2" />
                <TouchUiMainColumn {...props3} columnId="3" />
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