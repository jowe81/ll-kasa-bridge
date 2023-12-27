import { useAppSelector } from "./app/hooks.ts";

import constants from "./constants.ts";

import { VirtualDevice } from "./features/TouchUiMain/devices/dataSlice.ts";

function getAllDevices() {
    const devices: VirtualDevice[] = useAppSelector(
        (state) => state.data.devices
    );

    return devices;
}

function getDeviceByChannel(channel) {
    const devices = getAllDevices();

    if (!devices) {
      return null;
    }

    const device = devices.find(
        (device) => device.channel === channel
    );

    return device;
}

function getDevicesByType(type: string|null, subType:string|null) {
    const devices = getAllDevices();

    if (!devices) {
        return null;
    }

    const foundDevices = devices.filter((device, index) => {
      if (type && !(device.type === type)) {
          return false;
      }

      if (subType && !(device.subType === subType)) {
          return false;
      }

      return true;
    })

    return foundDevices;
}

function getClock() {
    return getDeviceByChannel(500);
    const clocks: VirtualDevice[] = getDevicesByType(
        constants.DEVICETYPE_VIRTUAL,
        constants.SUBTYPE_CLOCK
    );  

    if (!clocks.length) {
      return null;
    }

    return clocks[0];
}

export { 
  getAllDevices,
  getDeviceByChannel,
  getDevicesByType,
  getClock,
};
