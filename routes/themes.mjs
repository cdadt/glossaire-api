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
  ctx.body = await Theme.find().lean();
});

router.get('/search', async (ctx) => {
  const { title } = ctx.query;
  const { pubOption } = ctx.query;

  if (pubOption === '') {
    ctx.body = await Theme.find(
      {
        title:
          {
            $regex: title.trim(),
            $options: 'i',
          },
      },
    )
      .sort({ title: 1 })
      .lean();
  } else {
    ctx.body = await Theme.find(
      {
        title:
          {
            $regex: title.trim(),
            $options: 'i',
          },
        published: pubOption,
      },
    )
      .sort({ title: 1 })
      .lean();
  }
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

    ctx.body = await Theme.deleteOne({ _id: themeId }).lean();
  });

router.put('/',
  upload.single('image', 'png'),
  async (ctx) => {
    const theme = ctx.req.body;

    const newTheme = new Theme();

    newTheme._id = theme._id;
    newTheme.title = theme.title;
    newTheme.published = theme.published;

    if (ctx.req.file) {
      newTheme.img.data = ctx.req.file.buffer;
      newTheme.img.contentType = ctx.req.file.mimetype;
      newTheme.img.size = theme.imageSize;
    }

    ctx.body = await Theme.replaceOne(
      { _id: theme._id }, newTheme,
    ).lean();
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
    ).lean();
  });

router.post(
  '/',
  upload.single('image', 'png'),
  jwt({ secret: config.get('token:secret') }),
  async (ctx) => {
    const newTheme = new Theme();

    newTheme.title = ctx.req.body.title.trim();
    newTheme.published = ctx.req.body.published;

    if (ctx.req.file) {
      newTheme.img.data = ctx.req.file.buffer;
      newTheme.img.contentType = ctx.req.file.mimetype;
      newTheme.img.size = ctx.req.body.imageSize;
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
