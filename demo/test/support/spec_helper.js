const fs = require('fs');
const path = require('path');
const db = require('db');
const http = require('http');

const { Driver } = require('@fxjs/db-driver')

const ws = require('ws');
const push = require('fib-push');

const App = require('../../../').default;

const defs = require('../../defs');

const runtimeTime = Date.now();
function generateConnectionInfo () {
    const dbName = getStaticTestDBName();

    const dbType = getTestDbType();
    switch (dbType) {
        case 'sqlite':
            return {
                dbName,
                dbType,
                conn: `sqlite:${dbName}.db`
            }
        case 'mysql': {
            const mysqlUser = process.env.MYSQL_USER || 'root'
            const mysqlPwd = process.env.MYSQL_PASSWORD || ''
                
            return {
                dbName,
                dbType,
                conn: `mysql://${mysqlUser}:${mysqlPwd}@127.0.0.1:3306/${dbName}`
            }
        }
        case 'postgres': {
            const psqlUser = process.env.PSQL_USER || 'postgres'
            const psqlPwd = process.env.PSQL_PASSWORD || ''
                
            return {
                dbName,
                dbType,
                conn: `psql://${psqlUser}:${psqlPwd}@127.0.0.1:5432/${dbName}`
            }
        }
    }
}

const dropSync = exports.dropSync = function (models) {
    if (!Array.isArray(models)) {
        models = [models];
    }

    models.forEach(function (item) {
        item.dropSync();
        item.syncSync();
    });
};

const getTestDbType = exports.getTestDbType = function () {
    process.env.WEBX_TEST_DBTYPE = process.env.WEBX_TEST_DBTYPE || 'sqlite';

    switch (process.env.WEBX_TEST_DBTYPE) {
        case 'mysql':
        case 'sqlite':
        case 'postgres':
            return process.env.WEBX_TEST_DBTYPE
        default:
            throw new Error(`[getTestDbType] Unknown db type: ${process.env.WEBX_TEST_DBTYPE}`)
    }
}

const getUseUUID = exports.getUseUUID = function () {
    return !!process.env.UUID || getTestDbType() === 'sqlite';
}

const getStaticTestDBName = exports.getStaticTestDBName = function () {
    return `fibapp-test-${getTestDbType()}`;
}

const dbBuilder = exports.dbBuilder = function (dbName = '') {
    if (!dbName)
        return ;

    const builder = {
        create () {},
        drop () {}
    }

    switch (getTestDbType()) {
        case 'mysql': {
            builder.create = function () {
                var driver = Driver.create(`mysql://root:@127.0.0.1:3306`);
                driver.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8 COLLATE utf8_general_ci`)
            }
            builder.drop = function () {
                var driver = Driver.create(`mysql://root:@127.0.0.1:3306`);
                driver.execute(`DROP DATABASE IF EXISTS  \`${dbName}\``);
            }
            break;
        }
        case 'postgres': {
            builder.create = function () {
                var driver = Driver.create(`psql://postgres@127.0.0.1:5432`);

                var exists = driver.execute(`SELECT * FROM pg_database WHERE datname = '${dbName}'`);
                if (!exists.length) {
                    driver.execute(`CREATE DATABASE "${dbName}" WITH ENCODING = 'UTF8'`);
                }
            }
            builder.drop = function () {
                var driver = Driver.create(`psql://postgres@127.0.0.1:5432`);
                driver.execute(`SELECT 'DROP DATABASE ${dbName}' WHERE EXISTS (SELECT * FROM pg_database WHERE datname = '${dbName}');`);
            }
            break;
        }
        case 'sqlite': {
            builder.drop = function () {
                [
                    dbName,
                    `${dbName}-shm`,
                    `${dbName}-wal`,
                ].forEach(filename => {
                    const dbFilepath = path.resolve(process.cwd(), filename)
                    try {
                        if (fs.exists(dbFilepath)) {
                            fs.unlink(dbFilepath)
                            console.log(`unlink file ${dbFilepath} success.`)
                        }
                    } catch (e) {
                        console.log(`unlink file ${dbFilepath} failed.`, e)
                    }
                })
            }
            break;
        }
    }

    return builder
}

