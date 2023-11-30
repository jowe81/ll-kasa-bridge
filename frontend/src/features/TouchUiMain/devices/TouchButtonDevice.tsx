import { useState, useEffect } from 'react';
import { Device } from './dataSlice.ts';
import constants from '../../../constants.ts';

const TouchButtonDevice = ({device, onClick}) => {

  const [isPending, setIsPending] = useState(false);
  const [powerState, setPowerState] = useState(null);

  const powerStateClass = getPowerStateClass(device);
  const bgIconClass = getBgIconClass(device)

  const handleClick = (e) => {
    setIsPending(true);    
    onClick(e);
  }

  useEffect(() => {
    setPowerState(device.powerState);

    if ((typeof powerState === 'boolean') && (powerState !== device.powerState)) {
      setIsPending(false);
    }  
  }, [device])

  //console.log(`Rendering device ${device.alias}`, device.powerState);

  let html = <></>;

  if (isPending) {
    html = <div className='device-meta'>Pending...</div>;
  } else {
    html = (
      <>
        <div className='device-meta'>
          { device.subType !== constants.SUBTYPE_THERMOSTAT ? device.channel : ''}
          <div className='device-online-state'>
          { device.displayLabel ?? device.alias }
          </div>
        </div>
        <div className='device-alias'>
        </div>                                                  
      </>
    );
  }

  return (
    <div 
      className={`device-button ${bgIconClass} powerstate-toggle-button powerstate-toggle-button-small ${!isPending && powerStateClass }`}
      data-device-channel={device.channel} 
      onClick={handleClick}
    >
      {html}                            
    </div> 
  )
}

const getBgIconClass = (device: Device) => {
  let bgIconClass = '';

  switch (device.subType) {
    case constants.SUBTYPE_MAIL_COMPARTMENT:
      bgIconClass = `icon-${device.displayType ?? device.subType ?? 'none'}`;
      if (device.powerState === true) {
        bgIconClass += '-locked';
      } else if (device.powerState === false) {
        bgIconClass += '-unlocked';
      }
      break;

    default:
      bgIconClass = `icon-${device.displayType ?? device.subType ?? 'none'}`;
      break;
  }

  return bgIconClass;
}

const getPowerStateClass = (device: Device): string => {
  const powerStatePresent = device.isOnline && typeof device.powerState === 'boolean';
  let powerStateClass: string = '';
  
  if (powerStatePresent) {
    const displayType = device.displayType ?? device.subType;

    switch (device.powerState) {
      case true:
        powerStateClass = "power-on" + (displayType ? `-${displayType}` : ``);
        break;
  
      case false:
        powerStateClass = "power-off";
        break;
             
      default:
        powerStateClass = "power-not-available";
        break;
    }                            
  } else {
    powerStateClass = "power-not-available";
  }
  
  return powerStateClass;
}

export default TouchButtonDevice;