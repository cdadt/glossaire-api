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

router.get('/search',
  jwt({ secret: config.get('token:secret') }),
  async (ctx) => {
    const { username } = ctx.query;
    const { pubOption } = ctx.query;

    if (pubOption === '') {
      ctx.body = await User.find(
        {
          username:
            {
              $regex: username.trim(),
              $options: 'i',
            },
        },
      )
        .sort({ title: 1 })
        .lean();
    } else {
      ctx.body = await User.find(
        {
          username:
            {
              $regex: username.trim(),
              $options: 'i',
            },
          'themes.published': pubOption,
        },
      )
        .sort({ title: 1 })
        .lean();
    }
  });

router.get('/:id',
  jwt({ secret: config.get('token:secret') }),
  async (ctx) => {
    const { id } = ctx.params;
    ctx.body = await User.findById(id, '-password').lean();
  });

router.post(
  '/',
  jwt({ secret: config.get('token:secret') }),
  async (ctx) => {
    const { request: { body } } = ctx;

    // On vérifie si que l'username n'est pas déjà utilisé
    let user = await User.findOne({ username: body.username });
    if (user) {
      ctx.assert(!user, 409, `L'utilisateur "${body.username}" existe déjà.`);
    }

    // On vérifie que l'email n'est pas déjà utilisé
    user = await User.findOne({ email: body.email });
    if (user) {
      ctx.assert(!user, 409, 'Ce mail est déjà utilisé.');
    }

    ctx.body = User.create(body);
  },
);

router.post(
  '/update',
  jwt({ secret: config.get('token:secret') }),
  async (ctx) => {
    const { request: { body } } = ctx;
    const user = await User.findById(body._id);

    // On vérifie que l'utilisateur existe bien
    if (!user) {
      ctx.assert(!user, 409, `L'utilisateur "${body.username}" n'existe pas.`);
    } else {
      const usersSameUsernameEmail = await User.find()
        .where('_id').ne(body._id)
        .or([{ username: body.username }, { email: body.email }]);

      // On vérifie que l'username et le mail n'existe pas déjà
      if (usersSameUsernameEmail.length > 0) {
        ctx.assert(!user, 409, 'Un utilisateur possède déjà cet username.');
      } else {
        if (body.password && body.password !== '') {
          user.password = body.password;
        }
        user.username = body.username;
        user.email = body.email;
        user.firstname = body.firstname;
        user.lastname = body.lastname;
        user.activated = body.activated;

        ctx.body = await user.save();
      }
    }
  },
);

export default router.routes();
