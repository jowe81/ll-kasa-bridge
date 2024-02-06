import { Routes, Route, Navigate, Link } from "react-router-dom"
import { useState, useEffect } from 'react'
import './App.css'
import { useAppDispatch } from './app/hooks';
import { socket } from './features/websockets/socket';
import constants from "./constants";
import { ScreenKeyboardProvider } from "./contexts/ScreenKeyboardContext";

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
      if (!(data?.data?.channel === constants.clock.serviceChannel)) {
        // Ignore the clock updates which come every second.        
        console.log(`Socket: auto/device/state (${data?.data?.channel})`, data?.data?.state);
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
    <ScreenKeyboardProvider>
        <div className="App">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="touch" element={<TouchUi />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    </ScreenKeyboardProvider>
);
}

export default App
