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

function getFirstDeviceOfType(type: string, subType: string | null) {
    const devices: VirtualDevice[] = getDevicesByType(type, subType);

    if (!devices.length) {
        return null;
    }

    return devices[0];
}

const getClock = () => getFirstDeviceOfType(constants.DEVICETYPE_VIRTUAL, constants.SUBTYPE_CLOCK);

const getNotesService = () => getDeviceByChannel(constants.notes?.serviceChannel);

const getPhotosService = () => getDeviceByChannel(constants.photos?.serviceChannel);

const getChoresService = () => getDeviceByChannel(constants.chores?.serviceChannel);

const getBirthdaysService = () => getDeviceByChannel(constants.birthdays?.serviceChannel);

const getMedicalService = () => getDeviceByChannel(constants.medical?.serviceChannel);

const getMasterSwitch = () => getFirstDeviceOfType(constants.DEVICETYPE_VIRTUAL, constants.SUBTYPE_MASTER_SWITCH);

const getThermostats = () => getDevicesByType(constants.DEVICETYPE_VIRTUAL, constants.SUBTYPE_THERMOSTAT);

const getCalendar = (): VirtualDevice|null => getFirstDeviceOfType(constants.DEVICETYPE_VIRTUAL, constants.SUBTYPE_DAV_SERVICE);

function getMasterSwitchDimInfo() {
    let start, end, opacity = `100%`;

    const masterSwitch = getMasterSwitch();

    if (masterSwitch) {
        const { nighttimeDimming } = masterSwitch.settings?.uiMaster;
        const dimOnButtonState = masterSwitch.state.buttons[nighttimeDimming.dimOnButton];

        const settingsStart = nighttimeDimming?.start;
        const settingsEnd = nighttimeDimming?.end;        
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

            if (now.getHours() <= end.getHours() || (now.getHours() === end.getHours() && now.getMinutes() < end.getMinutes())) {
                // After midnight make sure the start date remains in the night before.
                start.setDate(start.getDate() - 1);
            } else {
                // Once today's end time has passed, push the end date to tomorrow.
                end.setDate(end.getDate() + 1);
            }

            if (true || start < now && now < end) {
                if (nighttimeDimming.forceDim || dimOnButtonState) {
                    opacity = `${nighttimeDimming?.uiOpacityPercent}%`;
                }                
            }
        }        
    }
    
    const result = {
        start,
        end,
        opacity,
    };

    return result;
}


function runChannelCommand(channel, commandId, body = {}) {
    if (!channel) {
        console.warn('Cannot emit command: channel is missing.');
        return null;
    }
    console.log(`Emitting command '${commandId}' to channel ${channel}:`, Object.keys(body).length ? body : `<no body>`);
    socket.emit(`auto/command/channel`, {
        channel,
        id: commandId,
        body,
    });
}

function runServiceCommand(service, commandId, body) {
    runChannelCommand(service?.channel, commandId, body);
}

function getAlerts() {
    let services: any[] = [];

    services.push(getMedicalService());
    services.push(getChoresService());

    const thermostats = getThermostats();
    if (Array.isArray(thermostats) && thermostats.length) {
        services.push(...thermostats);
    }
    
    // Remove null/undefined
    services = services.filter((item) => item);

    const alerts = [];
    services.forEach((service) => Array.isArray(service.state.alerts) && alerts.push(...service.state.alerts));

    return alerts;
}


export {
    getAllDevices,
    getBirthdaysService,
    getDeviceByChannel,
    getDevicesByType,
    getCalendar,
    getClock,
    getMasterSwitch,
    getMasterSwitchDimInfo,
    getMedicalService,
    getNotesService,
    getChoresService,
    getPhotosService,
    getAlerts,
    getThermostats,
    runChannelCommand,
    runServiceCommand,
};
