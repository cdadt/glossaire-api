import Router from 'koa-router';
import Theme from '../models/theme';
import Word from '../models/word';

const router = new Router();

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


export default router.routes();
