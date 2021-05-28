const fs = require('fs');
const path = require('path');
const db = require('db');
const util = require('util');

const ws = require('ws');
const push = require('fib-push');

const App = require('../../../');
const defs = require('../../defs');

function runProcess (...args) {
    if (process.run) {
        return process.run(...args);
    }

    const child_process = require('child_process')

    return child_process.run(...args)
}

const runtimeTime = Date.now();
function generateRandomConn () {
    const dbName = getStaticTestDBName();

    if (getProtocol() === 'sqlite') {
        return {
            dbName,
            protocol: getProtocol(),
            conn: `sqlite:${dbName}.db`
        }
    }
        
    return {
        dbName,
        protocol: getProtocol(),
        conn: `mysql://root:@127.0.0.1/${dbName}`
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

const getProtocol = exports.getProtocol = function () {
    return process.env.WEBX_TEST_SQLITE ? 'sqlite' : 'mysql';
}

const getUseUUID = exports.getUseUUID = function () {
    return !!process.env.UUID || getProtocol() === 'sqlite';
}

const getStaticTestDBName = exports.getStaticTestDBName = function () {
    return `fibapp-test-${getProtocol()}-${runtimeTime}`;
}

const dbBuilder = exports.dbBuilder = function (dbName = '') {
    if (!dbName)
        return ;

    const builder = {
        create () {},
        drop () {}
    }

    if (getProtocol() === 'mysql') {
        builder.create = function () {
            runProcess(
                'mysql',
                [
                    "-uroot",
                    "-e CREATE DATABASE IF NOT EXISTS `" + dbName + "` CHARACTER SET utf8 COLLATE utf8_general_ci"
                ]
            );
        }
        builder.drop = function () {
            runProcess(
                'mysql',
                [
                    "-uroot",
                    "-e DROP DATABASE IF EXISTS `" + dbName + "`"
                ]
            );
        }
    } else if (getProtocol() === 'sqlite') {
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

exports.getRandomSqliteBasedApp = function (...args) {
    let {conn: connName, dbName, protocol = ''} = generateRandomConn();

    if (process.env.WEBX_TEST_DB_DEBUG)
        connName += '?debug=true'

    const app = exports.getApp(connName, ...args)
    const builder = dbBuilder(dbName)
    return {
        app,
        dbName,
        protocol,
        utils: {
            dropModelsSync () {
                app.ormPool(orm =>  dropSync(Object.values(orm.models)))
            },
            cleanLocalDB () {
                if (getProtocol() === 'sqlite')
                    builder.drop()
            },
            connectionToDB () {
                return db.open(connName)
            }
        }
    }
}

exports.mountAppToSrv = function (app, options = {}) {
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