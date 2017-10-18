const Pool = require('fib-pool');
const orm = require('fib-orm');
const util = require('util');

module.exports = (url, opts) => {
    var defs = [];
    opts = opts || {};

    var db = Pool({
        create: () => {
            const db = orm.connectSync(url);
            var _define = db.define;

            db.define = function (name, properties, opts) {
                properties = util.clone(properties);

                if (properties.createAt === undefined)
                    properties.createAt = Date;
                if (properties.updateAt === undefined)
                    properties.updateAt = Date;
                if (properties.ACL === undefined)
                    properties.ACL = Object;

                var m = _define.call(this, name, properties, opts);

                var _beforeCreate;
                var _beforeSave;

                if (opts !== undefined) {
                    if (opts.hooks !== undefined) {
                        _beforeCreate = opts.hooks.beforeCreate;
                        _beforeSave = opts.hooks.beforeSave;
                    }

                    m.functions = opts.functions;
                    m.ACL = opts.ACL;
                }

                if (m.ACL === undefined)
                    m.ACL = {
                        "*": {
                            "*": true
                        }
                    };

                m.beforeCreate(function (next) {
                    this.createAt = new Date();

                    if (_beforeCreate) {
                        if (_beforeCreate.length > 0)
                            return _beforeCreate(next);
                        _beforeCreate();
                    }

                    next();
                });

                m.beforeSave(function (next) {
                    delete this.createAt;
                    this.updateAt = new Date();

                    if (_beforeSave) {
                        if (_beforeSave.length > 0)
                            return _beforeSave(next);
                        _beforeSave();
                    }

                    next();
                });

                return m;
            }

            defs.forEach(def => def(db));
            db.syncSync();

            return db;
        },
        maxsize: opts.maxsize,
        timeout: opts.timeout,
        retry: opts.retry
    });

    db.use = def => defs = defs.concat(def);

    return db;
};