import { useState, useEffect } from 'react';
import constants from '../../constants.ts';
import { Device } from './dataSlice.ts';

const Thermostat = (props) => {

  const [isPending, setIsPending] = useState(false);
  const [target, setTarget] = useState(0);
  const device: Device = props.thermostat;
  const handleThermostatClick = props.handleThermostatClick;
  const bgIconClass = `none`;

  useEffect(() => {
    setTarget(device.state.target);

    if ((typeof target === 'boolean') && (target !== device.state.target)) {
      setIsPending(false);
    }  
  }, [device])  
  
  const targetField =  <div className='thermostat-button boxed'>{target}°C</div>;

  let html = <></>;

  html = (
    <>
      <div className='thermostat-buttons'>
        <div className='thermostat-button button-border boxed' data-device-channel={device.channel} data-action='down' onClick={handleThermostatClick}>Down</div>
       { targetField }
        <div className='thermostat-button button-border boxed' data-device-channel={device.channel} data-action='up' onClick={handleThermostatClick}>Up</div>
      </div>
    </>
  );

  return (
    <div 
      className={`device-button ${bgIconClass} thermostat-triple-width `}
      data-device-channel={device.channel} 
    >
      {html}                            
    </div> 
  )
}

export default Thermostat;