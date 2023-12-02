import { Routes, Route, Navigate, Link } from "react-router-dom"
import { useState, useEffect } from 'react'
import './App.css'
import { useAppDispatch } from './app/hooks';
import { socket } from './features/websockets/socket';

import Home from "./Home";
import TouchUi from "./TouchUi";

import {
  // Action methods
  devicesAdded,
  deviceStateUpdated,
  deviceOnlineStateUpdated,
  
  // Types
  Device, 
  DeviceStateUpdate,
  DeviceOnlineStateUpdate,
} from './features/TouchUiMain/devices/dataSlice';

import {
  // Action methods
  groupsAdded,
  locationsAdded,
  
  // Types
  Group,
  Location,
} from './features/TouchUiMain/devices/configSlice';

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
      console.log(`Socket: auto/devices, got ${devices.length} devices.`);
      dispatch(devicesAdded(devices));
    });

    socket.on('auto/device/state', (data: DeviceStateUpdate) => {
      console.log(`Socket: auto/device/state (${data?.data?.channel})`, data?.data?.state);
      if (data?.data?.channel === 502) {
        console.log('RECEIVED UPDATE 502:', data);
      }
      dispatch(deviceStateUpdated(data));
    });

    socket.on('auto/device/onlineState', (data: DeviceOnlineStateUpdate) => {
      dispatch(deviceOnlineStateUpdated(data));
    });

    socket.on('auto/device', (device: Device) => {
      console.log('received auto/device', device);
    });

    socket.on('auto/groups', (groups: Group[]) => {
      dispatch(groupsAdded(groups));
    })

    socket.on('auto/locations', (locations: Group[]) => {
      dispatch(locationsAdded(locations));
    })

    //Retrieve initial
    socket.emit('auto/getDevices');
    socket.emit('auto/getGroups');
    socket.emit('auto/getLocations');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
    
}, []);

return (
    <div className="App">
      <Routes>
        <Route path="/" element={ <Home /> } />
        <Route path="touch" element = { <TouchUi />} />
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </div>
  )
}

export default App
