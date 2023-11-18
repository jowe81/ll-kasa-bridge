
import TouchUiMainColumn from "./TouchUiMainColumn";
import TouchUiPanel from "./TouchUiPanel";
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
      width: '100%',
      height: '1050px',
      // border: '1px solid yellow'
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