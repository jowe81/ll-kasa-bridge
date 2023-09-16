import constants from '../../constants.ts';

import { Device, Group } from './dataSlice';
import { LiveGroup } from './dataSlice';

const getPowerStateClass = (device: Device): string => {
  const powerStatePresent = device.isOnline && typeof device.powerState === 'boolean';
  let powerStateClass: string = '';
  
  if (powerStatePresent) {
    const displayType = device.displayType ?? device.subType;

    switch (device.powerState) {
      case true:
        powerStateClass = "power-on" + (displayType ? `-${displayType}` : ``);
        break;
  
      case false:
        powerStateClass = "power-off";
        break;
                
    }                            
  } else {
    powerStateClass = "power-not-available";
  }
  
  return powerStateClass;
}

const getPowerStateClassForLiveGroup = (liveState): string => {

  if (liveState) {
    if (liveState.discoveredCount > 0) {
      // Have data for one or more devices

      if (liveState.powerOnCount === liveState.discoveredCount) {
        // All powered on
        return 'power-on';
      }
  
      if (liveState.powerOnCount === 0) {
        // All powered off
        return 'power-off';
      }
  
      // Some powered on, some powered off
      return 'power-mixed';        

    } else {
      // None of the devices were discovered

      return 'power-not-available';
    }
  }

  return "power-not-available";  
}

const getDevicesInGroup = (devices: Device[], group: (LiveGroup | Group)) => {
  const foundDevices: Device[] = [];
  group.channels.forEach(channel => {
    const device = getDeviceByChannel(devices, channel);
    if (device) {
      devices.push(device);
    }
  })

  return foundDevices;
}

const getDeviceByChannel = (devices: Device[], channel: number) => {
  return devices.find(device => device.channel === channel);
};

const pad = (s, length, char = '0') => {
  if (length && s.length < length) {
    
    const missingLength = length - s.length;
    s = char.repeat(missingLength) + s;
  }

  return s;
}

const formatTimerTime = (ms) => {

  const negative = ms < 0;

  if (negative) {
    ms = -ms;
  }

  const hrs = Math.floor(ms / constants.HOUR).toString();
  const mins = (Math.floor(ms / constants.MINUTE) % 60).toString();
  const secs = (Math.floor(ms / constants.SECOND) % 60).toString();

  const absTime = pad(hrs, 2) + ':' + pad(mins, 2) + ':' + pad(secs, 2);
  return negative ?  '-' + absTime : absTime;
}

const getHumanReadableLength = length => {
  if (length < constants.MINUTE * 2) {
    return Math.round(length / constants.SECOND) + 's';
  }

  return Math.round(length / constants.MINUTE) + 'm';
}

export {
  getPowerStateClass,
  getPowerStateClassForLiveGroup,
  getDeviceByChannel,
  getHumanReadableLength,
  formatTimerTime,
  pad,
}