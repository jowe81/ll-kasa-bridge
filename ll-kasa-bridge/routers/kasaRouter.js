
const initRouter = (express, devicePool, processRequest) => {
  const kasaRouter = express.Router();

  kasaRouter.use((err, req, res, next) => {
    console.log('- An error occurred: ', err);
    res.status(500).send(err);
    next(err);
  });
  
  kasaRouter.get([ '/setPowerState', '/setpowerstate', '/switch' ], (req, res, next) => {
    processRequest(req, res, 'setPowerState', devicePool).catch(next);
  });
    
  kasaRouter.get([ '/setLightState', '/setlightstate', '/set' ], (req, res, next) => {
    processRequest(req, res, 'setLightState', devicePool).catch(next);
  });
  
  return kasaRouter;
}

module.exports = { initRouter };