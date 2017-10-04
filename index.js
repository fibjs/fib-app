const classes = require('./lib/classes');
const Pool = require('fib-pool');
const orm = require('fib-orm');

exports.server = (url, define) => {
    const pool = Pool(() => {
        const db = orm.connectSync(url);
        define(db);
        return db;
    }, 10, 30 * 1000);

    return {
        '/classes': classes.api(pool)
    };
};