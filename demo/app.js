const http = require('http');
const ws = require('ws');
const fs = require('fs');
const util = require('util');
const path = require('path');
const Session = require('fib-session')
const App = require('../');
const push = App.push;

var app = new App('sqlite:test.db', {
    uuid: true
});
app.db.use(require('./defs'));

fs.writeTextFile(path.join(__dirname, 'diagram.svg'), app.diagram());

var session = new Session(new util.LruCache(20000), {
    timeout: 60 * 1000
});

var svr = new http.Server(8080, [
    session.cookie_filter,
    {
        '/1.0/app': app,
        '/set_session': req => {
            var data = req.json();
            req.session.id = data.id;
            req.session.roles = data.roles;
        },
        '/push': ws.upgrade((conn, req) => {
            conn.onmessage = msg => {
                var cmd = msg.json();
                switch (cmd.act) {
                    case 'on':
                        push.on(cmd.ch, conn, cmd.timestamp);
                        break;
                    case 'off':
                        push.off(cmd.ch, conn);
                        break;
                }
            };
        })
    }
]);
svr.run(() => {});