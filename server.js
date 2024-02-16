import express from 'express';
import startServer from './libs/boot';
import initializeRoutes from './routes';
import injectMiddleware from './libs/middlewares';

const server = express();

injectMiddleware(server);
initializeRoutes(server);
startServer(server);

export default server;
