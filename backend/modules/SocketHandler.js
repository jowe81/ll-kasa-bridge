import { log } from "../helpers/jUtils.js";
import { buildCommandObjectFromCurrentState } from './TargetDataProcessor.js';
import constants from "../constants.js";

const socketHandler = {

  initialize(io, devicePool) {
    log(`Initializing socket server...`);

    this.port = process.env.SOCKET_PORT ?? 4000;
    this.io = io;
    this.devicePool = devicePool;

    devicePool.socketHandler = this;

    this.attachHandlers();    
  },

  attachHandlers() {
    // Initialize socket server.
    this.io.on('connection', (socket) => {

      const address = socket.handshake.address;
      const origin = "ws:" + address;

      log(`Socket connection from ${address}`, `bgBlue`);

      // Clients request the full map when connecting
      socket.on('auto/getDevices', (data) => {
        socket.emit('auto/devices', this.devicePool.getLiveDeviceMap());
      });

      socket.on('auto/getGroups', () => {
        socket.emit('auto/groups', this.devicePool.getDisplayGroups());
      });

      socket.on('auto/getLocations', () => {
        socket.emit('auto/locations', this.devicePool.globalConfig.locations);
      });

      // Clients may execute macros
      socket.on('auto/command/macro2', (props) => {
        const { targetId, macroName, commandObject } = props;
        const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(targetId);

        if (deviceWrapper) {
          log(`Ch ${targetId} ${address}: ${macroName}`, `bgBlue`);

          if (macroName === 'toggleChannel') {            
            deviceWrapper.toggle('ws:' + address);
          }
  
        }
      });


      // Clients may execute macros
      socket.on('auto/command/macro', (props) => {
        const logTag = `${address} auto/command/macro: `;
        const { targetType, targetId, macroName, commandObject } = props;
        

        log(`${logTag}Macro ${macroName}, ${targetType} ${targetId}`, `bgBlue`);

        switch (targetType) {
          case 'channel':
            const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(targetId);

            if (!deviceWrapper) {
              log(`Device Wrapper not found`, `bgRed`)
              // Error - no wrapper.
              return;
            }

            switch (macroName) {
              case 'toggleChannel': 
                deviceWrapper.toggle('ws:' + address);
                break;                

              case 'thermostatDown':
                deviceWrapper._deviceHandlers?.nudgeTarget(false);
                break;

              case 'thermostatUp':
                deviceWrapper._deviceHandlers?.nudgeTarget(true);
                break;
                  
            }

            break;

          case 'group':
            switch (macroName) {
              case 'toggleGroup':
                this.devicePool.toggleGroup(targetId);
              break;
            }

            break;
            
        }
      });      

      socket.on('auto/command/setTimerFor', (ms) => {
        const timerDeviceWrapper = this.devicePool.getTimerDeviceWrapper();
        timerDeviceWrapper._deviceHandlers.setTimerFor(ms);
      })

      socket.on('auto/command/setTimer', (timer) => {
        const timerDeviceWrapper = this.devicePool.getTimerDeviceWrapper();
        timerDeviceWrapper?._deviceHandlers.setTimer(timer.id);
      })

      socket.on('auto/command/cancelTimer', (liveTimerId) => {
        const timerDeviceWrapper = this.devicePool.getTimerDeviceWrapper();
        timerDeviceWrapper._deviceHandlers.killLiveTimerByLiveId(liveTimerId);
      });

      socket.on('auto/command/nudgeTimer', ({liveTimerId, step}) => {
        const timerDeviceWrapper = this.devicePool.getTimerDeviceWrapper();
        timerDeviceWrapper._deviceHandlers.nudgeLiveTimerByLiveId(liveTimerId, step);
      });
      
      socket.on('auto/command/masterSwitch', ({buttonId}) => {
        const masterSwitchDeviceWrapper = this.devicePool.getMasterSwitchDeviceWrapper();
        masterSwitchDeviceWrapper._deviceHandlers.execute(buttonId, origin);
      })

      /**
       * Execeute a generic command on a channel. This method should be the way forward.
       */
      socket.on('auto/command/channel', (command) => {
          const logTag = `${address} auto/command/channel: `;
          const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(command.channel);
          if (!deviceWrapper) {
              log(
                  `${logTag}Received command "${command.id}" for channel ${command.channel}, but no live device found.`,
                  "red"
              );
              return;
          }
          
          const commandHandler = deviceWrapper.getCommandHandler(command.id);
          if (!(commandHandler && typeof commandHandler === 'function')) {
              log(
                  `${logTag}Received command "${command.id}" for channel ${command.channel}, but device does not have a handler for it.`,
                  "red"
              );
              return;            
          }

          log(
              `${logTag}Received command "${command.id}" for channel ${command.channel}`,
              `bgBlue`
          );
          
          // Wrapper supports the command; execute it.
          commandHandler(deviceWrapper, command);
      });
    
    });
  },

  /**
   * Broadcast Methods
   */

  // Push full device update
  emitDeviceUpdate(deviceWrapper) {
    const payload = this.devicePool.getLiveDevice(deviceWrapper);
    // [201, 202].includes(deviceWrapper.channel) && console.log('FULL update', payload)
    this.io.emit('auto/device', this.devicePool.getLiveDevice(deviceWrapper));
  },

  // Push device state update
  emitDeviceStateUpdate(data, changeInfo, device = null) {
    const payload = {
      changeInfo,
      data,
    };
    
    this.io.emit('auto/device/state', payload);
  },

  startSocketServer() {
    this.io.listen(4000);
    log(`Socket Server is listening on port ${this.port}.`);  
  },

  _getDeviceWrapper(channel) {
    return this.devicePool.getDeviceWrapperByChannel(channel);
  }




}

export { socketHandler };