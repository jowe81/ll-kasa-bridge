import { useState, useEffect } from 'react'
import './App.css'
import { useAppDispatch, useAppSelector } from './app/hooks';
import { useFetchDevicesQuery } from './features/devices/jjautoApiSlice';
import { toggled } from './features/localState/localStateSlice';
import { socket } from './socket';
import { ConnectionManager } from './features/websockets/ConnectionManager';

import axios from 'axios';
import { ConnectionState } from './features/websockets/ConnectionState';

function App() {
  
  const dispatch = useAppDispatch();

  const [isConnected, setIsConnected] = useState(socket.connected);
  const localState = useAppSelector(state => state.localState)

  const { data = [], isFetching } = useFetchDevicesQuery();


  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

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
                <p>Number of devices fetched: {data.length} </p>

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
                        {data.map(device => (
                            <tr key={device.id}>
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
