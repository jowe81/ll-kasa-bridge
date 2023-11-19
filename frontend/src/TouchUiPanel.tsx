import Clock from "./features/clock/Clock";
import Temperature from "./features/temperature/Temperature";

function TouchUiPanel() {
  return (<>
    <div className='touch-ui-panel-item'><Temperature /></div>
    <div className='touch-ui-panel-item'><Clock /></div>
  </>)
}

export default TouchUiPanel;