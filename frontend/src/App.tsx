import { Routes, Route, Navigate, Link } from "react-router-dom"
import { useState, useEffect } from 'react'
import './App.css'
import { useAppDispatch } from './app/hooks';
import { socket } from './features/websockets/socket';

import Home from "./Home";
import TableView from "./features/devices/tableView";
import TouchView from "./features/devices/touchView";


import {
  // Action methods
  devicesAdded,
  deviceAdded,
  deviceStateUpdated,
  deviceOnlineStateUpdated,
  
  // Types
  Device, 
  Group, 
  DeviceStateUpdate,
  DeviceOnlineStateUpdate,
} from './features/devices/jjAutoSlice';


function App() {
  
  const dispatch = useAppDispatch();

  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Handle socket events
    socket.on('auto/devices', (devices: Device[]) => {
      dispatch(devicesAdded(devices));
    });

    socket.on('auto/device/state', (data: DeviceStateUpdate) => {
      dispatch(deviceStateUpdated(data));
    });

    socket.on('auto/device/onlineState', (data: DeviceOnlineStateUpdate) => {
      dispatch(deviceOnlineStateUpdated(data));
    });

    socket.on('auto/device', (device: Device) => {
      console.log('received auto/device', device);
    });

    socket.on('auto/groups', (groups: Group[]) => {
      console.log('Received groups:', groups);
    })

    //Retrieve initial
    socket.emit('auto/getDevices');
    socket.emit('auto/getGroups');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
    
}, []);

return (
    <div className="App">
      <Routes>
        <Route path="/" element={ <Home /> } />
        <Route path="table" element={ <TableView /> } />
        <Route path="touch" element={ <TouchView /> } />

        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </div>
  )
}

export default App
