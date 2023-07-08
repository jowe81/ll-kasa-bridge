import { log } from '../helpers/jUtils.js';

const initRouter = (express, devicePool, processRequest) => {
  const devicePoolRouter = express.Router();

  devicePoolRouter.use((err, req, res, next) => {
    console.log('- An error occurred: ', err);
    res.status(500).send(err);
    next(err);
  });

  devicePoolRouter.use((req, res, next) => {
    log(`/auto/devicePool${req.url}`);
    next();
  })
  
  devicePoolRouter.post('/applyPreset', (req, res) => {
    const { presetId } = req.body;
    const options = req.query
    const { targetType, targetId } = getTargetInfo(req.body);
    
    devicePool.applyOptionsTo(targetType, targetId, options);
    devicePool.applyPresetTo(targetType, targetId, presetId, options);

    res.send(req.body);
  });
  
  devicePoolRouter.post('/applyOptions', (req, res) => {
    const { className, channel } = req.body;
    const options = req.query;
      
    if (className) {
      devicePool.applyOptionsTo('class', className, options);
    }

    if (channel) {      
      devicePool.applyOptionsTo('channel', parseInt(channel), options);
    }
    
    res.send(req.body);
  });



  return devicePoolRouter;
}

const getTargetInfo = (fields) => {
  let targetType = null;
  let targetId = null;

  const { className, presetId, channel, groupId } = fields;
  
  if (className) {
    targetType = 'class';
    targetId = className;
  }

  if (channel) {
    targetType = 'channel';
    targetId = channel;
  }

  if (groupId) {
    targetType = 'group';
    targetId = groupId;
  }

  return { targetType, targetId };
}

const applyOptionsTo = (targetType, targetId, options) => {

};

export default initRouter;
