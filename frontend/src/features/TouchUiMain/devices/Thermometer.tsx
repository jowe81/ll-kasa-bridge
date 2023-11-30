import constants from '../../../constants.ts';
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

      const referenceThreshould = 2; // 2 degrees change within 5 minutes
      const alertThreshold = trend.historyLength / (5 * constants.MINUTE) * referenceThreshould;
      //console.log (`AlertThresh for ${device.alias}: ${(trend.historyLength / constants.MINUTE).toFixed(0)}m`, alertThreshold.toFixed(10))

      let trendColorClass = 'text-gray';
      let trendBgColorClass = 'bg-gray';

      if (typeof trend.diff !== 'undefined') {
        if (trend.diff >= 0.2) {
          trendColorClass = 'text-red';
          trendBgColorClass = 'bg-red';

          // Fast heating - indicate danger
          if (trend.diff > alertThreshold) {
            trendBgColorClass = 'bg-bright-red';
          }
        } else if (trend.diff <= -0.2) {
          trendColorClass = 'text-blue';
          trendBgColorClass = 'bg-blue';

          if (trend.diff < -alertThreshold) {
            trendBgColorClass = 'bg-bright-blue';
          }
        }
      
      }
      const footerClasses = `thermometer-footer boxed ${trendColorClass} ${trendBgColorClass}`;
    
      const windowInMinutes = Math.ceil(trend.historyLength / constants.MINUTE);
      let valueStr = trend.diff?.toFixed(1) + '°';
      if (trend.diff > 0) {
        valueStr = '+' + valueStr;
      }
      const field = 
        <div className={footerClasses}>
          { windowInMinutes }m: { Math.abs(trend.diff) > 0.09 ? valueStr : 'steady'}
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