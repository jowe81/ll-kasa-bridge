import AutomationPanel from "./features/devices/AutomationPanel";
import TimerPanel from "./features/timer/TimerPanel";
import Photos from "./features/photos/Photos";

function TouchUiMainColumn(props) {
  const { columnId } = props; 

  let content;
  switch (columnId) {
    case '1':
      content = <>
        <AutomationPanel />
      </>
      break;
    case '2':
      content = <>
        <TimerPanel />
      </>
      break;

    case '3':
      content = <>
        <Photos />
      </>
      break;

  }

  return <div className="touch-ui-main-column">{ content }</div>
}

export default TouchUiMainColumn;