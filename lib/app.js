const mq = require('mq');
const classes = require('./classes');
const Db = require('./db');
const diagram = require('./utils/diagram');

class App extends mq.Routing {
    constructor(url, opts) {
        super();

        this.db = Db(this, url, opts);
        classes.bind(this);
        this.diagram = diagram;
    }
};

module.exports = App;