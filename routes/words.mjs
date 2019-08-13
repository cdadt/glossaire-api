import jwt from 'koa-jwt';
import Router from 'koa-router';
import Word from '../models/word';
import config from '../services/config';

const router = new Router();

router.get('/', async (ctx) => {
  ctx.body = await Word.find().lean();
});

router.get('/last', async (ctx) => {
  ctx.body = await Word.findOne({ 'themes.published': 'true' })
    .sort({ last_edit: -1 })
    .lean();
});

router.get('/search', async (ctx) => {
  const { title } = ctx.query;
  const { pubOption } = ctx.query;

  if (pubOption === '') {
    ctx.body = await Word.find(
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
    ctx.body = await Word.find(
      {
        title:
          {
            $regex: title.trim(),
            $options: 'i',
          },
        'themes.published': pubOption,
      },
    )
      .sort({ title: 1 })
      .lean();
  }
});

router.get('/search-exact', async (ctx) => {
  const { title } = ctx.query;
  ctx.body = await Word.find(
    {
      title,
    },
  )
    .lean();
});

router.get('/:id', async (ctx) => {
  const { id } = ctx.params;
  ctx.body = await Word.findById(id).lean();
});

router.post(
  '/',
  jwt({ secret: config.get('token:secret') }),
  async (ctx) => {
    const { request: { body } } = ctx;
    const wordTitle = body.title.trim();
    const word = await Word.findOne(
      {
        title:
          {
            $regex: wordTitle,
            $options: 'i',
          },
      },
    ).lean();

    ctx.assert(!word, 409, `Le mot '${wordTitle}' existe déjà.'`);
    ctx.body = await Word.create(body);
  },
);

export default router.routes();
