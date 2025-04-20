import { log } from '../helpers/jUtils.js';

const initRouter = (express, devicePool, processRequest) => {
  const externalRouter = express.Router();

  externalRouter.use((err, req, res, next) => {
    console.log('- An error occurred: ', err);
    res.status(500).send(err);
    next(err);
  });

  externalRouter.use((req, res, next) => {
    log(req.url);
    next();
  })
  
  externalRouter.get([ '/getTemp' ], async (req, res, next) => {    
    const { deviceIds } = req.query;
    const deviceIdsArray = deviceIds.split(',');
    try {
        const data = await processRequest(deviceIdsArray, devicePool);
        res.json({ data, success: true });
    } catch (error) {
        res.json({error, success:false});
    }
  });

  return externalRouter;
}

export default initRouter;
