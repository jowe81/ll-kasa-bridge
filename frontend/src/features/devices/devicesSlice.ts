import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Device {
  alias: string;
  channel: number;
  host: string;
  id: string;
  type: string;
  subType: string;

  groups: string[];

  isOnline: boolean;
  lastSeenAt: number;
  powerState: boolean;

  state: any;

  targets: {
    on: any[];
    off: any[];
  };
}

export interface Group {
  id: string;
  name: string;
  channels: number[];
  class: string | string[];
  filters: object[];
  linkedDevices: object[];
}

export interface DeviceStateUpdate {
  changeInfo: object;
  data: {
    channel: number;
    powerState: boolean;   
    state: {
      brightness: number;
      color_temp: number;
      hue: number;
      on_off: number;
      saturation: number;
    };
  }
}

export interface DeviceOnlineStateUpdate {
  channel: number;
  data: {
    isOnline: boolean;
  }
};

const initialState: Device[] = [];

const devicesSlice = createSlice({
    name: 'devices',
    initialState,
    reducers: {      
        // Add an array of devices.
        devicesAdded(devices, action: PayloadAction<Device[]>) {
          //action.payload.forEach(device => devices.push(device));
          action.payload.forEach(device => addDevice(devices, device));
        },

        // Add a single device.
        deviceAdded(devices, action: PayloadAction<Device>) {
          addDevice(devices, action.payload);
        },

        // Update device state for a single device
        deviceStateUpdated(devices, action:PayloadAction<DeviceStateUpdate>) {
          const { channel, state } = action.payload.data;

          const deviceKey = getDeviceKeyByChannel(devices, action.payload.data.channel);
        
          if (deviceKey !== null) {
            //console.log(`Device State update on ${channel}: `, action.payload.changeInfo, state, ` was: `, devices[deviceKey].state);            
            devices[deviceKey].state = state;
            devices[deviceKey].powerState = action.payload.data.powerState;
          }
        },

        deviceOnlineStateUpdated(devices, action: PayloadAction<DeviceOnlineStateUpdate>) {
          const deviceKey = getDeviceKeyByChannel(devices, action.payload.channel);

          if (deviceKey !== null) {
            console.log(`Device Online State update on ${action.payload.channel}: `, action.payload.data.isOnline, ` was: `, devices[deviceKey].isOnline); 
            devices[deviceKey].isOnline = action.payload.data.isOnline;
          }
        }
    }
});

const addDevice = (devices: Device[], addedDevice: Device) => {
  const deviceKey = getDeviceKeyByChannel(devices, addedDevice.channel);

  if (deviceKey !== null) {
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

export const { 
  devicesAdded, 
  deviceAdded,
  deviceStateUpdated,
  deviceOnlineStateUpdated,
} = devicesSlice.actions;



export default devicesSlice.reducer;