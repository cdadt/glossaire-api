import Router from 'koa-router';
import { importDefinitions } from '../helpers/import';

const router = new Router();

router.post(
  '/',
  async (ctx) => {
    const { request: { body } } = ctx;
    importDefinitions(body);

    ctx.status = 200;
  },
);

export default router.routes();
