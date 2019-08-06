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
});

router.get('/:id', async (ctx) => {
  const { id } = ctx.params;
  ctx.body = await Theme.findById(id).lean();
});

router.get('/:id/words', async (ctx) => {
  const { id } = ctx.params;
  ctx.body = await Word.find({ 'themes._id': id }).lean();
});

router.post(
  '/',
  upload.single('image', 'png'),
  jwt({ secret: config.get('token:secret') }),
  async (ctx) => {
    const newTheme = new Theme();

    const themeTitle = ctx.req.body.title.trim();

    newTheme.title = themeTitle;

    if (ctx.req.file) {
      newTheme.img.data = ctx.req.file.buffer;
      newTheme.img.contentType = ctx.req.file.mimetype;
    }

    const theme = await Theme.findOne(
      {
        title:
            {
              $regex: themeTitle,
              $options: 'i',
            },
      },
    ).lean();

    ctx.assert(!theme, 409, `Le thème '${themeTitle}' existe déjà.`);
    ctx.body = await Theme.create(newTheme);
  },
);


export default router.routes();
