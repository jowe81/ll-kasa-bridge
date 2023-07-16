import { useState, useEffect } from 'react'
import './App.css'
import { useAppDispatch, useAppSelector } from './app/hooks';
import { socket } from './socket';
import { ConnectionManager } from './features/websockets/ConnectionManager';
import { ConnectionState } from './features/websockets/ConnectionState';


import { 
  powerStateUpdated, deviceAdded, devicesAdded, 
  Device, PowerStateUpdate 
} from './features/devices/jjAutoSlice';


function App() {
  
  const dispatch = useAppDispatch();

  const [isConnected, setIsConnected] = useState(socket.connected);
  const devices = useAppSelector(state => state.jjAuto);



  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('auto/devices', (devices: Device[]) => {
      dispatch(devicesAdded(devices));
    });

    socket.on('auto/device', (device: Device) => {
      dispatch(powerStateUpdated(device));
    });

    //Retrieve initial
    socket.emit('auto/getDevices');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
    
}, []);


const handleClick = (e) => {
//    dispatch(toggled());

    const channel = e.target.dataset.deviceChannel;

    console.log('Emitting to device', typeof channel);
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
            <ConnectionManager/>
            <ConnectionState isConnected={ isConnected }/>
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
                                <td>{device.powerState ? "on" : "off"}</td>
                                <td>
                                    <button data-device-channel={device.channel} onClick={handleClick}>
                                    { device.powerState === true ? 'Turn off' : 'Turn on' }
                                    </button> 

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

export default App