exports.getApp = function (conn = 'sqlite:test.db', ...args) {
    args[Math.max(args.length - 1, 0)] = args[Math.max(args.length - 1, 0)] || {}
    args[args.length - 1].uuid = getUseUUID();

    const app = new App(conn, ...args);

    app.db.use(defs);

    return app
}

/**
 * @param {[
 *  import('../../../typings/Typo/app').FibApp.FibAppOpts,
 *  import('../../../typings/Typo/app').FibApp.FibAppDbSetupOpts
 * ] | [
 *  import('../../../typings/Typo/app').FibApp.FibAppDbSetupOpts
 * ]} args
 * @param {import('../../../typings/Typo/app').FibApp.GetTestServerOptions} options
 */
const getRandomSqliteBasedApp = exports.getRandomSqliteBasedApp = function (...args) {
    let {conn: connString, dbName, dbType = ''} = generateConnectionInfo();

    let connName = connString;
    if (process.env.WEBX_TEST_DB_DEBUG) {
        connName += '?debug_sql=true'
        process.env.DEBUG_SQLDDLSYNC = true
    }

    const app = exports.getApp(connName, ...args)
    const builder = dbBuilder(dbName)

    return {
        app,
        dbName,
        dbType,
        utils: {
            dropModelsSync () {
                app.ormPool(orm =>  dropSync(Object.values(orm.models)))
            },
            cleanLocalDB () {
                if (getTestDbType() === 'sqlite')
                    builder.drop()
            },
            connectionToDB () {
                return db.open(connString)
            }
        }
    }
}

/**
 * @param {import('../../../typings/Typo/app').FibApp.FibAppClass} app
 * @param {import('../../../typings/Typo/app').FibApp.GetTestServerOptions} options
 */
const mountAppToSrv = exports.mountAppToSrv = function (app, options = {}) {
    const mountedInfo = app.test.mountAppToSessionServer(app, {
        ...options,
        initRouting (routing) {
            routing['/push'] = ws.upgrade((conn) => {
                conn.onmessage = msg => {
                    var cmd = msg.json();
                    switch (cmd.act) {
                        case 'on':
                            push.on(cmd.ch, conn, cmd.timestamp);
                            break;
                        case 'off':
                            push.off(cmd.ch, conn);
                            break;
                    }
                };
            })
        }
    })

    return mountedInfo
}

const { runServer } = require('../_utils');

/**
 * 
 * @param {{
 *  createAppArgs?: Parameters<typeof getRandomSqliteBasedApp>
 * }} options 
 * @returns 
 */
exports.useTestServer = function (options) {
    const { createAppArgs = [] } = options;
    
    const tappInfo = getRandomSqliteBasedApp(...createAppArgs);
    const tSrvInfo = mountAppToSrv(tappInfo.app, {appPath: '/api'});
    runServer(tSrvInfo.server, () => void 0)

    after(() => tappInfo.utils.cleanLocalDB())

    before(() => {
        tappInfo.utils.dropModelsSync();
    });

    const httpClient = new http.Client();

    const clients = {
        person: { ...tSrvInfo.app.test.getRestClient({ modelName: 'person', appUrlBase: tSrvInfo.appUrlBase }) },
        people: { ...tSrvInfo.app.test.getRestClient({ modelName: 'people', appUrlBase: tSrvInfo.appUrlBase }) },
        city: { ...tSrvInfo.app.test.getRestClient({ modelName: 'city', appUrlBase: tSrvInfo.appUrlBase }) },
    }

    const adminUser = {
        id: Date.now(),
        roles: ['admin']
    };

    function switchUser (user_id, roles = ['user']) {
        switch (user_id) {
            case 'admin':
                user_id = adminUser.id;
                roles = Array.from(new Set(adminUser.roles.concat('admin')));
                break;
            default:
                break;
        }

        return httpClient.post(`${tSrvInfo.httpHost}/set_session`, {
            json: {
                id: user_id,
                roles,
            }
        });
    }

    return {
        tappInfo,
        tSrvInfo,

        clients,
        clientCtx: {
            switchUser
        }
    }
}