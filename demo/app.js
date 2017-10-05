const http = require('http');
const util = require('util')
const Session = require('fib-session')

var session = new Session(new util.LruCache(20000), {
    timeout: 60 * 1000
});

const App = require('../');

var app = App('sqlite:test.db', {});
app.def(require('./defs/pet'));
app.def(require('./defs/person'));

var svr = new http.Server(8080, [
    session.cookie_filter,
    {
        '/1.0': app.handler
    }
]);
svr.run(() => {});