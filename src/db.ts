import orm = require('@fxjs/orm');

import uuid = require('uuid');
import coroutine = require('coroutine');

import Pool = require('fib-pool');

import graphql = require('./http/graphql');
import App from './app';

import orm_utils = require('./utils/orm')
import orm_plugins = require('./orm_plugins')

const slice = Array.prototype.slice;

export = (app: App, connStr: string, opts: FibApp.FibAppDbSetupOpts): FibApp.AppDBPool<FibApp.FibAppORM> => {
    var defs = [];
    opts = opts || {};
    var sync_lock = new coroutine.Lock();
    var syned = false;
    var use_uuid = opts.uuid;

    var ormPool: FibApp.AppDBPool<FibApp.FibAppORM> = Pool({
        create: function () {
            var ormInstance: FibApp.FibAppORM = orm.connectSync(connStr) as FibApp.FibAppORM;
            orm_utils.set_orm_default_settings(ormInstance)
            
            ormInstance.use(orm_plugins.app, {app})
            
            ormInstance.use(orm_plugins.timestamp, {
                createdProperty: orm_utils.get_field_createdat(ormInstance.settings),
                updatedProperty: orm_utils.get_field_updatedat(ormInstance.settings),
            })

            ormInstance.use(orm_plugins.uuid, use_uuid)

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

    ormPool.app = app;
    ormPool.use = (def: FibAppOrmDefineFn|FibAppOrmDefineFn[]) => defs = defs.concat(def);

    return ormPool;
};
