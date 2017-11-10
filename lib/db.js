const Pool = require('fib-pool');
const orm = require('fib-orm');
const util = require('util');
const graphql = require('./classes/graphql');
const coroutine = require('coroutine');

var slice = Array.prototype.slice;

module.exports = (url, opts) => {
    var defs = [];
    opts = opts || {};
    var sync_lock = new coroutine.Lock();
    var syned = false;

    var db = Pool({
        create: () => {
            const db = orm.connectSync(url);
            var _define = db.define;
            var cls_id = 1;

            db.define = function (name, properties, opts) {
                properties = util.clone(properties);

                properties.createAt = Date;
                properties.updateAt = Date;
                properties.ACL = Object;

                var m = _define.call(this, name, properties, opts);
                m.cid = cls_id++;

                Object.defineProperty(m, 'model_name', {
                    value: name
                });

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
                    this.updateAt = this.createAt = new Date();

                    if (_beforeCreate) {
                        if (_beforeCreate.length > 0)
                            return _beforeCreate.call(this, next);
                        _beforeCreate.call(this);
                    }

                    next();
                });

                m.beforeSave(function (next) {
                    delete this.createAt;
                    this.updateAt = new Date();

                    if (_beforeSave) {
                        if (_beforeSave.length > 0)
                            return _beforeSave.call(this, next);
                        _beforeSave.call(this);
                    }

                    next();
                });

                m.relations = {};

                var _hasOne = m.hasOne;
                m.hasOne = function (name, model) {
                    m.relations[name] = {
                        type: 'hasOne',
                        model: model
                    };

                    return _hasOne.apply(this, slice.call(arguments));
                }

                var _hasMany = m.hasMany;
                m.hasMany = function (name, model) {
                    m.relations[name] = {
                        type: 'hasMany',
                        model: model
                    };

                    return _hasMany.apply(this, slice.call(arguments));
                }

                return m;
            }

            defs.forEach(def => def(db));

            sync_lock.acquire();
            try {
                if (!syned) {
                    db.syncSync();
                    syned = true;
                }
            } finally {
                sync_lock.release();
            }

            return graphql(db);
        },
        maxsize: opts.maxsize,
        timeout: opts.timeout,
        retry: opts.retry
    });

    db.use = def => defs = defs.concat(def);

    return db;
};