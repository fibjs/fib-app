const classes = require('./classes');
const Pool = require('fib-pool');
const orm = require('fib-orm');

function _beforeCreate() {
    this.createAt = new Date();
}

function _beforeSave() {
    delete this.createAt;
    this.updateAt = new Date();
}

module.exports = (url, opts) => {
    var defs = [];
    opts = opts || {};

    const pool = Pool({
        create: () => {
            const db = orm.connectSync(url);

            defs.forEach(def => def(db));

            for (var name in db.models) {
                var m = db.models[name];

                if (m.properties.createAt !== undefined)
                    m.beforeCreate(_beforeCreate);

                if (m.properties.updateAt !== undefined)
                    m.beforeSave(_beforeSave);
            }

            db.syncSync();

            return db;
        },
        maxsize: opts.maxsize,
        timeout: opts.timeout,
        retry: opts.retry
    });

    return {
        def: def => defs = defs.concat(def),
        handler: {
            '/classes': classes(pool)
        }
    };
};