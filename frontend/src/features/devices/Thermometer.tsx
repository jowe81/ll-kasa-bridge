import constants from '../../constants.ts';
import { Device } from './dataSlice.ts';

const Thermometer = (props) => {

  const device: Device = props.thermometer;
  const locationLabel = props.locationLabel;

  const bgIconClass = `none`;

  const trendFields: JSX.Element[] = [];
  const trends = device.state?.trends;

  const tempC = device.state?.tempC;
  const invalidTemp = tempC === -127;

  if (trends) {
    Object.keys(trends).forEach(trendKey => {
      const trend = trends[trendKey];

      if (typeof trend.diff === 'undefined' || invalidTemp ) {
        return;
      }

      let trendColorClass = 'text-gray';
      let trendBgColorClass = 'bg-gray';

      if (typeof trend.diff !== 'undefined') {
        if (trend.diff > 0.2) {
          trendColorClass = 'text-red';
          trendBgColorClass = 'bg-red';
        } else if (trend.diff < -0.2) {
          trendColorClass = 'text-blue';
          trendBgColorClass = 'bg-blue';
        }
      
      }
      const footerClasses = `thermometer-footer boxed ${trendColorClass} ${trendBgColorClass}`;
    
      const windowInMinutes = Math.round(trend.historyLength / constants.MINUTE);

      const field = 
        <div className={footerClasses}>
          { windowInMinutes }m: { trend.diff?.toFixed(2)}°
        </div>;

      trendFields.push(field);
    })
  }


  const currentTempC = (tempC && !invalidTemp) ? device.state.tempC.toFixed(1) + '°C' : 'N/A';

  let html = <></>;

  html = (
    <>
      <div className='device-meta'>
        { device.channel }
        <div className='device-online-state'>
        { device.displayLabel }
        </div>
      </div>
      <div className='location-label-in-thermometer'>
        <div>{ locationLabel }</div>
      </div>
      <div className='thermometer-main-text'>
        { currentTempC }
      </div>
      <div className='thermometer-trends'>
        { ...trendFields }
      </div>
    </>
  );

  return (
    <div 
      className={`device-button ${bgIconClass} thermometer-triple-width `}
      data-device-channel={device.channel} 
    >
      {html}                            
    </div> 
  )
}

export default Thermometer;