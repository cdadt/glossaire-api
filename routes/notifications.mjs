import Router from 'koa-router';
import webPush from 'web-push';
import Subscriber from '../models/subscriber';

const router = new Router();

const VAPID_PUBLIC_KEY = 'BNGmdT-zn-S0tocFwPP9Z6PG3pfouwebPHQ0lpAQg5Z5LLZJ4OdBXz8aN_ct19Bbvi56WeYosu94RCXS34D2NU0';
const VAPID_PRIVATE_KEY = '-YE8qIqdEBsrDj5mZR-90WsgWx7ODtH5xwTu_LqFIs4';

webPush.setVapidDetails(
  'mailto:example@yourdomain.org',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
);

router.post('/', async (ctx) => {
  try {
    const { request: { body } } = ctx;

    const allSubscriptions = await Subscriber.find();
    const notificationPayload = {
      notification: {
        title: `Une définition vient d'être ajoutée : ${body.title}.`,
        body: `La définition du mot ${body.title} vient d'être ajoutée par ${body.user}.`,
        icon: 'assets/img/logo_carre.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1,
          url: `https://glossaire.alwaysdata.net/definition/${body.title}`,
        },
        actions: [{
          action: 'explore',
          title: 'Consulter la définition',
        }],
      },
    };
    allSubscriptions.forEach(async (sub) => {
      await webPush.sendNotification(sub, JSON.stringify(notificationPayload));
    });
    ctx.status = 204;
  } catch (e) {
    ctx.throw(500, 'Un problème est survenu dans l\'envoi des notifications.');
  }
});

router.post('/subscribers', async (ctx) => {
  const { request: { body } } = ctx;
  ctx.body = await Subscriber.create(body);
});

router.delete('/subscribers/:idEndpoint', async (ctx) => {
  const { idEndpoint } = ctx.params;
  ctx.body = await Subscriber.deleteOne({
    endpoint: {
      $regex: idEndpoint,
    },
  });
});

export default router.routes();
