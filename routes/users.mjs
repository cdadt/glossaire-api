import jwt from 'koa-jwt';
import Router from 'koa-router';
import User from '../models/user';
import config from '../services/config';

const router = new Router();

router.get(
  '/',
  jwt({ secret: config.get('token:secret') }),
  async (ctx) => {
    ctx.body = await User.find().lean();
  },
);

router.post(
  '/',
  jwt({ secret: config.get('token:secret') }),
  async (ctx) => {
    const { request: { body } } = ctx;

    const user = await User.findOne({ username: body.username });
    if (user) {
      ctx.assert(!user, 409, `L'utilisateur "${body.username}" existe déjà.`);
    }

    ctx.body = User.create(body);
  },
);

export default router.routes();
