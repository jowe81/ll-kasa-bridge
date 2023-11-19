import "./temperature.css";
import { Device, Group } from "../devices/dataSlice.ts";
import constants from "../../constants.ts";

import { useAppSelector } from "../../app/hooks.ts";
import { useState, useEffect } from "react";

function Temperature(props: any) {
    const devices = useAppSelector((state) => state.data.devices);
    const getThermometers = (devices: Device[]): Device[] => {
        return devices.filter((device) => constants.touchPanel.thermometerChannels.includes(device.channel)).sort((a, b) => a.channel > b.channel ? 1 : -1);
    };

    const thermometers = getThermometers(devices);

    const primaryThermometer = thermometers.length ? thermometers[0] : null;
    const secondaryThermometer = thermometers.length > 1 ? thermometers[1] : null;

    const getDisplayData = (thermometer: any ) => {
      if (!thermometer || !thermometer.state) {
        return {tempC: 'N/A'};
      }

      const { state } = thermometer;

      const data = {
          tempC: state.tempC?.toFixed(1) + "°C",
          modifier: '',
          trend: '',
      };

      let direction = state.diff > 0 ? 'warming' : 'cooling';

      let modifier: (null|string) = null;

      if (Math.abs(state.diff) > 0.25) {
          modifier = "a little";
      }

      if (Math.abs(state.diff) > 0.5) {
          modifier = ''
      }

      if (Math.abs(state.diff) > 1) {
          modifier = "a lot";
      }

      data.trend = modifier !== null ? `${direction} ${modifier}` : `steady`;
      
      return data;
    }

    const primaryData = getDisplayData(primaryThermometer);
    const secondaryData = getDisplayData(secondaryThermometer);

    const style = {
        color: tempToColor(primaryData.tempC),
    };

    return (
        <>
            <div className="fullscreen-panel-temperature">
                <div className="primary-thermometer">
                    <div className="thermometer-temp" style={style}>{primaryData.tempC}</div>
                    <div className="thermometer-trend">
                      {primaryData.trend}
                    </div>
                </div>
                {/* <div className="secondary-thermometer">{secondaryData.tempC}</div> */}
            </div>
        </>
    );
}

function tempToColor(tempC) {
  tempC = parseFloat(tempC);

  let color = '6666FF';
  if (tempC > 0) {
    color = '9999FF';
  }

  if (tempC > 20) {
    color = '99FF99';
  }

  if (tempC > 25) {
    color = 'FFAAAA';
  }

  if (tempC > 30) {
      color = "FF7777";
  }

  return `#${color}`;
}

export default Temperature;
