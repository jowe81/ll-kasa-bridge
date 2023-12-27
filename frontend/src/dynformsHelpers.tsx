import { useAppSelector } from "./app/hooks.ts";

import constants from "./constants.ts";

import { VirtualDevice } from "./features/TouchUiMain/devices/dataSlice.ts";

import { getDeviceByChannel } from './devicesHelpers.tsx';

function getDynformsServiceRecords(channel) {
    const dynformsService: VirtualDevice = getDeviceByChannel(channel);

    if (!dynformsService) {
      return [];
    }    

    const records = dynformsService?.state?.api?.data?.records ?? [];
    return records;
}

export {
  getDynformsServiceRecords,
}