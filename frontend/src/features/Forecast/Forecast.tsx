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

    const displayData = getDisplayData(state, 0);

    const styleTemp = {
        color: tempToColor(displayData.tempC),
    };

    const styleTrend = {
        color: displayData.trendColor,
    };

    return (
        <div className="fullscreen-panel-temperature">
            <div className="thermometer-label">3-hour Forecast</div>
            <div className="thermometer-temp" style={styleTemp}>
                {displayData.tempC ?? 'N/A'}
            </div>
            <div className="thermometer-trend" style={styleTrend}>
                {displayData.weatherMain ?? 'N/A'}
            </div>
        </div>
    );
}


function getDisplayData(state, n) {
    const extractedData: any = {}

    if  (extractedData.weatherMain = state.list && state.list[n] && state.list[n].weather && state.list[n].weather.length) {
      extractedData.cityName = state.city?.name;
      extractedData.weatherMain = state.list[n].weather[0].main;
      extractedData.tempC = (state.list[n].main.temp - 273).toFixed(1) + "°C"; // Comes in Kelvin
    }

    

    return extractedData;
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

export default Forecast;