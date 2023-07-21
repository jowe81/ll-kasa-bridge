import { useAppSelector } from '../../app/hooks.ts';
import { socket } from '../websockets/socket.tsx';
import { getPowerStateClass, getDeviceByChannel, getPowerStateClassForLiveGroup } from './helpers.ts';
import './devices.css';

import { Device, Group } from './dataSlice.ts';

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

  const getGroupName = (groupId) => { 
    const group = groups.find(group => group.id === groupId);
    if (group) {
      return group.displayLabel ?? group.name;
    }
  }

  const getLocationsData = () => {
    
    const locationsData: any[] = [];

    locations.forEach(location => {
      const devicesInLocation = getDevicesInLocation(devices, location.name);

      if (!devicesInLocation.length) {      
        // Skip this location - it has no devices.
        return;
      }

      const ungroupedDevices = devicesInLocation.filter(device => !device.groups.length && (device.subType !== 'switch'));
      
      const groupedDevices = {};
      const configuredGroupIds = getGroupIdsFromDevices(devicesInLocation);      
      const liveGroupIdsForLocation = configuredGroupIds.filter((groupId: string) => liveGroupIds.includes(groupId));
      const liveGroups = groups.filter(group => liveGroupIdsForLocation.includes(group.id));
      const liveGroupData = calculateLiveGroupState(devices, liveGroups);
      liveGroupIdsForLocation.forEach(groupId => {
        groupedDevices[groupId] = devicesInLocation.filter(device => device.groups.includes(groupId));
      });
      

      const switches = devicesInLocation.filter(device => device.subType === 'switch');
      
      locationsData.push({
        id: location.id,
        name: location.name,
        devices: devicesInLocation,
        ungroupedDevices,
        groupedDevices,
        switches,
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

      group.channels.forEach(channel => {        
        const device = getDeviceByChannel(devices, channel);

        if (device) {
          device.isOnline ? onlineCount++ : offlineCount++; 
          device.powerState ? powerOnCount++ : powerOffCount++;         
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
          totalCount,

          powerOnCount,
          powerOffCount,
        }
      };
    });

    return liveGroupData;
  }

  const handleClick = (e) => {
    const channel = e.currentTarget.dataset.deviceChannel;
    console.log(`handling click ${e.target}`);
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
      <div className="groups-container">
        {locationsData.map(locationInfo => {
                
          const groupIds = Object.keys(locationInfo.groupedDevices);
          const groupFields = groupIds.map(groupId => {
            // The contents of each group field            
            const devicesInGroup = locationInfo.groupedDevices[groupId];
            const groupName = getGroupName(groupId);

            /**
             * Only attempt to render the group associated with the groupId if it's in state.config.groups
             * (server won't return groups with display: false).
             * 
             * Ideally this filtering should happen in the data slice
             */
            if (groups.find(group => group.id === groupId)) {
              return (
                <div key={'group_' + groupId} className={ 'powerstate-toggle-button ' + getPowerStateClassForLiveGroup(locationInfo, groupId)} data-device-group-id={groupId} onClick={handleGroupClick}>
                  <div className='device-meta'>
                    {devicesInGroup.length} devices
                    <div className='device-online-state'>
                      {'state'}
                    </div>
                  </div>
  
                  <div className='device-alias'>{groupName}</div>
                </div>
              );  
            }
          });

          const deviceFields = locationInfo.ungroupedDevices.map(device => {
            const powerStateClass = getPowerStateClass(device);

            return (
              <div key={'device_' + device.channel} className={ 'powerstate-toggle-button ' + powerStateClass} data-device-channel={device.channel} onClick={handleClick}>
                <div className='device-meta'>
                  Ch {device.channel}
                  <div className='device-online-state'>
                    {device.isOnline ? 'online' : 'offline'}
                  </div>
                </div>
                <div className='device-alias'>
                  {device.displayLabel ?? device.alias}
                </div>                                                  
              </div> 
            )
          });

          const switchFields = locationInfo.switches.map(device => {
            const powerStateClass = getPowerStateClass(device);

            return (
              <div key={'switch_' + device.channel} className={ 'powerstate-toggle-button ' + powerStateClass} data-device-channel={device.channel} onClick={handleClick}>
                <div className='device-meta'>
                  Ch {device.channel}
                  <div className='device-online-state'>
                    {device.isOnline ? 'online' : 'offline'}
                  </div>
                </div>
                <div className='device-alias'>
                  {device.displayLabel ?? device.alias}
                </div>                                                  
              </div> 
            )
          });

          return(
              <div key={locationInfo.id} className="location-container">
                <div className="location-label">{ locationInfo.name }</div>
                <div>
                  {
                    (groupFields.length > 0) &&
                    <>
                      {/* <div>Groups:</div> */}
                      <div>
                        {groupFields}
                      </div>
                    </>
                  }
                  {
                    (deviceFields.length > 0) &&
                    <>
                      {/* <div>Devices:</div> */}
                      <div>
                        {deviceFields}
                      </div>
                    </>
                  }
                  {
                    (switchFields.length > 0) &&
                    <>
                      {/* <div>Switches:</div> */}
                      <div>
                        {switchFields}
                      </div>
                    </>
                  }                  
                </div>
              </div>
          );

        })}
      </div>
    </>
  )
}

export default LocationsView;