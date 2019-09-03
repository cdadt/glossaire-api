import jwt from 'koa-jwt';
import Router from 'koa-router';
import Multer from 'koa-multer';
import Word from '../models/word';
import config from '../services/config';
import Theme from '../models/theme';

const router = new Router();
// const upload = Multer({ dest: 'uploads/' });
const storage = Multer.memoryStorage();
const upload = Multer({ storage });

router.get('/', async (ctx) => {
  ctx.body = await Word.find().lean();
});

router.get('/last', async (ctx) => {
  ctx.body = await Word.findOne({
    'themes.published': 'true',
    validated: true,
    published: true,
  })
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
        validated: true,
        published: true,
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

router.patch('/published',
  async (ctx) => {
    const { wordId } = ctx.request.body.params;
    const { wordPub } = ctx.request.body.params;

    // On met à jour le thème lui-même
    ctx.body = await Word.updateOne(
      { _id: wordId }, { published: wordPub },
    ).lean();
  });

router.patch('/validate',
  async (ctx) => {
    const { wordId } = ctx.request.body.params;
    const { wordVali } = ctx.request.body.params;

    // On met à jour le thème lui-même
    ctx.body = await Word.updateOne(
      { _id: wordId }, { validated: wordVali },
    ).lean();
  });

router.post(
  '/',
  upload.single('image', 'png'),
  jwt({ secret: config.get('token:secret') }),
  async (ctx) => {
    const wordInfo = JSON.parse(ctx.req.body.wordInfo);
    const newWord = new Word();

    if (ctx.req.file) {
      newWord.img.data = ctx.req.file.buffer;
      newWord.img.contentType = ctx.req.file.mimetype;
      newWord.img.size = ctx.req.body.imageSize;
    }
    newWord.title = wordInfo.title;
    newWord.definition = wordInfo.definition;
    newWord.know_more = wordInfo.know_more;
    newWord.themes = wordInfo.themes;
    newWord.last_edit = wordInfo.last_edit;
    newWord.published = wordInfo.published;
    newWord.legend = wordInfo.legend;
    newWord.validated = wordInfo.validated;

    const word = await Word.findOne(
      {
        title:
          {
            $regex: wordInfo.title,
            $options: 'i',
          },
      },
    ).lean();

    ctx.assert(!word, 409, `Le mot '${wordInfo.title}' existe déjà.'`);
    ctx.body = await Word.create(newWord);
  },
);

router.delete('/',
  jwt({ secret: config.get('token:secret') }),
  async (ctx) => {
    const { wordId } = ctx.query;

    ctx.body = await Word.deleteOne({ _id: wordId }).lean();
  });

export default router.routes();
