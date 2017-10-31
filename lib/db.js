const Pool = require('fib-pool');
const orm = require('fib-orm');
const util = require('util');
const graphql = require('./classes/graphql');

var slice = Array.prototype.slice;

module.exports = (url, opts) => {
    var defs = [];
    opts = opts || {};

    var db = Pool({
        create: () => {
            const db = orm.connectSync(url);
            var _define = db.define;

            db.define = function (name, properties, opts) {
                properties = util.clone(properties);

                properties.createAt = Date;
                properties.updateAt = Date;
                properties.ACL = Object;

                var m = _define.call(this, name, properties, opts);
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

            db.syncSync();
            return graphql(db);
        },
        maxsize: opts.maxsize,
        timeout: opts.timeout,
        retry: opts.retry
    });

    db.use = def => defs = defs.concat(def);

    return db;
};