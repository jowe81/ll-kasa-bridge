import './App.scss';
import { Routes, Route, Navigate } from "react-router-dom"
import Home from './components/Home';
import Devices from './components/Devices';
import { useState, useEffect } from 'react';

import { socket } from './socket';
import { ConnectionState } from './components/ConnectionState';
import { ConnectionManager } from './components/ConnectionManager';
import { Events } from './components/Events';

function App() {

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onAutoDevices(value) {
      console.log('setting', value);
      setDevices(value);
      // setDevices(previous => [...previous, value]);
      console.log("done");
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('auto/devices', onAutoDevices);

    //Retrieve initial
    socket.emit('auto/getDevices');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('auto/devices', onAutoDevices);
    };
    
}, []);

  return (
    <div className="App">
      Welcome
      <ConnectionState isConnected={ isConnected } />
      
      <ConnectionManager />
      <Routes>
        <Route path="/" element={ <Home /> } />
        <Route path="devices" element={ <Devices wsConnected={isConnected} devices={devices}/> } />

        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </div>
  );
}

export default App;
