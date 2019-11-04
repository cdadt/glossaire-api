import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import './helpers/cron';
import config from './services/config';
import mongooseConnection from './services/mongoose';
import routes from './routes/index';

mongooseConnection(config.get('mongodb:url'));

const app = new Koa();
app.use(cors());
app.use(bodyParser({
  jsonLimit: '50mb',
}));
app.use(routes);
app.listen(2223);
