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
    if (liveState.onlineCount === liveState.totalCount) {       
      return liveState.powerOnCount === liveState.onlineCount ? "power-on" : "power-off";
    }
  
    if (liveState.offlineCount === liveState.totalCount) {
      return "power-off";
    }
  
    if (liveState.notDiscoveredCount) {
      return "power-not-available";
    }

    return "power-mixed";  
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