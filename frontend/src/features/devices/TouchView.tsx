import { useAppSelector } from '../../app/hooks.ts';
import { socket } from '../websockets/socket.tsx';
import { getPowerStateClass } from './helpers.ts';
import './devices.css';

import { Device } from './devicesSlice.ts';

function TouchView() {
  const devices = useAppSelector(state => state.devices);
  const groups = useAppSelector(state => state.config.groups);
  

  const getDevicesInGroup = (groupId: string): Device[] => {
    const groupMembers = devices.filter(device => device.groups.includes(groupId));
    return groupMembers;
  }

  const handleClick = (e) => {
    const channel = e.target.dataset.deviceChannel;
    console.log(`handling click ${e.target}`);
    if (channel) {
      socket.emit('auto/command/macro', {
        channel: parseInt(channel),
        name: 'toggle'
      });    
    }
  }

  return (
    <>        
      <div className="groups-container">
        {groups.map(group => {
          return (
            <div key={group.id} className="group-container">
              { group.name }
              <div>
                {getDevicesInGroup(group.id).map((device, index) => {
                  const powerStateClass = getPowerStateClass(device);

                  return (
                    <div key={index} className='device-container'>

                      <div className='device-alias'>
                        {device.alias}
                      </div>

                      <div className='device-meta'>
                        Ch {device.channel}
                        <div className='device-online-state'>
                          {device.isOnline ? 'online' : 'offline'}
                        </div>
                      </div>

                      { powerStateClass &&
                        <button className={ 'device-power ' + powerStateClass} data-device-channel={device.channel} onClick={handleClick}>
                          {device.powerState ? 'Turn off' : 'Turn on'}
                        </button> 
                      }                                                                      
                    </div>
                  )
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  )
}

export default TouchView;
