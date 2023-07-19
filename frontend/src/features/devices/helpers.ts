import { Device } from './devicesSlice';

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

export {
  getPowerStateClass
}