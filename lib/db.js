const Pool = require('fib-pool');
const orm = require('fib-orm');
const util = require('util');
const graphql = require('./classes/graphql');
const coroutine = require('coroutine');
const uuid = require('uuid');

var slice = Array.prototype.slice;

module.exports = (app, url, opts) => {
    var defs = [];
    opts = opts || {};
    var sync_lock = new coroutine.Lock();
    var syned = false;
    var use_uuid = opts.uuid;

    var db = Pool({
        create: () => {
            const db = orm.connectSync(url);
            var _define = db.define;
            var cls_id = 1;

            db.define = function (name, properties, opts) {
                var old_properties = properties;

                if (use_uuid)
                    properties = {
                        id: {
                            type: 'text',
                            key: true,
                            index: true
                        }
                    };

                for (var k in old_properties)
                    if (k !== 'id')
                        properties[k] = old_properties[k];

                if (properties.createdAt === undefined)
                    properties.createdAt = {};
                properties.createdAt.type = 'date';

                if (properties.updatedAt === undefined)
                    properties.updatedAt = {};
                properties.updatedAt.type = 'date';

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
                    m.OACL = opts.OACL;
                }

                if (m.ACL === undefined)
                    m.ACL = {
                        "*": {
                            "*": true,
                            "extends": {
                                "*": {
                                    "*": true
                                }
                            }
                        }
                    };

                m.beforeCreate(function (next) {
                    this.updatedAt = this.createdAt = new Date();

                    if (use_uuid)
                        this.id = uuid.snowflake().hex();

                    if (_beforeCreate) {
                        if (_beforeCreate.length > 0)
                            return _beforeCreate.call(this, next);
                        _beforeCreate.call(this);
                    }

                    next();
                });

                m.beforeSave(function (next) {
                    if (this.__opts.changes.length > 0) {
                        delete this.createdAt;
                        this.updatedAt = new Date();
                    }

                    if (_beforeSave) {
                        if (_beforeSave.length > 0)
                            return _beforeSave.call(this, next);
                        _beforeSave.call(this);
                    }

                    next();
                });

                m.extends = {};

                var _hasOne = m.hasOne;
                m.hasOne = function (name, model, opts) {
                    m.extends[name] = {
                        type: 'hasOne',
                        model: model
                    };

                    if (opts !== undefined && opts.reversed)
                        m.extends[name].reversed = true;

                    if (opts !== undefined && opts.reverse)
                        m.extends[name].reverse = true;

                    return _hasOne.apply(this, slice.call(arguments));
                }

                var _hasMany = m.hasMany;
                m.hasMany = function (name, model) {
                    m.extends[name] = {
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

            return graphql(app, db);
        },
        maxsize: opts.maxsize,
        timeout: opts.timeout,
        retry: opts.retry
    });

    db.use = def => defs = defs.concat(def);

    return db;
};