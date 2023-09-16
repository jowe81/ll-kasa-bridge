
import { useState } from 'react';

import { useAppSelector } from '../../app/hooks.ts';
import { socket } from '../websockets/socket.tsx';
import { getDeviceByChannel } from '../devices/helpers.ts';
import constants from '../../constants.ts';

import './timer.css';

import { Device, Group, VirtualDevice } from '../devices/dataSlice.ts';

import LiveTimers from './LiveTimers.tsx';
import NudgePanel from './NudgePanel.tsx';
import Presets from './Presets.tsx';
import NumPadAssembly from './NumPadAssembly.tsx';

function TimerPanel() {
  const devices: Device[] = useAppSelector(state => state.data.devices);
  const timer = devices.find(device => device.subType === constants.SUBTYPE_TIMER);

  const schedulePresetTimer = (event) => {
    const timerId = event.currentTarget.dataset.id;

    const timerToSchedule = timer.settings.timers.find((timer) => timer.id === timerId);
    console.log('Scheduling timer:', timerToSchedule);
    socket.emit('auto/command/setTimer', timerToSchedule);
  };

  const cancelLiveTimer = (event) => {
    const timerId = event.currentTarget.dataset.liveId;
    console.log('canceling', timerId);
    socket.emit('auto/command/cancelTimer', timerId);
  }
  
  const configuredTimers = {};

  timer?.settings?.timers?.forEach((timer, index) => {
    configuredTimers[timer.id] = {
      ...timer,
      onClick: schedulePresetTimer,
    }
  });


  const [ numPadOpen, setNumPadOpen ] = useState(false);

  const closeNumPad = (value) => {
    setNumPadOpen(false);
    console.log('Closed with value: ' , value)
  }



  return (
    <div className='timer-panel-container'>
      <div className='touch-ui-panel-header'>Timers</div>
      <LiveTimers liveTimers={timer?.state.liveTimers} cancelLiveTimer={cancelLiveTimer}/>
      <NudgePanel />      
      <Presets configuredTimers={configuredTimers} onPresetTimerClick={schedulePresetTimer} onCustomClick={setNumPadOpen}/>
      { numPadOpen && <NumPadAssembly close={closeNumPad} />}      
    </div>
  );
}

export default TimerPanel;