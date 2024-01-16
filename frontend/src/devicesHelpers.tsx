import { useAppSelector } from "./app/hooks.ts";
import constants from "./constants.ts";
import { VirtualDevice } from "./features/TouchUiMain/devices/dataSlice.ts";
import { socket } from "./features/websockets/socket.tsx";

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
    const clocks: VirtualDevice[] = getDevicesByType(
        constants.DEVICETYPE_VIRTUAL,
        constants.SUBTYPE_CLOCK
    );  

    if (!clocks.length) {
      return null;
    }

    return clocks[0];
}

function getMasterSwitch() {
    const masterSwitches: VirtualDevice[] = getDevicesByType(
        constants.DEVICETYPE_VIRTUAL,
        constants.SUBTYPE_MASTER_SWITCH
    );  

    if (!masterSwitches.length) {
      return null;
    }

    return masterSwitches[0];
}

function getMasterSwitchDimInfo() {
    let start, end, opacity = `100%`;

    const masterSwitch = getMasterSwitch();

    if (masterSwitch) {
        const { nighttimeDimming } = masterSwitch.settings?.uiMaster;
        const settingsStart = nighttimeDimming?.start;
        const settingsEnd = nighttimeDimming?.end;
        console.log(nighttimeDimming);
        if (Number.isInteger(settingsStart.hours) && Number.isInteger(settingsEnd.hours)) {            
            start = new Date();
            start.setHours(settingsStart.hours);
            start.setMinutes(parseInt(settingsStart.minutes));
            start.setSeconds(0);
            
            end = new Date();        
            end.setHours(settingsEnd.hours);
            end.setMinutes(parseInt(settingsEnd.minutes));
            end.setSeconds(0);

            const now = new Date();
            if (now.getHours() <= end.getHours() && now.getMinutes() < end.getMinutes()) {
                // After midnight make sure the start date remains in the night before.
                start.setDate(start.getDate() - 1);
            } else {
                // Once today's end time has passed, push the end date to tomorrow.
                end.setDate(end.getDate() + 1);
            }

            if (start < now && now < end) {
                opacity = `${nighttimeDimming?.uiOpacityPercent}%`;
            }
        }        
    }
    
    return {
        start,
        end,
        opacity,
    };
}


function runChannelCommand(channel, commandId, body = {}) {
    console.log(`Emitting command '${commandId}' to channel ${channel}:`, Object.keys(body).length ? body : `<no body>`);
    socket.emit(`auto/command/channel`, {
        channel,
        id: commandId,
        body,
    });
}


export {
    getAllDevices,
    getDeviceByChannel,
    getDevicesByType,
    getClock,
    getMasterSwitch,
    getMasterSwitchDimInfo,
    runChannelCommand,
};
