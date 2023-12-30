import { log } from "../helpers/jUtils.js";

const initRouter = (express, devicePool, processRemoteRequest) => {
    const remoteRouter = express.Router();

    remoteRouter.use((err, req, res, next) => {
        console.log("- An error occurred: ", err);
        res.status(500).send(err);
        next(err);
    });

    remoteRouter.use((req, res, next) => {
        log(req.url);
        next();
    });

    remoteRouter.get("/", (req, res) => {
        const data = processRemoteRequest(req.query, devicePool);
        res.json({data, success: true});
    });

    return remoteRouter;
};

export default initRouter;
