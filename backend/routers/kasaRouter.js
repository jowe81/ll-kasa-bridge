import { log } from '../helpers/jUtils.js';

const initRouter = (express, devicePool, processRequest) => {
  const kasaRouter = express.Router();

  kasaRouter.use((err, req, res, next) => {
    console.log('- An error occurred: ', err);
    res.status(500).send(err);
    next(err);
  });

  kasaRouter.use((req, res, next) => {
    log(req.url);
    next();
  })
  
  kasaRouter.get('/slow', (req, res, next) => {
    console.log(req.query);
    const { delay } = req.query;
    setTimeout(() => {
      res.status(200).send(`This response was issued after ${delay} seconds.`);
    }, delay * 1000);
  })

  kasaRouter.get([ '/setPowerState', '/setpowerstate', '/switch' ], (req, res, next) => {    
    processRequest(req, res, 'setPowerState', devicePool).catch(next);
  });
    
  kasaRouter.get([ '/setLightState', '/setlightstate', '/set' ], (req, res, next) => {
    processRequest(req, res, 'setLightState', devicePool).catch(next);
  });
  
  kasaRouter.get([ '/applyPreset/class' ], (req, res, next) => {    
    const { className, presetId, suspendPeriodicFilters, resumePeriodicFilters } = req.query;
    console.log(`applying preset ${presetId} to class ${className}`);

    devicePool.applyPresetToClass(className, presetId, 'API', suspendPeriodicFilters, resumePeriodicFilters);
    res.send('ok');
  });

  return kasaRouter;
}

export { initRouter };
