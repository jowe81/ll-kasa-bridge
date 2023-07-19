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
      socket.on('auto/command/macro', (props) => {
        const { channel, name, commandObject } = props;
        const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(channel);

        if (deviceWrapper) {
          log(`Ch ${channel} ${address}: ${name}`, `bgBlue`);

          if (name === 'toggle') {            
            deviceWrapper.toggle('ws:' + address);
          }
  
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
        powerState: deviceWrapper.powerState,       
        state: buildCommandObjectFromCurrentState(deviceWrapper),
        channel: deviceWrapper.channel,
      }
    });
  },

  // Push device online-state update
  emitDeviceOnlineStateUpdate(deviceWrapper) {
    console.log('Emitting onlinestate update for ', deviceWrapper.alias, deviceWrapper.isOnline);
    this.io.emit('auto/device/onlineState', { 
      channel: deviceWrapper.channel,
      data: {
        isOnline: deviceWrapper.isOnline,        
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