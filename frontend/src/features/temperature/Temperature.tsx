import "./temperature.css";
import { Device } from "../devices/dataSlice.ts";
import constants from "../../constants.ts";

import { useAppSelector } from "../../app/hooks.ts";

function Temperature(props: any) {
    const devices = useAppSelector((state) => state.data.devices);
    const getThermometers = (devices: Device[]): Device[] => {
        return devices.filter((device) => constants.touchPanel.thermometerChannels.includes(device.channel)).sort((a, b) => a.channel > b.channel ? 1 : -1);
    };

    const thermometers = getThermometers(devices);

    const thermometer = props.type === 'secondary' ?
      thermometers.length > 1 ? thermometers[1] : null :
      thermometers.length ? thermometers[0] : null;

    const getDisplayData = (thermometer: any, useTrend = 'long') => {
      const data = {
          tempC: "N/A",
          modifier: "",
          trend: "",
          trendDirection: "",
          trendColor: "",
      };

      if (!thermometer || !thermometer.state?.trends) {
        return data;
      }

      const { state } = thermometer;

      data.tempC = state.tempC?.toFixed(1) + "°C";

      let diff:(null|number) = null;

      if (state.trends[useTrend] && typeof(state.trends[useTrend].diff) === 'number') {
        diff = state.trends[useTrend].diff;
      }

      if (diff === null) {
        // No trend data.
        return data;
      }
      const absDiff = Math.abs(diff);

      const minorTrendThreshold = .25;
      const mediumTrendThreshold = .7;
      const majorTrendThreshold = 1.3;
      
      if (absDiff > minorTrendThreshold) {
          if (diff > 0) {
              data.trendDirection = "warming";
              data.trendColor = "#FF7777DD";
          } else {
              data.trendDirection = "cooling";
              data.trendColor = "#9999FFDD";
          }
      } else {
        data.trendDirection = "steady";
        data.trendColor = "#DDDDDD";
      }

      let modifier: (string) = '';

      if (absDiff > minorTrendThreshold) {
          modifier = "a little";
      }

      if (absDiff > mediumTrendThreshold) {
          modifier = "";
      }

      if (absDiff > majorTrendThreshold) {
          modifier = "quickly";
      }

      data.trend = modifier !== null ? `${data.trendDirection} ${modifier}` : `steady`;
      data.trend = `${data.trendDirection} ${modifier}`;
      
      return data;
    }

    const primaryData = getDisplayData(thermometer, 'long');

    const styleTemp = {
        color: tempToColor(primaryData.tempC),
    };

    const styleTrend = {
        color: primaryData.trendColor,
    };

    return (
      <div className="fullscreen-panel-temperature">
          <div className="thermometer-label">
              {thermometer?.location}
          </div>
          <div className="thermometer-temp" style={styleTemp}>
              {primaryData.tempC}
          </div>
          <div className="thermometer-trend" style={styleTrend}>
              {primaryData.trend}
          </div>
      </div>
    );
}

function tempToColor(tempC) {
  tempC = parseFloat(tempC);

  let color = '6666FF';
  if (tempC >= 0) {
    color = '9999FF';
  }

  if (tempC >= 20) {
    color = '99FF99';
  }

  if (tempC >= 25) {
    color = 'FFAAAA';
  }

  if (tempC >= 30) {
      color = "FF7777";
  }

  return `#${color}`;
}

export default Temperature;
