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
        
      default:
        powerStateClass = "power-off";
    }                            
  }
  
  return powerStateClass;
}

export {
  getPowerStateClass
}