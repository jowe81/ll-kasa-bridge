import { useState, useEffect } from 'react';
import constants from '../../constants.ts';
import { Device } from './dataSlice.ts';

const Thermostat = (props) => {

  const [isPending, setIsPending] = useState(false);
  const [target, setTarget] = useState(0);
  const device: Device = props.thermostat;
  const handleThermostatClick = props.handleThermostatClick;
  const bgIconClass = `none`;
  const powerState = device.powerState;

  useEffect(() => {
    setTarget(device.state.target);

    if ((typeof target === 'boolean') && (target !== device.state.target)) {
      setIsPending(false);
    }  
  }, [device])  
  
  
  let downButtonClasses = 'thermostat-button button-border boxed thermostat-arrow-down';
  let targetFieldClasses = 'thermostat-button boxed thermostat-target';
  let upButtonClasses = 'thermostat-button button-border boxed thermostat-arrow-up';
  if (!powerState) {
    downButtonClasses += ' thermostat-button-disabled';
    targetFieldClasses += ' thermostat-target-disabled';
    upButtonClasses += ' thermostat-button-disabled';
  }


  let html = <></>;

  html = (
    <>
      <div className='thermostat-buttons'>
        <div className={downButtonClasses} data-device-channel={device.channel} data-action='down' onClick={handleThermostatClick}></div>
        <div className={targetFieldClasses}>{target}°C</div>
        <div className={upButtonClasses} data-device-channel={device.channel} data-action='up' onClick={handleThermostatClick}></div>
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