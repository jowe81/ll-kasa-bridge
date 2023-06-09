
import { useEffect, useState } from "react";
import './devices.scss';
import axios from 'axios';
import { socket } from "../socket";
const Devices = ({wsConnected, devices}) => {

  const s = wsConnected ? "You are online!" : "Not connected.";

  useEffect(() => {
    // socket.timeout(5000).emit('auto/getDevices', '', () => {
    //   console.log('received', devices);
    //   setDevices(devices);
    // });
    // if (wsConnected) {
    //   console.log('Requesting devices'); 
    //   socket.emit('auto/getDevices', 'Send them to me...');
  
    //   socket.on('auto/devices', (devices) => {
    //     console.log('Received: ', devices);   
    //     setDevices(devices);
    //   })
    // }  
  }, []);


  const toggle = (device) => {
    console.log('toggling ', device.alias);
    socket.emit('auto/command/macro', {
      channel: device.channel,
      name: 'toggle'}
    );
  }

  const boxes = devices.map((device) => {
            
      const classes = `deviceContainer ${device.state?.lightstate?.on_off || device.state?.powerstate ? 'deviceOn' : 'deviceOff'}`;
      const html = <div className={classes} key={device.id} onClick={() => toggle(device)}><label>{ device.alias }</label></div>;

      
      return html
    }
  );

  
  return (
    <div>Devices:
      <div className="devicesContainer">{boxes}</div>
    </div>
  );

}

export default Devices;