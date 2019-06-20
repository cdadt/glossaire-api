import Router from 'koa-router';
import Word from '../models/word';

const router = new Router();

router.get('/', async (ctx) => {
  ctx.body = await Word.find()
    .sort({ last_edit: -1 })
    .limit(1)
    .lean();
});

router.get('/:title', async (ctx) => {
  const { title } = ctx.params;
  ctx.body = await Word.find({ title }).lean();
});

router.get('/search', async (ctx) => {
  const { title } = ctx.query;
  ctx.body = await Word.find(
    {
      title:
        {
          $regex: title.trim(),
          $option: 'i',
        },
    },
  )
    .limit(4)
    .lean();
});

router.post('/add', async (ctx) => {
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
});

export default router.routes();
