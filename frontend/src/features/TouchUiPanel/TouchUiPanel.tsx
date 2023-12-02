import Forecast from "./forecast/Forecast";
import Clock from "./clock/Clock";
import Temperature from "./temperature/Temperature";
import CompactTimer from "./compactTimer/CompactTimer";

function TouchUiPanel() {
  return (
      <>
          <div className="touch-ui-panel-item">
            <CompactTimer />
          </div>
          <div className="touch-ui-panel-item fullscreen-panel-temperature">
              <Temperature type="primary" />
              <Temperature type="secondary" />
          </div>
          <div className="touch-ui-panel-item">
              <Forecast />
          </div>
          <div className="touch-ui-panel-item">
              <Clock />
          </div>
      </>
  );
}

export default TouchUiPanel;