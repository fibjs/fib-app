/// <reference path="../@types/app.d.ts" />
const mq = require("mq");
const classes = require("./classes");
const db_1 = require("./db");
const diagram_1 = require("./utils/diagram");
class App extends mq.Routing {
    constructor(url, opts) {
        super();
        this.db = db_1.default(this, url, opts);
        classes.bind(this);
        this.diagram = diagram_1.default;
    }
}
;
module.exports = App;
module.exports = App;
