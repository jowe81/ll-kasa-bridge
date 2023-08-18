import { Device } from './dataSlice.ts';

const Thermometer = (props) => {

  const device: Device = props.thermometer;
  console.log('Thermometer', device)
  const bgIconClass = `none`;

  const { trend } = device.state;

  let trendColorClass = 'text-gray';

  if (typeof trend.diff !== 'undefined') {
    if (trend.diff > 0.2) {
      trendColorClass = 'text-red';
    } else if (trend.diff < -0.2) {
      trendColorClass = 'text-blue';
    }
  }
  
  const footerClasses = `device-footer ${trendColorClass}`;
  let html = <></>;

  html = (
    <>
      <div className='device-meta'>
        { device.channel }
        <div className='device-online-state'>
        { device.displayLabel }
        </div>
      </div>
      <div className='device-alias'>
        { device.state.tempC.toFixed(1) + '°C' }
      </div>
      <div className={footerClasses}>
        { device.state.trend.trend } { trend?.diff.toFixed(2)}
      </div>              
    </>
  );

  return (
    <div 
      className={`device-button ${bgIconClass} powerstate-toggle-button powerstate-toggle-button-small`}
      data-device-channel={device.channel} 
    >
      {html}                            
    </div> 
  )
}

export default Thermometer;