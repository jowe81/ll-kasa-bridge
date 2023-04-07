const { Client } = require('tplink-smarthome-api');


const client = new Client();


// const plug = client.getDevice({ host: '192.168.1.127' }).then((device) => {
//   device.getSysInfo().then(console.log);
//   device.setPowerState(true);
// });

const devices = [];

const devMap = [
  {
    //100+ Bulbs
    channel: 101,
    id: "80121D6F58ADDCAC185363C01347F5EA1F752B55",    
  },
  {
    //200+ Plugs
    channel: 201, 
    id: "80061465B741F3D278857FD2F8E09CD020C3200A",    
  }
];


const getDeviceById = id => {
  return devMap.find(element => element.id === id);  
}

const addDeviceToMap = device => {
  deviceObject = getDeviceById(device.id);
  deviceObject.device = device;
  console.log(`Added new device to map: ${device.id}, ${device.host}, ${device.alias}`);
}

const getDeviceByChannel = channel => {
  const devMapItem = devMap.find(element => element.channel == channel);
  return devMapItem;
}


// Look for devices and add them to the map
client.startDiscovery().on('device-new', (device) => {
  device.getSysInfo().then(info => {
    console.log(`Found '${device.alias}' at ${device.host}`);
    addDeviceToMap(device);
  });
});


const express = require('express')
const app = express()
const port = 3000

app.get('/switch', (req, res) => {
  const { ch, set }  = req.query;

  const devMapItem = getDeviceByChannel(ch);
  const device = devMapItem?.device;

  if (devMapItem && device) {
    let info = `Channel ${ch} (${device.alias}@${device.host}): ${set}`

    switch (set) {
      case 'toggle':
        device.togglePowerState();
        break;
            
      case 'on':
        device.setPowerState(true);
        break;
      
      case 'off':
        device.setPowerState(false);
        break;

      default:
        info += `: invalid command`;  
    }

    console.log(info);
    res.send(info);  
  } else {
    res.send('device not found');
  }
})

app.listen(port, () => {
  console.log(`LifeLog-Kasa-Bridge server listening on port ${port}.`);
})