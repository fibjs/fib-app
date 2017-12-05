const classes = require('./classes');
const Db = require('./db');
const push = require('./push');
const diagram = require('./utils/diagram');

module.exports = function (url, opts) {
    this.db = Db(this, url, opts);
    this.handler = classes(this.db);
    this.diagram = diagram;
};

module.exports.push = push;