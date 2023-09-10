
import { useState } from 'react';

import { useAppSelector } from '../../app/hooks.ts';
import { socket } from '../websockets/socket.tsx';
import { getDeviceByChannel } from '../devices/helpers.ts';
import constants from '../../constants.ts';

import './timer.css';

import { Device, Group } from '../devices/dataSlice.ts';

import LiveTimers from './LiveTimers.tsx';
import NudgePanel from './NudgePanel.tsx';
import Presets from './Presets.tsx';
import NumPadAssembly from './NumPadAssembly.tsx';

function TimerPanel() {
  const [ numPadOpen, setNumPadOpen ] = useState(false);

  const closeNumPad = (value) => {
    setNumPadOpen(false);
    console.log('Closed with value: ' , value)
  }


  return (
    <div className='timer-panel-container'>
      <div className='touch-ui-panel-header'>Timers</div>
      <LiveTimers />
      <NudgePanel />      
      <Presets onCustomClick={setNumPadOpen}/>
      { numPadOpen && <NumPadAssembly close={closeNumPad} />}      
    </div>
  );
}

export default TimerPanel;