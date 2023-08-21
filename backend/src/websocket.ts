import ws from 'ws';

const wsServer = new ws.Server({ noServer: true });

export default wsServer;