import orm = require('@fxjs/orm');

import uuid = require('uuid');
import coroutine = require('coroutine');

import Pool = require('fib-pool');

import graphql = require('./http/graphql');
import App from './app';

import ormUtils = require('./utils/orm')

const slice = Array.prototype.slice;

export = (app: App, connStr: string, opts: FibApp.FibAppDbSetupOpts): FibApp.AppDBPool<FibApp.FibAppORM> => {
    var defs = [];
    opts = opts || {};
    var sync_lock = new coroutine.Lock();
    var syned = false;
    var use_uuid = opts.uuid;

    var db: FibApp.AppDBPool<FibApp.FibAppORM> = Pool({
        create: function () {
            var ormInstance: FibApp.FibAppORM = orm.connectSync(connStr) as FibApp.FibAppORM;
            ormUtils.setOrmDefaultSettings(ormInstance)

            var spec_keys = {
                createdAt: ormUtils.getCreatedAtField(ormInstance.settings),
                updatedAt: ormUtils.getUpdatedAtField(ormInstance.settings),
            }
            
            var _define = ormInstance.define;
            var cls_id = 1;

            ormInstance.app = app;
            ormInstance.define = function (name: string, properties: OrigORMDefProperties, orm_define_opts: FibAppOrmModelDefOptions) {
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

                if (properties[spec_keys.createdAt] === undefined)
                    properties[spec_keys.createdAt] = { type: 'date' };
                properties[spec_keys.createdAt].time = true; //change the field type to datetime in MySQL

                if (properties[spec_keys.updatedAt] === undefined)
                    properties[spec_keys.updatedAt] = { type: 'date' };
                properties[spec_keys.updatedAt].time = true; //change the field type to datetime in MySQL

                var m: FibAppORMModel = _define.call(this, name, properties, orm_define_opts);
                m.cid = cls_id++;

                Object.defineProperty(m, 'model_name', {
                    value: name
                });

                var _beforeCreate;
                var _beforeSave;

                orm_define_opts = orm_define_opts || {}
                if (orm_define_opts.hooks !== undefined) {
                    _beforeCreate = orm_define_opts.hooks.beforeCreate;
                    _beforeSave = orm_define_opts.hooks.beforeSave;
                }
                m.ACL = orm_define_opts.ACL;
                m.OACL = orm_define_opts.OACL;

                m.functions = orm_define_opts.functions || {};
                m.viewFunctions = orm_define_opts.viewFunctions || {};
                m.viewServices = orm_define_opts.viewServices || {};

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
                    this[spec_keys.updatedAt] = this[spec_keys.createdAt] = new Date();

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
                        delete this[spec_keys.createdAt];
                        this[spec_keys.updatedAt] = new Date();
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

            defs.forEach(def => def(ormInstance));

            sync_lock.acquire();
            try {
                if (!syned) {
                    ormInstance.syncSync();
                    syned = true;
                }
            } finally {
                sync_lock.release();
            }

            ormInstance = graphql(app, ormInstance);

            return ormInstance;
        },
        maxsize: opts.maxsize,
        timeout: opts.timeout,
        retry: opts.retry
    });

    db.app = app;
    db.use = (def: FibAppOrmDefineFn|FibAppOrmDefineFn[]) => defs = defs.concat(def);

    return db;
};
