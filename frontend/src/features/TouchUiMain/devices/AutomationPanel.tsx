import { useAppSelector } from '../../../app/hooks.ts';
import { socket, toggleChannel, toggleGroup } from '../../websockets/socket.tsx';
import { getDeviceByChannel } from './helpers.ts';
import constants from '../../../constants.ts';

import './devices.css';

import { Device, Group } from './dataSlice.ts';
import TouchButtonDevice from './TouchButtonDevice.tsx';
import TouchButtonGroup from './TouchButtonGroup.tsx';
import Thermometer from './Thermometer.tsx';
import Thermostat from './Thermostat.tsx';

function AutomationPanel() {
  const devices = useAppSelector(state => state.data.devices);
  const liveGroupIds = useAppSelector<string[]>(state => state.data.liveGroupIds);

  const groups = useAppSelector(state => state.config.groups);
  const locations = useAppSelector(state => state.config.locations);
  
  const getDevicesInLocation = (devices: Device[], location: string): Device[] => {    
    const locationMembers = devices.filter(device => device.display && device.location === location);        
    return locationMembers;
  }

  const getGroupIdsFromDevices = (devices: Device[]): string[] => {
    const groupIds: string[] = [];

    devices.forEach(device => {
      device.groups.forEach(groupId => {
        if (!groupIds.includes(groupId)) {
          groupIds.push(groupId);
        }
      })
    });

    return groupIds;
  }

  const getLocationsData = () => {
    
    const locationsData: any[] = [];

    locations.forEach(location => {
      const devicesInLocation = getDevicesInLocation(devices, location.name);

      if (!devicesInLocation.length) {      
        // Skip this location - it has no devices.
        return;
      }

      const ungroupedDevices = devicesInLocation.filter(device => !device.groups.length && (!['switch', 'thermometer'].includes(device.subType)));

      const ungroupedOtherDevices = ungroupedDevices.filter((device: Device)  => {
        return ![ 
          ...constants.DEVICETYPES_LIGHTING,
          ...constants.DEVICETYPES_CUSTOM_DISPLAY,
        ].includes(device.displayType ?? device.subType);
      });

      const ungroupedLights = ungroupedDevices.filter((device: Device)  => {
        return constants.DEVICETYPES_LIGHTING.includes(device.displayType ?? device.subType)
      });
      
      const groupedDevices = {};
      const configuredGroupIds = getGroupIdsFromDevices(devicesInLocation);      
      const liveGroupIdsForLocation = configuredGroupIds.filter((groupId: string) => liveGroupIds.includes(groupId));
      const liveGroups = groups.filter(group => liveGroupIdsForLocation.includes(group.id));
      const liveGroupData = calculateLiveGroupState(devices, liveGroups);
      liveGroupIdsForLocation.forEach(groupId => {
        groupedDevices[groupId] = devicesInLocation.filter(device => device.groups.includes(groupId));
      });
      

      const switches = devicesInLocation.filter(device => device.subType === 'switch');

      const thermometers =  devicesInLocation.filter(device => device.subType === 'thermometer');

      let thermostat;
      const thermostats = devicesInLocation.filter(device => device.subType === 'thermostat');
      if (thermostats.length) {
        thermostat = thermostats[0];
      }

      // Only include configured locations.
      if (location.id !== 'loc-default') {
        locationsData.push({
            id: location.id,
            name: location.name,
            devices: devicesInLocation,
            ungroupedDevices,
            ungroupedLights,
            ungroupedOtherDevices,
            groupedDevices,
            switches,
            thermometers,
            thermostat,
            liveGroupData,
        });
      }
    });

    return locationsData;
  }

  const calculateLiveGroupState = (devices: Device[], liveGroups: Group[]) => {
    const liveGroupData: any = {};
    liveGroups.forEach((group, index) => {
      let onlineCount = 0;
      let offlineCount = 0;
      let notDiscoveredCount = 0;      
      let totalCount = group.channels.length;

      let powerOnCount = 0;
      let powerOffCount = 0;
      let powerUndefinedCount = 0;

      group.channels.forEach(channel => {        
        const device = getDeviceByChannel(devices, channel);

        if (device && constants.DEVICETYPES_WITH_POWERSTATE.includes(device.type)) {
          if (device.lastSeenAt) {
            device.isOnline ? onlineCount++ : offlineCount++;
            if (typeof device.powerState === 'boolean') {
              device.powerState ? powerOnCount++ : powerOffCount++;             
            } else {
              powerUndefinedCount++;
            }            
          } else {
            notDiscoveredCount++;
          }
        } else {
          notDiscoveredCount++;
        }
      })

      liveGroupData[group.id] = {
        ...group,
        liveState: {
          onlineCount,
          offlineCount,
          notDiscoveredCount,
          discoveredCount: totalCount - notDiscoveredCount,
          totalCount,

          powerOnCount,
          powerOffCount,
          powerUndefinedCount,
        }
      };
    });

    return liveGroupData;
  }

  const handleChannelClick = (e) => toggleChannel(e.currentTarget.dataset.deviceChannel);
  const handleGroupClick = (e) => toggleGroup(e.currentTarget.dataset.deviceGroupId);
  
  const handleThermostatClick = (e) => {
    const channel = e.currentTarget.dataset.deviceChannel;
    const { action } = e.currentTarget.dataset;
    console.log('action', action);
    let macroName;
    switch (action) {
      case 'down':
        macroName = 'thermostatDown';
        break;
      
      case 'up':
        macroName = 'thermostatUp';
        break;
    }

    if (channel) {
      socket.emit('auto/command/macro', {
        targetType: 'channel',
        targetId: parseInt(channel),
        macroName,
      });    
    }
  }


  const locationsData = getLocationsData();

  return (
    <>        
      <div className="locations-container">
        {locationsData.map(locationInfo => {
                
          const groupIds = Object.keys(locationInfo.groupedDevices);
          const groupFields = groupIds.map(groupId => {

            /**
             * Only attempt to render the group associated with the groupId if it's in state.config.groups
             * (server won't return groups with display: false).
             * 
             * Ideally this filtering should happen in the data slice
             */
            if (groups.find(group => group.id === groupId)) {
              const props = {
                group: locationInfo.liveGroupData[groupId],
                onClick: handleGroupClick,
              }
              return <TouchButtonGroup key={'group_' + groupId} {...props}></TouchButtonGroup>;
            }
          });

          const ungroupedLightsFields = locationInfo.ungroupedLights.map(device => {
            const props = {
              device,
              onClick: handleChannelClick,
            }

            return <TouchButtonDevice key={'device_' + device.channel} {...props}></TouchButtonDevice>;
          });

          const ungroupedOtherDeviceFields = locationInfo.ungroupedOtherDevices.map(device => {
            const props = {
              device,
              onClick: handleChannelClick,
            };

            return <TouchButtonDevice key={'device_' + device.channel} {...props}></TouchButtonDevice>;

          });

          const switchFields = locationInfo.switches.map(device => {
            const props = {
              device,
              onClick: handleChannelClick,
            };
  
            return <TouchButtonDevice key={'device_' + device.channel} {...props}></TouchButtonDevice>;
  
          });

          let thermometerField;
          let locationLabelField;
          let thermostatField;

          if (locationInfo.thermometers?.length) {
            const thermometer = locationInfo.thermometers[0];
            const thermometerProps = {
              thermometer,
              locationLabel: locationInfo.name,
            }
            thermometerField = <Thermometer key={'device_' + thermometer.channel} {...thermometerProps}></Thermometer>;
            
            if (locationInfo.thermostat) {
              const thermostatProps = {
                thermostat: locationInfo.thermostat,
                handleThermostatClick,
              }
              thermostatField = <Thermostat key={'device_' + locationInfo.thermostat.channel} {...thermostatProps}></Thermostat>
            }
          } else {
            locationLabelField = <div className="location-label">{ locationInfo.name }</div>
          }
        
          return(
              <div key={locationInfo.id} className="location-container">
                { locationLabelField }
                <div className="location-buttons-container">
                  { thermometerField }
                  { thermostatField }
                  { (groupFields.length > 0) && groupFields }
                  { (switchFields.length > 0) && switchFields }
                  { (ungroupedLightsFields.length > 0) && ungroupedLightsFields }
                  { (ungroupedOtherDeviceFields.length > 0) && ungroupedOtherDeviceFields }
                </div>
              </div>
          );

        })}
      </div>
    </>
  )
}

export default AutomationPanel;
