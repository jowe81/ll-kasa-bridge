import { Routes, Route, Navigate, Link } from "react-router-dom"
import { useState, useEffect } from 'react'
import './App.css'
import { useAppDispatch } from './app/hooks';
import { socket } from './features/websockets/socket';

import Home from "./Home";
import TableView from "./features/devices/TableView";
import LocationsView from "./features/devices/LocationsView";
import GroupsView from "./features/devices/GroupsView";


import {
  // Action methods
  devicesAdded,
  deviceStateUpdated,
  deviceOnlineStateUpdated,
  
  // Types
  Device, 
  DeviceStateUpdate,
  DeviceOnlineStateUpdate,
} from './features/devices/dataSlice';

import {
  // Action methods
  groupsAdded,
  locationsAdded,
  
  // Types
  Group,
  Location,
} from './features/devices/configSlice';

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
      console.log('state update', data);
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
        <Route path="table" element={ <TableView /> } />
        <Route path="locations" element={ <LocationsView /> } />
        <Route path="groups" element={ <GroupsView /> } />

        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </div>
  )
}

export default App
