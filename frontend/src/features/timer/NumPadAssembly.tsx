import constants from '../../constants.ts';

import NumPad from './NumPad.tsx';
import InputField from './InputField.tsx';

import { useState } from 'react';


function NumPadAssembly(props) {

  const close = props.close ?? (() => {});

  const [ currentValue, setCurrentValue ] = useState('');

  const onButtonPress = (e) => {
    const { value } = e.target.dataset;
    
    switch (value) {
      case '_set':
        close(getTimerLength(currentValue));
        break;

      case '_cancel':
        if (currentValue) {
          // Clear value on first push on cancel.
          setCurrentValue('');
        } else {
          // Cancel (hide the assmbly).
          close();          
        }
        break;

      default:
        setCurrentValue(currentValue + e.target.dataset.value);
    }
        
  }

  const displayValue = getDisplayValue(currentValue);
  
  return (
    <>
      <InputField value={displayValue}/>
      <NumPad onButtonPress={onButtonPress}/>
    </>
  )
}

/**
 * Get a formatted string.
 * @param currentValue 
 * @returns string
 */

function getDisplayValue(currentValue) {
  const placeHolder = '000000';
  
  const neededPadding = placeHolder.length - currentValue.length;
  
  let paddedValue = neededPadding > 0 ? '0'.repeat(neededPadding) + currentValue : currentValue;

  if (paddedValue.length > placeHolder.length) {
    // Value too long: trim by cutting off the most significant digits.
    paddedValue = paddedValue.substring(neededPadding * -1);
  }

  // Put in the colons.
  let displayValue = '';

  for (let i = 0; i < paddedValue.length; i++) {
    displayValue += paddedValue[i];
    if ((i % 2) && i < paddedValue.length - 1) {
      displayValue += ':';
    }
  }

  return displayValue;
}

/**
 * Get milliseconds.
 * @param currentValue 
 * @returns Number
 */
function getTimerLength(currentValue) {
  const displayValue = getDisplayValue(currentValue);

  const parts = displayValue.split(':');

  const ms 
    = Number(parts[2]) * constants.SECOND
    + Number(parts[1]) * constants.MINUTE
    + Number(parts[0]) * constants.HOUR;
  
  return ms;
}

export default NumPadAssembly;