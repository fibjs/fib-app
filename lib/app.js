/// <reference path="../@types/app.d.ts" />
const mq = require("mq");
const classes = require("./classes");
const setupDb = require("./db");
const diagram = require("./utils/diagram");
class App extends mq.Routing {
    constructor(url, opts) {
        super();
        this.graphqlTypeMap = opts.graphqlTypeMap || {};
        this.dbPool = this.db = setupDb(this, url, opts);
        classes.bind(this);
        this.diagram = diagram;
    }
}
module.exports = App;
