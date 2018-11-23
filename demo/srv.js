const fs = require('fs');
const path = require('path');
const app = require('.').getApp();

const detectPort = require('@fibjs/detect-port');

fs.writeTextFile(path.join(__dirname, 'diagram.svg'), app.diagram());

const port = detectPort(process.env.FIBAPP_PORT);

const { mountAppToSrv } = require('./')
const { server } = mountAppToSrv(app, { port, appPath: '/1.0/app' })

server.run(() => void 0);
console.log(`server started on listening ${port}`)

