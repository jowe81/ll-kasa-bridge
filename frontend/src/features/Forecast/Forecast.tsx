import './forecast.css';

import { Device, Group } from "../devices/dataSlice.ts";
import constants from "../../constants.ts";

import { useAppSelector } from "../../app/hooks.ts";




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

    const { state } = weatherService;

    let displayData = getDisplayData(state, 0);

    const allDisplayData = getAllDisplayData(state, 4);

    const displayDataJsx = allDisplayData.map((item, index) => {

      const styleTemp = {
          color: tempToColor(displayData.tempC),
      };

      return (
          <div key={index} className="forecast-item-container">
              <div className="forecast-text-container">
                  <div className="forecast-text-time">{item.dateText}</div>
                  <div className="forecast-text-temp" style={styleTemp}>
                      {item.tempC}
                  </div>
              </div>
              <div className="forecast-icon-container">
                  <img className="forecast-icon" src={item.iconUrl} />
              </div>
          </div>
      );
    })
    

    return (
        <div className="fullscreen-panel-temperature">
            <div className="forecast-label">Shortterm Forecast</div>
            <div className="forecast-display-data-container">
                {displayDataJsx}
            </div>
        </div>
    );
}


function getDisplayData(state, n) {
    const extractedData: any = {}
    
    if  (extractedData.weatherMain = state.list && state.list[n] && state.list[n].weather && state.list[n].weather.length) {      
      extractedData.timestamp = state.list[n].dt;
      extractedData.dateText = formatForecastDate(extractedData.timestamp);
      extractedData.dateHour = new Date(extractedData.timestamp * 1000).getHours();
      extractedData.cityName = state.city?.name;
      extractedData.weatherMain = state.list[n].weather[0].description;
      extractedData.icon = state.list[n].weather[0].icon;
      extractedData.iconUrl = `https://openweathermap.org/img/w/${extractedData.icon}.png`;
      extractedData.tempC = (state.list[n].main.temp - 273).toFixed() + "°"; // Comes in Kelvin
    }

    return extractedData;
}

function getAllDisplayData(state, maxLength: number = 10, skipNight = true) {
  if (!(state && state.list)) {
    return [];
  }

  const displayData: any[] = [];

  state.list.forEach((item, index) => {
    const itemsCollected = displayData.length;

    if (itemsCollected < maxLength) {
        const displayDataItem = getDisplayData(state, index);
        if (displayDataItem.dateHour > 6 && displayDataItem.dateHour < 22) {
            displayData.push(displayDataItem);
        }        
    }
    
  })
  
  return displayData;
}

function tempToColor(tempC) {
    tempC = parseFloat(tempC);

    let color = "6666FF";
    if (tempC >= 0) {
        color = "9999FF";
    }

    if (tempC >= 20) {
        color = "99FF99";
    }

    if (tempC >= 25) {
        color = "FFAAAA";
    }

    if (tempC >= 30) {
        color = "FF7777";
    }

    return `#${color}`;
}

function formatForecastDate(unixTimestamp) {
    // Create a new Date object using the timestamp (multiply by 1000 to convert seconds to milliseconds)
    const date = new Date(unixTimestamp * 1000);

    // Get the hour and minute
    const hour = date.getHours();

    // Format the result
    const formattedDate = `${
        hour % 12 === 0 ? 12 : hour % 12
    }${hour >= 12 ? "pm" : "am"}`;

    return formattedDate;
}

export default Forecast;