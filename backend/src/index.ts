import express from 'express';
import cookieParser from 'cookie-parser';
import { logger } from './middleware/logger';
import feedsRouter from './routes/feeds';
import routesRouter from './routes/routes';
import wsServer from './websocket';

const app = express();

// wsServer.on('connection', (socket, req) => {
//     console.log(socket.protocol)
//     socket.on('message', message => console.log(message));
// });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.use(logger);
app.use('/feeds', feedsRouter);

app.listen(5000, () => {
    console.log('Server up!');
}).on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
    });
});