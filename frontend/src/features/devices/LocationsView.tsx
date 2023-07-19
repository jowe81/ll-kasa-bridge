import { useAppSelector } from '../../app/hooks.ts';
import { socket } from '../websockets/socket.tsx';
import { getPowerStateClass } from './helpers.ts';
import './devices.css';

import { Device } from './devicesSlice.ts';

function LocationsView() {
  const devices = useAppSelector(state => state.devices);
  const groups = useAppSelector(state => state.config.groups);
  const locations = useAppSelector(state => state.config.locations);
  

  const getDevicesInGroup = (groupId: string): Device[] => {
    const groupMembers = devices.filter(device => device.groups.includes(groupId));
    return groupMembers;
  }

  const getDevicesInLocation = (devices: Device[], location: string): Device[] => {
    const locationMembers = devices.filter(device => device.location === location);
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
      return group.name;
    }
  }

  const getLocationsData = () => {
    return locations.map(location => {
      const devicesInLocation = getDevicesInLocation(devices, location.name);
      const ungroupedDevices = devicesInLocation.filter(device => !device.groups.length && (device.subType !== 'switch'));
      
      const groupedDevices = {};
      const groupIds = getGroupIdsFromDevices(devicesInLocation);
      groupIds.forEach(groupId => {
        groupedDevices[groupId] = devicesInLocation.filter(device => device.groups.includes(groupId));
      });

      const switches = devicesInLocation.filter(device => device.subType === 'switch');
      
      return {
        id: location.id,
        name: location.name,
        devices: devicesInLocation,
        ungroupedDevices,
        groupedDevices,
        switches,
        groupIds,
      }
    });
  }

  const handleClick = (e) => {
    const channel = e.currentTarget.dataset.deviceChannel;
    console.log(`handling click ${e.target}`);
    if (channel) {
      socket.emit('auto/command/macro', {
        channel: parseInt(channel),
        name: 'toggle'
      });    
    }
  }

  const locationsData = getLocationsData();

  return (
    <>        
      <div className="groups-container">
        {locationsData.map(locationInfo => {
                
          const groupIds = Object.keys(locationInfo.groupedDevices);
          
          const groupFields = groupIds.map(groupId => {
            // The contents of each group field            
            const devicesInGroup = locationInfo.groupedDevices[groupId];
            const groupName = getGroupName(groupId);
            console.log('Group Name:', groupName)
            return (
              <div key={'group_' + groupId} className='device-power'>
                <div className='device-meta'>
                  {devicesInGroup.length} devices
                  <div className='device-online-state'>
                    {'group state'}
                  </div>
                </div>

                <div className='device-alias'>{groupName}</div>
              </div>
            );
          });

          const deviceFields = locationInfo.ungroupedDevices.map(device => {
            const powerStateClass = getPowerStateClass(device);

            return (
              <div key={'device_' + device.channel} className={ 'device-power ' + powerStateClass} data-device-channel={device.channel} onClick={handleClick}>
                <div className='device-meta'>
                  Ch {device.channel} | Groups {device.groups.length}
                  <div className='device-online-state'>
                    {device.isOnline ? 'online' : 'offline'}
                  </div>
                </div>
                <div className='device-alias'>
                  {device.alias}
                </div>                                                  
              </div> 
            )
          });

          const switchFields = locationInfo.switches.map(device => {
            const powerStateClass = getPowerStateClass(device);

            return (
              <div key={'switch_' + device.channel} className={ 'device-power ' + powerStateClass} data-device-channel={device.channel} onClick={handleClick}>
                <div className='device-meta'>
                  Ch {device.channel} | Groups {device.groups.length}
                  <div className='device-online-state'>
                    {device.isOnline ? 'online' : 'offline'}
                  </div>
                </div>
                <div className='device-alias'>
                  {device.alias}
                </div>                                                  
              </div> 
            )
          });

          return(
              <div key={locationInfo.id} className="location-container">
                Location: { locationInfo.name }
                <div>
                  {
                    (groupFields.length > 0) &&
                    <>
                      <div>Groups:</div>
                      <div>
                        {groupFields}
                      </div>
                    </>
                  }
                  {
                    (deviceFields.length > 0) &&
                    <>
                      <div>Devices:</div>
                      <div>
                        {deviceFields}
                      </div>
                    </>
                  }
                  {
                    (switchFields.length > 0) &&
                      <>
                        <div>Switches:</div> 
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
