import AutomationPanel from "./devices/AutomationPanel";
import TimerPanel from "./timer/TimerPanel";
import Photos from "../photos/Photos";
import Birthdays from "./birthdays/Birthdays";

function TouchUiMainColumn(props) {
  const { columnId, style } = props; 

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
        <Birthdays />
      </>
      break;

    case '3':
      content = <>
        <Photos {...props} />
      </>
      break;

  }
  
  return <div style={style} className="touch-ui-main-column">{ content }</div>
}

export default TouchUiMainColumn;