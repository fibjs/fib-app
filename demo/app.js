const http = require('http');
const util = require('util')
const Session = require('fib-session')
const App = require('../');

var app = new App('sqlite:test.db', {});
app.db.use(require('./defs'));

var session = new Session(new util.LruCache(20000), {
    timeout: 60 * 1000
});

var svr = new http.Server(8080, [
    session.cookie_filter,
    {
        '/1.0': app.handler,
        '/set_session': req => {
            var data = req.json();
            req.session.id = data.id;
            req.session.roles = data.roles;
        }
    }
]);
svr.run(() => {});