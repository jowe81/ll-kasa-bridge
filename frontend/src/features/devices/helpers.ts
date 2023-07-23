import { Device, Group } from './dataSlice';
import { LiveGroup } from './dataSlice';

const getPowerStateClass = (device: Device): string => {
  const powerStatePresent = device.isOnline && typeof device.powerState === 'boolean';
  let powerStateClass: string = '';
  
  if (powerStatePresent) {
    switch (device.powerState) {
      case true:
        powerStateClass = "power-on";
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

const getPowerStateClassForLiveGroup = (locationInfo, groupId: string): string => {
  const liveState = locationInfo.liveGroupData[groupId].liveState;

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
}

export {
  getPowerStateClass,
  getPowerStateClassForLiveGroup,
  getDeviceByChannel,
}