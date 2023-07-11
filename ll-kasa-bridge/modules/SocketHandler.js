import { log } from "../helpers/jUtils.js";

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

      // Clients may execute macros
      socket.on('auto/command/macro', ({ channel, name, commandObject }) => {
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

  startSocketServer() {
    this.io.listen(4000);
    log(`Socket Server is listening on port ${this.port}.`);  
  },

  emitDeviceUpdate(deviceWrapper) {
    this.io.emit('auto/device', this.devicePool.getLiveDevice(deviceWrapper));
  },

  _getDeviceWrapper(channel) {
    return this.devicePool.getDeviceWrapperByChannel(channel);
  }




}

export { socketHandler };