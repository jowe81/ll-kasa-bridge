import "./temperature.css";
import { Device } from "../../TouchUiMain/devices/dataSlice.ts";
import constants from "../../../constants.ts";

import { useAppSelector } from "../../../app/hooks.ts";

function Temperature(props: any) {
    const { thermometersStartIndex } = props;

    const devices = useAppSelector((state) => state.data.devices);

    const getThermometers = (devices: Device[]): Device[] => {
        const allThermometers = devices
            .filter((device) =>
                constants.touchPanel.thermometerChannels.includes(
                    device.channel
                )
            )
            .sort((a, b) => (a.channel > b.channel ? 1 : -1));
        
        return allThermometers.slice(thermometersStartIndex, thermometersStartIndex + 2);
    };

    const thermometers = getThermometers(devices);
    
    if (!thermometers.length) {
      return;
    }

    const thermometersJsx = thermometers.map((thermometer, index) => {
      const displayData = getDisplayData(thermometer, "long");
      let location = thermometer?.location;
      if (location && location.length > 10) {
          if (location.includes("Room")) {
              location = location.replace("Room", "Rm");
          }
      }
      const styleTemp = {
          color: tempToColor(displayData.tempC),
      };

      const styleTrend = {
          color: displayData.trendColor,
      };

      const trendIcons = Array.from(
          { length: displayData.trendIconCount },
          (_, index) => <img key={index} src={displayData.trendIconUrl} />
      );

      return (
          <div key={index} className="temperature-subpanel">
              <div className="thermometer-extradata-container">
                  <div className="thermometer-label">{location}</div>
                  <div className="thermometer-trend" style={styleTrend}>
                      {trendIcons}
                  </div>
              </div>
              <div className="thermometer-temp" style={styleTemp}>
                  {displayData.tempC}
              </div>
          </div>
      );
    });

    return (
        <div className="touch-ui-panel-item">
            <div className="fullscreen-panel-temperature">
                {thermometersJsx}
            </div>
        </div>
    );
}

function getDisplayData(thermometer: any, useTrend = "long") {
    const baseUrlToFrontend = window.location.origin;

    const data = {
        tempC: "N/A",
        modifier: "",
        trend: "",
        trendDirection: "",
        trendColor: "",
        trendIconUrl: "",
        trendIconCount: 0,
    };

    if (!thermometer || !thermometer.state?.trends) {
        return data;
    }

    const { state } = thermometer;

    data.tempC = state.tempC?.toFixed(1);

    let diff: null | number = null;

    if (
        state.trends[useTrend] &&
        typeof state.trends[useTrend].diff === "number"
    ) {
        diff = state.trends[useTrend].diff;
    }

    if (diff === null) {
        // No trend data.
        return data;
    }
    const absDiff = Math.abs(diff);

    const minorTrendThreshold = 0.25;
    const mediumTrendThreshold = 0.7;
    const majorTrendThreshold = 1.3;

    if (absDiff > minorTrendThreshold) {
        if (diff > 0) {
            data.trendDirection = "warming";
            data.trendIconUrl = `${baseUrlToFrontend}/icons/warming-arrow-up.png`;
            data.trendColor = "#FF7777DD";
        } else {
            data.trendDirection = "cooling";
            data.trendIconUrl = `${baseUrlToFrontend}/icons/cooling-arrow-down.png`;
            data.trendColor = "#9999FFDD";
        }
    } else {
        data.trendDirection = "steady";
        data.trendIconUrl = `${baseUrlToFrontend}/icons/steady-arrow-none.png`;
        data.trendColor = "#DDDDDD";
    }

    let modifier: string = "";
    let multiplier: number = 1;

    if (absDiff > minorTrendThreshold) {
        modifier = "a little";
    }

    if (absDiff > mediumTrendThreshold) {
        modifier = "";
    }

    if (absDiff > majorTrendThreshold) {
        modifier = "quickly";
        multiplier = 2;
    }

    data.trend =
        modifier !== null ? `${data.trendDirection} ${modifier}` : `steady`;
    data.trend = `${data.trendDirection} ${modifier}`;
    data.trendIconCount = multiplier;
    return data;
};

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
