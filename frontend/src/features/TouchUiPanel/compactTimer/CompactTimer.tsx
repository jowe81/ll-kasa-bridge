
import { useState } from "react";
import { useAppSelector } from "../../../app/hooks.ts";
import { socket, setTimer, cancelTimer } from "../../websockets/socket.tsx";
import constants from "../../../constants.ts";

import { VirtualDevice } from "../../TouchUiMain/devices/dataSlice.ts";

import Presets from "./Presets.tsx";
import LiveTimers from "./LiveTimers.tsx";

import './timer.css';

function CompactTimer() {
  const [selectedTimer, setSelectedTimer] = useState(null);

  const devices: VirtualDevice[] = useAppSelector(
      (state) => state.data.devices
  );
  const timer = devices.find(
      (device) => device.subType === constants.SUBTYPE_TIMER
  );

  if (!timer?.settings) {
      // Nothing to show if there's no timer device present.
      return;
  }

  const liveTimers = timer.state.liveTimers ?? [];

  // If a timer is selected but doesn't exist anymore, deselect it.
  if (
      selectedTimer &&
      !liveTimers.find((timer) => timer.liveId == selectedTimer)
  ) {
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

  const schedulePresetTimer = (event) => {
      const timerId = event.currentTarget.dataset.id;

      const timerToSchedule = timer.settings.timers.find(
          (timer) => timer.id === timerId
      );      
      setTimer(timerToSchedule);
  };

  const cancelLiveTimer = (event) => {
      event.stopPropagation();
      const timerId = event.currentTarget.dataset.liveId;      
      cancelTimer(timerId);
  };

  const configuredTimers = {};

  // Grab the configured timers and add in a scheduling handler.
  timer.settings
    .timers?.slice(0, 6)
    .forEach((timer) => {
      configuredTimers[timer.id] = {
          ...timer,
          onClick: schedulePresetTimer,
      };
  });

  const props = {
      selectedTimer,
      selectTimer,
      cancelLiveTimer,
      liveTimers,
  };

  return (
      <div className="touch-ui-panel-item">
          <div className="compact-timer-container">
              {liveTimers.length > 0 && <LiveTimers {...props} />}
              {!liveTimers.length && (
                  <Presets
                      configuredTimers={configuredTimers}
                      onPresetTimerClick={schedulePresetTimer}
                  />
              )}
          </div>
      </div>
  );

}

export default CompactTimer;