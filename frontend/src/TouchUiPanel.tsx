import Forecast from "./features/Forecast/Forecast";
import Clock from "./features/clock/Clock";
import Temperature from "./features/temperature/Temperature";

function TouchUiPanel() {
  return (
      <>
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