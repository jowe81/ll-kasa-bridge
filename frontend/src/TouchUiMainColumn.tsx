import AutomationPanel from "./features/devices/AutomationPanel";
import TimerPanel from "./features/timer/TimerPanel";

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
  }

  return <div className="touch-ui-main-column">{ content }</div>
}

export default TouchUiMainColumn;