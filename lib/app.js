const classes = require('./classes');
const Db = require('./db');

module.exports = function (url, opts) {
    var defs = [];
    const db = Db(url, opts);

    this.db = db;
    this.handler = classes(db);
};