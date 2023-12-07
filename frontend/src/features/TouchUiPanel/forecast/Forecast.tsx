import './forecast.css';

import { Device } from "../../TouchUiMain/devices/dataSlice.ts";
import constants from "../../../constants.ts";

import { useAppSelector } from "../../../app/hooks.ts";

function Forecast() {
    const devices = useAppSelector((state) => state.data.devices);
    const getWeatherServices = (devices: Device[]): Device[] => {
        return devices
            .filter((device) =>
                constants.touchPanel.forecastChannels.includes(
                    device.channel
                )
            )
            .sort((a, b) => (a.channel > b.channel ? 1 : -1));
    };


    const weatherServices = getWeatherServices(devices);
    const weatherService = weatherServices.length ? weatherServices[0] : null;
    
    if (!weatherService) {
      return;
    }

    const forecast = weatherService.state?.forecast;

    const displayDataJsx = forecast?.map((item, index) => {

      const styleTemp = {
          color: tempToColor(item.tempC),
      };

      return (
          <div key={index} className="forecast-item-container">
              <div className="forecast-text-container">
                  <div className="forecast-text-time">{item.dateText}</div>
                  <div className="forecast-text-temp" style={styleTemp}>
                      {item.tempC}°
                  </div>
              </div>
              <div className="forecast-icon-container">
                  <img className="forecast-icon" src={item.iconUrl} />
              </div>
          </div>
      );
    })
    
    return (
        <div className="touch-ui-panel-item">
            <div className="fullscreen-panel-forecast">
                <div className="forecast-label">Forecast</div>
                <div className="forecast-display-data-container">
                    {displayDataJsx}
                </div>
            </div>
        </div>
    );
}

function tempToColor(tempC) {
    tempC = parseFloat(tempC);

    let color = "6666FF";
    if (tempC >= 0) {
        color = "CCCCFF";
    }

    if (tempC >= 20) {
        color = "99FF99";
    }

    if (tempC >= 25) {
        color = "FFAAAA";
    }

    if (tempC >= 30) {
        color = "FF9999";
    }

    return `#${color}`;
}

export default Forecast;