
import AutomationPanel from "./features/TouchUiMain/devices/AutomationPanel";
import TimerPanel from "./features/TouchUiMain/timer/TimerPanel";
import Photos from "./features/photos/Photos";
import Birthdays from "./features/TouchUiMain/birthdays/Birthdays";
import Medical from "./features/TouchUiMain/Medical/Medical.tsx";
import Calendar from "./features/TouchUiMain/calendar/Calendar.tsx";
import ScreenKeyboard from "./features/ScreenKeyboard/ScreenKeyboard.tsx";
import TouchUiPanel from "./features/TouchUiPanel/TouchUiPanel";
import Scripture from "./features/TouchUiPanel/scripture/Scripture.tsx";
import './touch.css';
import { useState } from "react";
import { useScreenKeyboard } from "./contexts/ScreenKeyboardContext.tsx";

import { getAllDevices, getClock, getMasterSwitchDimInfo } from "./devicesHelpers.tsx";

function TouchUi() {
    const [fullScreen, setFullScreen] = useState<boolean>(true);
    
    const { isKeyboardVisible } = useScreenKeyboard();

    function toggleFullScreen() {
        setFullScreen(!fullScreen);
    }

    const devices = getAllDevices();
    const clock = getClock();
    const dimInfo = getMasterSwitchDimInfo();
   
    let fullScreenButtonClassName = "compact-base-button toggle-fullscreen-button";

    if (fullScreen) {
      fullScreenButtonClassName += " "
    }
    const fullScreenButton = (
        <button className="compact-base-button toggle-fullscreen-button" onClick={toggleFullScreen}>
            {fullScreen ? `All Controls` : `Full Screen`}
        </button>
    );

    const props = {
        fullScreen,
        fullScreenButton,
        renderForMainViewingArea: false,
    };
    
    let content;

    // Default to photos, but may be overridden
    let mainViewingAreaJsx = <Photos {...props} />;

    const overrideChannels = [ 503 ];

    const overrideDevice = getMainViewingAreaOverrideDevice(overrideChannels, clock, devices);    
  
    if (overrideDevice && fullScreen) {
        const overrideProps = { ...props };
        overrideProps.renderForMainViewingArea = true;

        switch (overrideDevice?.id) {
            case "scriptures-service":
                mainViewingAreaJsx = <Scripture {...overrideProps} />;
                break;

            default:
                break;
        }
    }


    if (fullScreen) {
        content = (
            <>
                {isKeyboardVisible && <ScreenKeyboard/>}
                <div className="touch-ui-fullscreen-container">
                    {mainViewingAreaJsx}
                </div>
                <div className="touch-ui-panel-container">
                    <TouchUiPanel {...props}/>
                </div>
            </>
        );
    } else {
        content = (
            <>
                <div className="touch-ui-columns-container">
                    <div className="touch-ui-main-column touch-ui-left-column">
                        <TimerPanel />
                        <Birthdays />
                        <Medical />
                    </div>
                    <div className="touch-ui-main-column-remaining-space">
                        <div className="remaining-main">
                            <Calendar />
                            {mainViewingAreaJsx}
                        </div>
                        <div className="remaining-panel">
                            <Scripture />
                        </div>
                    </div>
                    <div className="touch-ui-main-column touch-ui-right-column">
                        <AutomationPanel />
                    </div>
                </div>
                <div className="touch-ui-panel-container">
                    <TouchUiPanel {...props} />
                </div>
            </>
        );
    }

    let style = { opacity: dimInfo.opacity };    

    return <div className="touch-ui-container" style={style}>{content}</div>;
}

function getMainViewingAreaOverrideDevice(overrideChannels, clock, devices) {
    if (!clock) {
      return null;
    }


    if (!(devices && devices.length)) {
      return null;
    }
    
    const ms = clock.state?.clock?.ms;
    const now = new Date(ms);
    const startTime = new Date(ms);
    const endTime = new Date(ms);


    const foundDevices = devices.filter((device, index) => {
        if (!overrideChannels.includes(device.channel)) {
          return false;
        }
        const showInMainViewingArea = device.state?.settings?.ui?.showInMainViewingArea;

        if (!showInMainViewingArea) {
          return false;
        }

        startTime.setHours(showInMainViewingArea.startTime.hours);
        startTime.setMinutes(showInMainViewingArea.startTime.minutes);
        endTime.setHours(showInMainViewingArea.endTime.hours);
        endTime.setMinutes(showInMainViewingArea.endTime.minutes);

        if (now >= startTime && now <= endTime) {
          return true;
        }

        return false;
    });

    if (!(foundDevices && foundDevices.length)) {
      return null;
    }
    
    return foundDevices[0];
}

export default TouchUi;