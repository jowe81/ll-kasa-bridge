
import { useState } from 'react';

import { useAppSelector } from '../../../app/hooks.ts';
import { socket, setTimer, cancelTimer, setTimerFor, nudgeLiveTimer } from '../../websockets/socket.tsx';
import constants from '../../../constants.ts';

import './timer.css';

import { VirtualDevice } from '../devices/dataSlice.ts';

import LiveTimers from './LiveTimers.tsx';
import NudgePanel from './NudgePanel.tsx';
import Presets from './Presets.tsx';
import NumPadAssembly from './NumPadAssembly.tsx';

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
    nudgeLiveTimer(selectedTimer, step);    
  }

  const schedulePresetTimer = (event) => {
    const timerId = event.currentTarget.dataset.id;
    const timerToSchedule = timer.settings.timers.find((timer) => timer.id === timerId);
    setTimer(timerToSchedule);    
  };

  const cancelLiveTimer = (event) => {
    event.stopPropagation();
    const timerId = event.currentTarget.dataset.liveId;
    cancelTimer(timerId);
  }
  
  const closeNumPad = (ms) => {
    setNumPadOpen(false);
    if (ms) {
      setTimerFor(ms);
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
      <div className='touch-ui-sub-panel-header'>Timer</div>
      { liveTimers.length > 0 && <LiveTimers {...props}/>}
      <NudgePanel {...props}/>      
      <Presets configuredTimers={configuredTimers} onPresetTimerClick={schedulePresetTimer} onCustomClick={setNumPadOpen}/>
      { numPadOpen && <NumPadAssembly close={closeNumPad} />}      
    </div>
  );
}

export default TimerPanel;