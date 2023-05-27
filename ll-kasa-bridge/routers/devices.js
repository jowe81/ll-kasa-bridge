import { log } from '../helpers/jUtils.js';

const initRouter = (express, devicePool, processRequest) => {
  const devices = express.Router();

  devices.use((err, req, res, next) => {
    console.log('- An error occurred: ', err);
    res.status(500).send(err);
    next(err);
  });

  devices.use((req, res, next) => {
    log(`/auto/devices${req.url}`);
    next();
  })
  

  devices.get('/', (req, res) => {
    //res.sendStatus(404);
    res.send(devicePool.getLiveDeviceMap());
  });
  
  return devices;
}

export default initRouter;
