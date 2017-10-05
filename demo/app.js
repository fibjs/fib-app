const http = require('http');
const App = require('../');

var app = App('sqlite:test.db', {});
app.def(require('./defs/pet'));
app.def(require('./defs/person'));

var svr = new http.Server(8080, {
    '/1.0': app.handler
});
svr.run(() => {});