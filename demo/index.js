const fs = require('fs');
const path = require('path');
const db = require('db');

const ws = require('ws');
const push = require('fib-push');

const App = require('../');
const defs = require('./defs');

const { dropSync } = require('./test/support/spec_helper');

exports.getApp = function (conn = 'sqlite:test.db', ...args) {
    args[Math.max(args.length - 1, 0)] = args[Math.max(args.length - 1, 0)] || {}
    args[args.length - 1].uuid = true

    const app = new App(conn, ...args);

    app.db.use(defs);

    return app
}

exports.getRandomSqliteBasedApp = function (...args) {
    let {conn: connName, dbName, protocol = ''} = generateRandomConn();

    if (process.env.WEBX_TEST_DB_DEBUG)
        connName += '?debug=true'

    function cleanSqliteDB () {
        if (protocol !== 'sqlite')
            return ;
            
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

    function dropModelsSync () {
        app.ormPool(orm => {
            dropSync(Object.values(orm.models))
        })
    }

    const app = exports.getApp(connName, ...args)
    return {
        app,
        dbName,
        dropModelsSync,
        cleanSqliteDB,
        protocol,
        utils: {
            connectionToDB () {
                return db.open(connName)
            }
        }
    }
}

exports.mountAppToSrv = function (app, options = {}) {
    const mountedInfo = app.test.mountAppToSessionServer(app, options)

    // change routing for it
    mountedInfo.routing.all(
        '/push',
        ws.upgrade((conn, req) => {
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
    )

    return mountedInfo
}

function generateRandomConn () {
    let dbName = `fibjs-test`;
    if (process.env.WEBX_TEST_SQLITE) {
        dbName = `test-${Date.now()}.db`
        return {
            protocol: 'sqlite',
            dbName,
            conn: `sqlite:${dbName}`
        }
    }

    return {
        protocol: 'mysql',
        dbName,
        conn: `mysql://root:@127.0.0.1/fibjs-test`
    }
}