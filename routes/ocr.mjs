import Router from 'koa-router';
import Tesseract from 'tesseract.js';
import Multer from 'koa-multer';

const router = new Router();
// const upload = Multer({ dest: 'uploads/' });
const storage = Multer.memoryStorage();
const upload = Multer({ storage });


router.post('/',
  upload.single('file'),
  async (ctx) => {
    const { TesseractWorker } = Tesseract;
    const worker = new TesseractWorker();

    await worker.recognize(ctx.req.file.buffer, 'fra')
      .progress((progress) => {
        console.log(progress);
      })
      .then((res) => {
        ctx.body = { textResponse: res.text };
      });
  });

export default router.routes();
