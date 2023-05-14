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
  
  kasaRouter.get([ '/setPowerState', '/setpowerstate', '/switch' ], (req, res, next) => {    
    processRequest(req, res, 'setPowerState', devicePool).catch(next);
  });
    
  kasaRouter.get([ '/setLightState', '/setlightstate', '/set' ], (req, res, next) => {
    processRequest(req, res, 'setLightState', devicePool).catch(next);
  });
  
  return kasaRouter;
}

export { initRouter };
