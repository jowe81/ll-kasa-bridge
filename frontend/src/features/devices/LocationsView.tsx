import { useAppSelector } from '../../app/hooks.ts';
import { socket } from '../websockets/socket.tsx';
import { getDeviceByChannel } from './helpers.ts';
import constants from '../../constants.ts';

import './devices.css';

import { Device, Group } from './dataSlice.ts';
import TouchButtonDevice from './TouchButtonDevice.tsx';
import TouchButtonGroup from './TouchButtonGroup.tsx';
import Thermometer from './Thermometer.tsx';

function LocationsView() {
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
        return !constants.DEVICETYPES_LIGHTING.includes(device.displayType ?? device.subType);
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
        liveGroupData,
      });
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

  const handleClick = (e) => {
    const channel = e.currentTarget.dataset.deviceChannel;
    if (channel) {
      socket.emit('auto/command/macro', {
        targetType: 'channel',
        targetId: parseInt(channel),
        macroName: 'toggleChannel'
      });    
    }
  }

  const handleGroupClick = (e) => {
    const groupId = e.currentTarget.dataset.deviceGroupId;
    console.log(`handling group click ${e.target}`);
    if (groupId) {
      socket.emit('auto/command/macro', {
        targetType: 'group',
        targetId: groupId,
        macroName: 'toggleGroup'
      });
    }
  }

  const locationsData = getLocationsData();
  console.log(`Have locations data for ${locationsData.length} locations`, locationsData);

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
              onClick: handleClick,
            }

            return <TouchButtonDevice key={'device_' + device.channel} {...props}></TouchButtonDevice>;
          });

          const ungroupedOtherDeviceFields = locationInfo.ungroupedOtherDevices.map(device => {
            const props = {
              device,
              onClick: handleClick,
            };

            return <TouchButtonDevice key={'device_' + device.channel} {...props}></TouchButtonDevice>;

          });


          const switchFields = locationInfo.switches.map(device => {
            const props = {
              device,
              onClick: handleClick,
            };
  
            return <TouchButtonDevice key={'device_' + device.channel} {...props}></TouchButtonDevice>;
  
          });

          let thermometerField;
          let locationLabelField;

          if (locationInfo.thermometers?.length) {
            const thermometer = locationInfo.thermometers[0];
            const props = {
              thermometer,
              locationLabel: locationInfo.name,
            }
            thermometerField = <Thermometer key={'device_' + thermometer.channel} {...props}></Thermometer>;
            
          } else {
            locationLabelField = <div className="location-label">{ locationInfo.name }</div>
          }

          return(
              <div key={locationInfo.id} className="location-container">
                { locationLabelField }
                <div className="location-buttons-container">
                  { thermometerField }
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

export default LocationsView;
