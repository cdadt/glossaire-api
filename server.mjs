import Koa from 'koa';
import cors from '@koa/cors';
import config from './services/config';
import mongooseConnection from './services/mongoose';
import routes from './routes/index';

mongooseConnection(config.get('mongodb:url'));

const app = new Koa();
app.use(cors());
app.use(routes);
app.listen(2223);
