import https from 'https';
import nodefs from 'fs';
import express from 'express';
import expressWs from 'express-ws';

const options = {
    key: nodefs.readFileSync(process.cwd() + '/../key/server.key'),
    cert: nodefs.readFileSync(process.cwd() + '/../key/server.crt')
};

const app = express();
const server = https.createServer(options, app);
expressWs(app, server);

app.use(function (req, res, next) {
  console.log('middleware');
  req.testing = 'testing';
  return next();
});

app.get('/', function(req, res, next){
  console.log('get route', req.testing);
  res.end();
});

app.ws('/', function(ws, req) {
  ws.on('message', function(msg) {
    console.log(msg);
  });
  console.log('socket', req.testing);
});

server.listen(3000);