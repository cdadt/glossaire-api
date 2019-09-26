import jwt from 'koa-jwt';
import Router from 'koa-router';
import User from '../models/user';
import config from '../services/config';
import { sendEmail } from '../helpers/send-email';

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
    const user = await User.find(
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

    for (let i = 0; i < user.length; i += 1) {
      if (user[i].bookmark) {
        for (let j = 0; j < user[i].bookmark.length; j += 1) {
          if (!user[i].bookmark[j].published || !user[i].bookmark[j].validated) {
            delete user[i].bookmark[j].definition;
          }
        }
      }
    }

    ctx.body = user;
  });

router.get('/bookmarkpresence',
  jwt({ secret: config.get('token:secret') }),
  async (ctx) => {
    const { query } = ctx;
    const { userID } = query;
    const { wordID } = query;

    // On vérifie qu'utilisateur existe combinant l'id du user ainsi que l'id du favoris
    const user = await User.findOne({ _id: userID, 'bookmark._id': wordID });
    ctx.body = !!user;
  });

router.patch('/forgotten-psw',
  async (ctx) => {
    const { email } = ctx.request.body.params;

    // On vérifie que l'user existe et on récupère ses informations
    const user = await User.findOne({ email });
    if (user) {
      const reinitiateCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      const message = `<!DOCTYPE html>
        <html lang="fr">
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Réinitialisation de mot de passe</title>
          </head>
          <body>
            <p>Bonjour ${user.firstname},</p>
            <p>Veuillez cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p>
            <a href="https://angular-test.alwaysdata.net/reinitialiser-mot-de-passe/${reinitiateCode}">
            Réinitialiser le mot de passe.</a>
            <p>Cordialement, l'équipe du Glossaire</p>
          </body>
        </html>`;


      const subject = 'Réinitialisation de mot de passe.';

      sendEmail(email, message, subject);

      await User.updateOne({ _id: user._id.toString() }, { $set: { reinitiate_code: reinitiateCode } });
    }

    ctx.body = !!user;
  });

router.patch('/change-psw',
  async (ctx) => {
    const { code } = ctx.request.body.params;
    const { psw } = ctx.request.body.params;
    const user = await User.findOne({ reinitiate_code: code });

    await User.updateOne(
      { reinitiate_code: code },
      { $unset: { reinitiate_code: 1 } },
    ).lean();

    user.password = psw;

    ctx.body = await user.save();
  });

router.get('/verif-reset-psw-code/:code',
  async (ctx) => {
    const { code } = ctx.params;
    ctx.body = await User.findOne({ reinitiate_code: code }).lean();
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

router.delete('/bookmark',
  jwt({ secret: config.get('token:secret') }),
  async (ctx) => {
    const { userID } = ctx.query;
    const { wordID } = ctx.query;

    ctx.body = await User.updateOne(
      { _id: userID },
      { $pull: { bookmark: { _id: wordID } } },
    ).lean();
  });

router.post('/bookmark',
  jwt({ secret: config.get('token:secret') }),
  async (ctx) => {
    const { request: { body } } = ctx;
    const { userID } = body;
    const { bookmark } = body;

    // On vérifie si que l'username n'est pas déjà utilisé
    const user = await User.findOne({ 'bookmark.id': body.bookmark._id });
    if (user) {
      ctx.assert(!user, 409, 'Vous possédez déjà ce favori.');
    }

    ctx.body = await User.updateOne(
      { _id: userID },
      { $push: { bookmark } },
    ).lean();
  });

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
        user.permissions = body.permissions;

        ctx.body = await user.save();
      }
    }
  },
);

export default router.routes();
