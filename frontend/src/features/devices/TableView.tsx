import { useAppSelector } from '../../app/hooks.ts';
import { socket } from '../websockets/socket.tsx';


function TableView() {
  const devices = useAppSelector(state => state.jjAuto);

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
                        {devices.map((device, index) => (
                            <tr key={index}>
                                <td>{device.channel}</td>
                                <td>{device.alias}</td>
                                <td>{device.isOnline ? 'yes' : 'no'}</td>
                                <td>
                                  {device.isOnline && (device.state?.on_off ? "on" : "off")}                                  
                                </td>
                                <td>                                    
                                    { (typeof device.powerState === 'boolean') && (device.isOnline) &&
                                      <button data-device-channel={device.channel} onClick={handleClick}>
                                        {device.powerState ? 'Turn off' : 'Turn on'}
                                      </button> 
                                    }                                                                      
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </>
  )
}

export default TableView;
