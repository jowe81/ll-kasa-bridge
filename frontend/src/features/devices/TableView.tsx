import { useAppSelector } from '../../app/hooks.ts';
import { socket } from '../websockets/socket.tsx';

import './devices.css';

function TableView() {
  const devices = useAppSelector(state => state.devices);

  const handleClick = (e) => {
    const channel = e.target.dataset.deviceChannel;

    if (channel) {
      socket.emit('auto/command/macro', {
        channel: parseInt(channel),
        name: 'toggle'
      });    
    }
  }

  

  return (
    <>        
        <div className="card">
            <div>          
                <p>Number of devices fetched: {devices.length} </p>

                <table>
                    <thead>
                        <tr>
                            <th>Channel</th>
                            <th>Alias</th>
                            <th>isOnline</th>
                            <th>powerState</th>
                            <th>Toggle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {devices.map((device, index) => {
                          const powerStatePresent = device.isOnline && typeof device.powerState === 'boolean';
                          let powerStateClass: string = '';
                          
                          if (powerStatePresent) {
                            switch (device.powerState) {
                              case true:
                                powerStateClass = "power-on";
                                break;

                              case false:
                                powerStateClass = "power-off";                                
                                break;
                                
                              default:
                                powerStateClass = "power-off";
                            }
                            
                          }
                          
                          return (
                            <tr key={index}>                              
                                <td>{device.channel}</td>
                                <td>{device.alias}</td>
                                <td>{device.isOnline ? 'yes' : 'no'}</td>
                                <td className={powerStateClass}>
                                  {powerStatePresent && (device.powerState ? "on" : "off")}
                                </td>
                                <td>                                    
                                    { powerStatePresent &&
                                      <button data-device-channel={device.channel} onClick={handleClick}>
                                        {device.powerState ? 'Turn off' : 'Turn on'}
                                      </button> 
                                    }                                                                      
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        </div>
    </>
  )
}

export default TableView;
