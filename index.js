const classes = require('./lib/classes');
const Pool = require('fib-pool');
const orm = require('fib-orm');

module.exports = (url, opts) => {
    var defs = [];
    opts = opts || {};

    const pool = Pool({
        create: () => {
            const db = orm.connectSync(url);

            defs.forEach(def => def(db));
            db.syncSync();

            return db;
        },
        maxsize: opts.maxsize,
        timeout: opts.timeout,
        retry: opts.retry
    });

    return {
        def: def => defs.push(def),
        handler: {
            '/classes': classes(pool)
        }
    };
};