import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import constants from "../../../constants.js";


export interface BaseDevice {
  alias: string;
  channel: number;
  displayLabel?: string;
  display?: boolean;
  host: string;
  id: string;
  location: string;
  type: string;
  displayType?: string;
  subType: string;
  groups: string[];
  classes: string[];
  isOnline: boolean;
  lastSeenAt: number;

  state: any;

}

export interface KasaDevice extends BaseDevice {
  powerState: boolean;

  targets: {
    on: any[];
    off: any[];
  };
}

export interface EspDevice extends BaseDevice {
  powerState?: boolean;
}

export interface VirtualDevice extends BaseDevice {
  powerState?: boolean;
  settings: {};
}


export type Device = KasaDevice | EspDevice | VirtualDevice;

export interface Group {
  id: string;
  name: string;
  channels: number[];
  class: string | string[];
  displayLabel?: string;
  displayType?: string;
  display?: boolean;  
  filters: object[];
  linkedDevices: object[];
  liveState?: LiveState;
}

export interface LiveState {
  onlineCount: number;
  offlineCount: number;
  discoveredCount: number;
  notDiscoveredCount: number;
  totalCount: number;
  powerOnCount: number;
  powerOffCount: number;
  powerUndefinedCount: number;
}

export interface LiveGroup extends Group {
  liveState: LiveState;
}

export interface DeviceStateUpdate {
  changeInfo: object;
  data: {
    isOnline: boolean;
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

interface Data {
  devices: Device[],
  liveGroupIds: string[],
}

const initialState = { 
  devices: [],
  liveGroupIds: [],
};

const dataSlice = createSlice({
    name: 'data',
    initialState,
    reducers: {      
        // Add an array of devices.
        devicesAdded(data: Data, action: PayloadAction<Device[]>) {
          action.payload.forEach(device => addDevice(data.devices, device));
          updateLiveGroupIds(data);
        },

        // Add a single device.
        deviceAdded(data: Data, action: PayloadAction<Device>) {
          addDevice(data.devices, action.payload);
          updateLiveGroupIds(data);
        },

        // Update device state for a single device
        deviceStateUpdated(data: Data, action:PayloadAction<DeviceStateUpdate>) {
          const { devices } = data;
          const { channel, state } = action.payload.data;

          const deviceKey = getDeviceKeyByChannel(data.devices, channel);
        
          if (deviceKey !== null) {
            switch (devices[deviceKey].type) {
              case constants.SUBTYPE_THERMOMETER:
                break;

              default:
                devices[deviceKey].powerState = action.payload.data.powerState;

            }

            devices[deviceKey].state = state;
            devices[deviceKey].isOnline = action.payload.data.isOnline;
          }
        },

        deviceOnlineStateUpdated(data: Data, action: PayloadAction<DeviceOnlineStateUpdate>) {
          const { devices } = data;
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

const updateLiveGroupIds = (data: Data) => {
  data.liveGroupIds = collectLiveGroupIdsFromDevices(data);
}

/**
 * Return the ids of the groups that are live (represented by the devices array)
 */
const collectLiveGroupIdsFromDevices = (data: Data): string[] => {
  const liveGroupIds: string[] = [];

  data.devices.forEach(device => {
    device.groups?.forEach(groupId => {
      if (!liveGroupIds.includes(groupId)) {
        liveGroupIds.push(groupId);
      }
    });
  });

  return liveGroupIds;
}

export const { 
  devicesAdded, 
  deviceAdded,
  deviceStateUpdated,
  deviceOnlineStateUpdated,
} = dataSlice.actions;



export default dataSlice.reducer;