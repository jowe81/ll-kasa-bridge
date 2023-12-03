import Forecast from "./forecast/Forecast";
import Clock from "./clock/Clock";
import Temperature from "./temperature/Temperature";
import CompactTimer from "./compactTimer/CompactTimer";
import CompactBirthdays from "./compactBirthdays/CompactBirthdays";
import Scripture from "./scripture/Scripture";

function TouchUiPanel() {
  return (
      <>
          <div className="touch-ui-panel-item touch-ui-panel-item-remaining-space">
            <Scripture />
          </div>
          <div className="touch-ui-panel-item">
            <CompactBirthdays />
          </div>
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
          <div className="touch-ui-panel-item-nopad">
              <Clock />
          </div>
      </>
  );
}

export default TouchUiPanel;