import AutomationPanel from "./devices/AutomationPanel";
import TimerPanel from "./timer/TimerPanel";
import Photos from "../photos/Photos";

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