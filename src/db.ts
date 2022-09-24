import orm = require('@fxjs/orm');

import coroutine = require('coroutine');

import Pool = require('fib-pool');

import graphql = require('./http/graphql');

import orm_utils = require('./utils/orm')
import orm_plugins = require('./orm_plugins')
import { FibApp } from './Typo/app';

export = (app: FibApp.FibAppClass, connStr: string, opts: FibApp.FibAppDbSetupOpts): FibApp.AppORMPool<FibApp.FibAppORM> => {
    let defs: FibApp.FibAppOrmDefineFn[] = [];
    opts = opts || {};
    const sync_info = {
        lock: new coroutine.Lock(),
        finished: false
    }
    const use_uuid = opts.uuid;

    const pool = <FibApp.AppORMPool<FibApp.FibAppORM>>Pool({
        create: function (): FibApp.FibAppORM {
            const ormInstance = <FibApp.FibAppORM>orm.connectSync(connStr);
            orm_utils.set_orm_default_settings(ormInstance)
            
            /**
             * @notice must setup firstly
             */
            ormInstance.use(orm_plugins.app, {app})
            
            ormInstance.use(orm_plugins.timestamp, {
                createdPropertyName: orm_utils.get_field_createdat(ormInstance.settings),
                updatedPropertyName: orm_utils.get_field_updatedat(ormInstance.settings),
            })

            ormInstance.use(orm_plugins.association)

            ormInstance.use(orm_plugins.uuid, { enable: use_uuid })

            defs.forEach(def => def(ormInstance));

            sync_info.lock.acquire();
            try {
                if (!sync_info.finished) {
                    ormInstance.syncSync();
                    sync_info.finished = true;
                }
            } finally {
                sync_info.lock.release();
            }

            // only init graphql when models is not empty
            if (ormInstance.models && Object.keys(ormInstance.models).length)
                graphql(app, ormInstance);

            return ormInstance;
        },
        maxsize: opts.maxsize,
        timeout: opts.timeout,
        retry: opts.retry
    });

    pool.app = app;
    pool.use = (def, opts) => {
        if (!def && !opts) {
            opts = { reload: true };
        }
        
        sync_info.finished = false;
        
        const {
            reload = false
        } = opts || <typeof opts>{}
        
        if (reload)
            defs = [];
            
        if (def)
            defs = defs.concat(def)

        return defs;
    };

    return pool;
};
