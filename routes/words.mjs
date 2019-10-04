import jwt from 'koa-jwt';
import Router from 'koa-router';
import Multer from 'koa-multer';
import Word from '../models/word';
import config from '../services/config';
import User from '../models/user';

const router = new Router();
const storage = Multer.memoryStorage();
const upload = Multer({ storage });

router.get('/', async (ctx) => {
  ctx.body = await Word.find().lean();
});

router.get('/last', async (ctx) => {
  ctx.body = await Word.findOne({
    'themes.published': true,
    validated: true,
    published: true,
  })
    .sort({ last_edit: -1 })
    .lean();
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
    result.validated = true;
    result.published = pubOption;
    result['themes.published'] = true;
  }

  ctx.body = await Word.find(result)
    .sort({ title: 1 })
    .lean();
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

router.get('/count-waiting', async (ctx) => {
  ctx.body = await Word.find().or([{ validated: 'false' }, { published: 'false' }]).countDocuments();
});

router.get('/get-waiting', async (ctx) => {
  ctx.body = await Word.find().or([{ validated: 'false' }, { published: 'false' }]);
});

router.get('/:id', async (ctx) => {
  const { id } = ctx.params;
  const word = await Word.findById(id).lean();
  // if (!word.validated || !word.published) {
  //   const wordSimplified = new Word();
  //   wordSimplified._id = word._id;
  //   wordSimplified.title = word.title;
  //   wordSimplified.published = word.published;
  //   wordSimplified.validated = word.validated;
  //   ctx.body = wordSimplified;
  // } else {
  //   ctx.body = word;
  // }
  ctx.body = word;
});

router.patch('/published',
  async (ctx) => {
    const { wordId } = ctx.request.body.params;
    const { wordPub } = ctx.request.body.params;

    await User.updateMany({ 'bookmark._id': wordId }, { $set: { 'bookmark.$.published': wordPub } });

    // On met à jour le thème lui-même
    ctx.body = await Word.updateOne(
      { _id: wordId }, { published: wordPub },
    ).lean();
  });

router.put('/edit',
  upload.single('image'),
  async (ctx) => {
    const { wordId } = ctx.request.body;
    const { elemToEdit } = ctx.request.body;
    const { elemToEditValue } = ctx.request.body;

    // On met à jour le titre en vérifiant qu'il n'est déjà pas utilisé
    if (elemToEdit === 'title') {
      const word = await Word.findOne(
        {
          title:
            {
              $regex: elemToEditValue,
              $options: 'i',
            },
        },
      ).lean();

      if (word && word._id.toString() !== wordId) {
        ctx.assert(!word, 409, `Le mot '${elemToEditValue}' existe déjà.'`);
      }

      ctx.body = await Word.updateOne(
        { _id: wordId }, { title: elemToEditValue, last_edit: Date.now() },
      ).lean();
    }

    // OU on met à jour les éléments qui n'ont pas de particularité
    if (elemToEdit !== 'image' && elemToEdit !== 'title') {
      const modifierObject = {
        last_edit: Date.now(),
      };
      modifierObject[elemToEdit] = elemToEditValue;
      ctx.body = await Word.updateOne(
        { _id: wordId }, modifierObject,
      ).lean();
    }

    // OU on met à jour l'image (si l'élément à modifier est une image et qu'il y a un fichier)
    if (ctx.request.body.image && elemToEdit === 'image') {
      ctx.body = await Word.updateOne(
        { _id: wordId }, {
          'img.data': ctx.request.body.image,
          'img.size': ctx.request.body.imageSize,
          last_edit: Date.now(),
        },
      ).lean();
    }

    // OU on supprime l'image (si l'élément à modifier est une image et qu'il n'y a pas de fichier)
    if (!ctx.request.body.image && elemToEdit === 'image') {
      ctx.body = await Word.updateOne(
        { _id: wordId }, { $unset: { img: 1, legend: 1 }, last_edit: Date.now() },
      ).lean();
    }
  });

router.patch('/validate',
  async (ctx) => {
    const { wordId } = ctx.request.body.params;
    const { wordVali } = ctx.request.body.params;

    await User.updateMany({ 'bookmark._id': wordId }, { $set: { 'bookmark.$.validated': wordVali } });

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
    const { wordInfo } = ctx.request.body;
    const newWord = new Word();

    if (wordInfo.image) {
      newWord.img.data = wordInfo.image;
      // newWord.img.contentType = ctx.req.file.mimetype;
      newWord.img.size = wordInfo.imageSize;
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

    await User.updateMany(
      {},
      { $pull: { bookmark: { _id: wordId } } },
    ).lean();

    ctx.body = await Word.deleteOne({ _id: wordId }).lean();
  });

export default router.routes();
