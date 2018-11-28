import orm = require('@fxjs/orm');

import uuid = require('uuid');
import coroutine = require('coroutine');

import Pool = require('fib-pool');

import graphql = require('./http/graphql');
import App from './app';

const slice = Array.prototype.slice;

export = (app: App, connStr: string, opts: FibApp.FibAppDbSetupOpts): FibApp.AppDBPool<FibApp.FibAppDb> => {
    var defs = [];
    opts = opts || {};
    var sync_lock = new coroutine.Lock();
    var syned = false;
    var use_uuid = opts.uuid;

    var db: FibApp.AppDBPool<FibApp.FibAppDb> = Pool({
        create: function () {
            var odb: FibAppDb = orm.connectSync(connStr) as FibAppDb;
            var _define = odb.define;
            var cls_id = 1;

            odb.app = app;
            odb.define = function (name: string, properties: OrigORMDefProperties, orm_define_opts: FibAppOrmModelDefOptions): FibAppORMModel {
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
                    properties.createdAt = { type: 'date' };
                properties.createdAt.time = true; //change the field type to datetime in MySQL

                if (properties.updatedAt === undefined)
                    properties.updatedAt = { type: 'date' };
                properties.updatedAt.time = true; //change the field type to datetime in MySQL

                var m: FibAppORMModel = _define.call(this, name, properties, orm_define_opts);
                m.cid = cls_id++;

                Object.defineProperty(m, 'model_name', {
                    value: name
                });

                var _beforeCreate;
                var _beforeSave;

                if (orm_define_opts !== undefined) {
                    if (orm_define_opts.hooks !== undefined) {
                        _beforeCreate = orm_define_opts.hooks.beforeCreate;
                        _beforeSave = orm_define_opts.hooks.beforeSave;
                    }

                    m.functions = orm_define_opts.functions;
                    m.viewFunctions = orm_define_opts.viewFunctions;
                    m.ACL = orm_define_opts.ACL;
                    m.OACL = orm_define_opts.OACL;
                }

                m.functions = m.functions || {};
                m.viewFunctions = m.viewFunctions || {};

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
                
                var { no_graphql = false } = orm_define_opts || {}
                m.no_graphql = no_graphql
                
                m.extends = {};

                var _hasOne = m.hasOne;
                m.hasOne = function (name, model, orm_hasOne_opts) {
                    m.extends[name] = {
                        type: 'hasOne',
                        model: model,
                        // it's meaningless, just keep same format with `hasMany`
                        extraProperties: {}
                    };

                    if (orm_hasOne_opts !== undefined && orm_hasOne_opts.reversed)
                        m.extends[name].reversed = true;

                    return _hasOne.apply(this, slice.call(arguments));
                }

                var _hasMany = m.hasMany;
                m.hasMany = function (name, model) {
                    var extraProperties = {}, orm_hasMany_opts = {};
                    if (arguments.length >= 4) {
                        extraProperties = arguments[2]
                        orm_hasMany_opts = arguments[3]
                    } else {
                        extraProperties = {}
                        orm_hasMany_opts = arguments[2]
                    }
                    m.extends[name] = {
                        type: 'hasMany',
                        model: model,
                        extraProperties: extraProperties
                    } as FibAppFixedOrmExtendModelWrapper;

                    if (orm_hasMany_opts && orm_hasMany_opts.reversed)
                        m.extends[name].reversed = true;

                    return _hasMany.apply(this, slice.call(arguments));
                }

                return m;
            }

            defs.forEach(def => def(odb));

            sync_lock.acquire();
            try {
                if (!syned) {
                    odb.syncSync();
                    syned = true;
                }
            } finally {
                sync_lock.release();
            }

            odb = graphql(app, odb);

            return odb;
        },
        maxsize: opts.maxsize,
        timeout: opts.timeout,
        retry: opts.retry
    });

    db.app = app;
    db.use = (def: FibAppOrmDefineFn|FibAppOrmDefineFn[]) => defs = defs.concat(def);

    return db;
};
