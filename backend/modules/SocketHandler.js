import { log } from "../helpers/jUtils.js";
import { buildCommandObjectFromCurrentState } from './TargetDataProcessor.js';

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
      log(`Socket connection from ${address}`, `bgBlue`);

      // Clients request the full map when connecting
      socket.on('auto/getDevices', (data) => {
        socket.emit('auto/devices', this.devicePool.getLiveDeviceMap());
      });

      socket.on('auto/getGroups', () => {
        socket.emit('auto/groups', this.devicePool.globalConfig.groups);
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
        const { targetType, targetId, macroName, commandObject } = props;
        

        log(`${address}: Macro ${macroName}, ${targetType} ${targetId}`, `bgBlue`);

        switch (targetType) {
          case 'channel':
            const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(targetId);

            if (!deviceWrapper) {
              log(`Device Wrapper not found`, `bgRed`)
              // Error - no wrapper.
              return;
            }

            switch (macroName) {
              case 'toggleChannel': {
                deviceWrapper.toggle('ws:' + address);
              }
            }

            break;

          case 'group':
            switch (macroName) {
              case 'toggleGroup':
                this.devicePool.toggleGroup(targetId);
              break;
            }

            break;
              


          case 'toggle':

          case 'toggleGroup':
            console.log('Toggle Group');
        }
      });      
    
    });
  },

  /**
   * Broadcast Methods
   */

  // Push full device update
  emitDeviceUpdate(deviceWrapper) {
    this.io.emit('auto/device', this.devicePool.getLiveDevice(deviceWrapper));
  },

  // Push device state update
  emitDeviceStateUpdate(deviceWrapper, changeInfo) {
    this.io.emit('auto/device/state', { 
      changeInfo,
      data: {
        isOnline: deviceWrapper.isOnline,
        powerState: deviceWrapper.powerState,       
        state: buildCommandObjectFromCurrentState(deviceWrapper),
        channel: deviceWrapper.channel,
      }
    });
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