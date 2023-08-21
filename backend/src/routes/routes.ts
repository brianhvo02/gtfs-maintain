import { Router } from 'express';
import { databaseClose, databaseConnect } from '../middleware/database';
import { getAll } from '../controllers/routes';

const routesRouter = Router({ mergeParams: true });

routesRouter.get('/', databaseConnect, getAll, databaseClose);

export default routesRouter;