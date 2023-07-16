import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Device  {

  alias: string;
  channel: number;
  host: string;
  id: string;
  type: string;
  subType: string;

  isOnline: boolean;
  lastSeenAt: number;
  powerState: boolean;

  state: any;

  targets: {
    on: any[];
    off: any[];
  };
p
}

export interface PowerStateUpdate {
  channel: number;
  powerState: boolean;
}

const initialState: Device[] = [];

const jjAutoSlice = createSlice({
    name: 'jjAuto',
    initialState,
    reducers: {
      
        // Add an array of devices.
        devicesAdded(devices, action: PayloadAction<Device[]>) {
          //action.payload.forEach(device => devices.push(device));
          action.payload.forEach(device => addDevice(devices, device));
        },

        // Add a single device.
        deviceAdded(devices, action: PayloadAction<Device>) {
          //devices.push(action.payload);
          addDevice(devices, action.payload);
        },

        // Update powerState for a single device
        powerStateUpdated(devices, action:PayloadAction<PowerStateUpdate>) {
          const deviceKey = getDeviceKeyByChannel(devices, action.payload.channel);
          

          if (deviceKey) {            
            console.log(`PS-update on ${action.payload.channel}: `, action.payload.powerState, ` (was: `, devices[deviceKey].powerState);
            devices[deviceKey].powerState = action.payload.powerState;
          }                        
        },
    }
})

const addDevice = (devices: Device[], addedDevice: Device) => {
  const deviceKey = getDeviceKeyByChannel(devices, addedDevice.channel);

  if (deviceKey) {
    // Device exists, overwrite.
    devices[deviceKey] = addedDevice;
  } else {
    // Device is not in the list; add it.
    devices.push(addedDevice);
  }
}

const getDeviceKeyByChannel = ((devices: Device[], channel: number): number | null => {
  let deviceKey: number | null = null;

  Object.keys(devices).every((device, key) => {
    if (devices[key].channel !== channel) {
      return true;
    }

    deviceKey = key;
    return false;
  })

  return deviceKey;
})

const getDeviceByChannel = ((devices: Device[], channel: number):Device | null => {
  let deviceKey: number | null = getDeviceKeyByChannel(devices, channel);

  return deviceKey ? devices[deviceKey] : null;
})

export const { 
  devicesAdded, 
  deviceAdded, 
  powerStateUpdated
} = jjAutoSlice.actions;



export default jjAutoSlice.reducer;