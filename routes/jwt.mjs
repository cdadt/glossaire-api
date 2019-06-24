import Router from 'koa-router';
import User from '../models/user';


const router = new Router();

router.post('/generate',
  async (ctx) => {
    const { request: { body } } = ctx;

    let isAuth = false;
    const user = await User.findOne({ email: body.email });
    if (user) {
      isAuth = await user.comparePassword(body.password);
    }
    ctx.assert(isAuth, 403, 'L\'email et/ou le mot de passe ne correspond pas.');

    ctx.body = { token: user.signJWT() };
  });

export default router.routes();
