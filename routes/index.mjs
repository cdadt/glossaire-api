import path from 'path';
import Router from 'koa-router';
import { importRoutes } from '../helpers/route';

let router = new Router();

const FILENAME = typeof __filename !== 'undefined' ? __filename
  : (/^ +at (?:file:\/*(?=\/)|)(.*?):\d+:\d+$/m.exec(Error().stack) || '')[1];
const CURRENT_FILE = path.basename(FILENAME);

router = importRoutes(router, 'routes', [
  CURRENT_FILE,
]);

export default router.routes();
