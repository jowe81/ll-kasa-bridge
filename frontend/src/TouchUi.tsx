
import TouchUiMainColumn from "./TouchUiMainColumn";
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

  let content;


  if (fullScreen) {
    content = <Photos {...props}/> 
  } else {
    content = (
        <>
            <TouchUiMainColumn {...props} columnId="1" />
            <TouchUiMainColumn {...props} columnId="2" />
            <TouchUiMainColumn {...props} columnId="3" />
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