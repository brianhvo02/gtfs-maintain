import { Router } from 'express';
import { databaseClose, databaseConnect } from '../middleware/database';
import { create, getAll, update } from '../controllers/feeds';
import routesRouter from './routes';

const feedsRouter = Router();

feedsRouter.get('/', databaseConnect, getAll, databaseClose);
feedsRouter.post('/', databaseConnect, create, databaseClose);
feedsRouter.patch('/:feedId', databaseConnect, update, databaseClose);

feedsRouter.use('/:feedId/routes', routesRouter);

export default feedsRouter;