
import { useState, useEffect } from 'react';

import { useAppSelector } from '../../../app/hooks.ts';
import { socket } from '../../websockets/socket.tsx';
import { getDeviceByChannel } from '../devices/helpers.ts';
import constants from '../../../constants.ts';

import './timer.css';

import { Device, Group, VirtualDevice } from '../devices/dataSlice.ts';

import LiveTimers from './LiveTimers.tsx';
import NudgePanel from './NudgePanel.tsx';
import Presets from './Presets.tsx';
import NumPadAssembly from './NumPadAssembly.tsx';
import Clock from './Clock.tsx';

function TimerPanel() {
  const [ numPadOpen, setNumPadOpen ] = useState(false);
  const [ selectedTimer, setSelectedTimer ] = useState(null);

  const devices: VirtualDevice[] = useAppSelector(state => state.data.devices);
  const timer = devices.find(device => device.subType === constants.SUBTYPE_TIMER);

  if (!timer?.settings) {
    // Nothing to show if there's no timer device present.
    return;
  }

  const liveTimers = timer.state.liveTimers ?? [];

  // If a timer is selected but doesn't exist anymore, deselect it.
  if (selectedTimer && !liveTimers.find(timer => timer.liveId == selectedTimer)) {
    setSelectedTimer(null);
  }

  // If there's only one timer selected it by default.
  if (liveTimers?.length && !selectedTimer) {
    setSelectedTimer(liveTimers[0].liveId);
  }

  const selectTimer = (event) => {
    const timerId = event.currentTarget.dataset.id;
    const selectedTimerId = event.currentTarget.dataset.selected;

    // Select, or remove the selection if it is already selected.
    setSelectedTimer(selectedTimerId == timerId ? null : timerId);
  };

  const nudgeTimer = (event) => {
    const step = event.currentTarget.dataset.step;
    console.log(`Nudging ${selectedTimer} with by ${step}`);
    socket.emit('auto/command/nudgeTimer', { liveTimerId: selectedTimer, step });
  }

  const schedulePresetTimer = (event) => {
    const timerId = event.currentTarget.dataset.id;

    const timerToSchedule = timer.settings.timers.find((timer) => timer.id === timerId);
    console.log('Scheduling timer:', timerToSchedule);
    socket.emit('auto/command/setTimer', timerToSchedule);
  };

  const cancelLiveTimer = (event) => {
    event.stopPropagation();
    const timerId = event.currentTarget.dataset.liveId;
    console.log('canceling', timerId);
    socket.emit('auto/command/cancelTimer', timerId);
  }
  
  const closeNumPad = (ms) => {
    setNumPadOpen(false);
    if (ms) {
      socket.emit('auto/command/setTimerFor', ms);
    }
  }

  const configuredTimers = {};

  // Grab the configured timers and add in a scheduling handler.
  timer.settings.timers?.forEach((timer) => {
    configuredTimers[timer.id] = {
      ...timer,
      onClick: schedulePresetTimer,
    }
  });

  const props = {
    selectedTimer,
    selectTimer,    
    cancelLiveTimer,
    nudgeTimer,
    liveTimers,
  }

  return (
    <div className='timer-panel-container'>
      <div className='touch-ui-sub-panel-header'>Clock</div>
      { liveTimers.length > 0 && <LiveTimers {...props}/>}
      { !liveTimers.length && <Clock clockTime={timer.state.clock}/>}
      <NudgePanel {...props}/>      
      <Presets configuredTimers={configuredTimers} onPresetTimerClick={schedulePresetTimer} onCustomClick={setNumPadOpen}/>
      { numPadOpen && <NumPadAssembly close={closeNumPad} />}      
    </div>
  );
}

export default TimerPanel;