import Router from 'koa-router';
import jwt from 'koa-jwt';
import Multer from 'koa-multer';
import Theme from '../models/theme';
import config from '../services/config';
import Word from '../models/word';

const router = new Router();
// const upload = Multer({ dest: 'uploads/' });
const storage = Multer.memoryStorage();
const upload = Multer({ storage });

router.get('/', async (ctx) => {
  const { pubOption } = ctx.query;

  if (pubOption === '') {
    ctx.body = await Theme.find().lean();
  } else {
    ctx.body = await Theme.find({ published: pubOption }).lean();
  }
});

router.get('/search', async (ctx) => {
  const { title } = ctx.query;
  const { pubOption } = ctx.query;

  const result = {
    title:
        {
          $regex: title.trim(),
          $options: 'i',
        },
  };

  if (pubOption !== '') {
    result.published = pubOption;
  }

  ctx.body = await Theme.find(result)
    .sort({ title: 1 })
    .lean();
});

router.get('/:id', async (ctx) => {
  const { id } = ctx.params;
  ctx.body = await Theme.findById(id).lean();
});

router.get('/:id/words', async (ctx) => {
  const { id } = ctx.params;
  ctx.body = await Word.find({ 'themes._id': id }).lean();
});

router.delete('/',
  jwt({ secret: config.get('token:secret') }),
  async (ctx) => {
    const { themeId } = ctx.query;

    const word = await Word.findOne(
      { 'themes._id': themeId },
    ).lean();

    ctx.assert(!word, 403, 'Veuillez déplacer les définitions liées à ce thème avant la suppression.');

    ctx.body = await Theme.deleteOne({ _id: themeId });
  });

router.put('/',
  upload.single('image', 'png'),
  async (ctx) => {
    const theme = ctx.request.body;
    await Word.updateMany({ 'themes._id': theme._id }, { $set: { 'themes.$.title': theme.title } });

    if (theme.image) {
      ctx.body = await Theme.updateOne(
        { _id: theme._id }, {
          $set:
            {
              title: theme.title,
              'img.data': theme.image,
              'img.size': theme.imageSize,
            },
        },
      );
    } else {
      ctx.body = await Theme.updateOne(
        { _id: theme._id }, { $set: { title: theme.title } },
      );
    }
  });

router.patch('/published',
  async (ctx) => {
    const { themeId } = ctx.request.body.params;
    const { themePub } = ctx.request.body.params;
    // On met à jour les thèmes des mots
    await Word.updateMany({ 'themes._id': themeId }, { $set: { 'themes.$.published': themePub } });

    // On met à jour le thème lui-même
    ctx.body = await Theme.updateOne(
      { _id: themeId }, { published: themePub },
    );
  });

router.post(
  '/',
  upload.single('image', 'png'),
  jwt({ secret: config.get('token:secret') }),
  async (ctx) => {
    const newTheme = new Theme();

    newTheme.title = ctx.request.body.title.trim();
    newTheme.published = ctx.request.body.published;

    if (ctx.request.body.image) {
      newTheme.img.data = ctx.request.body.image;
      newTheme.img.size = ctx.request.body.imageSize;
    }

    const theme = await Theme.findOne(
      {
        title:
            {
              $regex: newTheme.title,
              $options: 'i',
            },
      },
    ).lean();

    ctx.assert(!theme, 409, `Le thème '${newTheme.title}' existe déjà.`);
    ctx.body = await Theme.create(newTheme);
  },
);


export default router.routes();
