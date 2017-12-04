const classes = require('./classes');
const Db = require('./db');
const push = require('./push');
const diagram = require('./utils/diagram');

module.exports = function (url, opts) {
    var defs = [];
    const db = Db(url, opts);

    this.db = db;
    this.handler = classes(db);
    this.diagram = diagram;
};

module.exports.push = push;