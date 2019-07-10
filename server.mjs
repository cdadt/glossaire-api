import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
// import { Process as process } from 'node';
import config from './services/config';
import mongooseConnection from './services/mongoose';
import routes from './routes/index';

mongooseConnection(config.get('mongodb:url'));

const app = new Koa();
app.use(cors());
app.use(bodyParser());
app.use(routes);
app.listen(config.get('port'), config.get('ip'));
