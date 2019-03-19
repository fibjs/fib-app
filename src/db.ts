import orm = require('@fxjs/orm');

import coroutine = require('coroutine');

import Pool = require('fib-pool');

import graphql = require('./http/graphql');

import orm_utils = require('./utils/orm')
import orm_plugins = require('./orm_plugins')

export = (app: FibApp.FibAppClass, connStr: string, opts: FibApp.FibAppDbSetupOpts): FibApp.AppORMPool<FibApp.FibAppORM> => {
    var defs = [];
    opts = opts || {};
    var sync_lock = new coroutine.Lock();
    var syned = false;
    var use_uuid = opts.uuid;

    var ormPool = Pool({
        create: function (): FibApp.FibAppORM {
            var ormInstance: FibApp.FibAppORM = orm.connectSync(connStr) as FibApp.FibAppORM;
            orm_utils.set_orm_default_settings(ormInstance)
            
            ormInstance.use(orm_plugins.app, {app})
            
            ormInstance.use(orm_plugins.timestamp, {
                createdProperty: orm_utils.get_field_createdat(ormInstance.settings),
                updatedProperty: orm_utils.get_field_updatedat(ormInstance.settings),
            })

            ormInstance.use(orm_plugins.association)

            ormInstance.use(orm_plugins.uuid, { enable: use_uuid })

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
    }) as FibApp.AppORMPool<FibApp.FibAppORM>;

    ormPool.app = app;
    ormPool.use = (def: FibApp.FibAppOrmDefineFn | FibApp.FibAppOrmDefineFn[]) => defs = defs.concat(def);

    return ormPool;
};
