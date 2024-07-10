import http = require('http')
import util = require('util')
import mq = require('mq')
import { FibApp } from '../Typo/app'
const fc = require("fib-cache");

export function getTestRouting (app: FibApp.FibAppClass, opts: FibApp.GetTestRoutingOptions) {
    const {
        initRouting = null
    } = opts || {}
    
    const routingObj = <any>{
        '/set_session': (req: FibApp.FibAppHttpRequest) => {
            var data = req.json();
            req.session.id = data.id;
            req.session.roles = data.roles;
        },
    }

    if (typeof initRouting === 'function')
        initRouting(routingObj)

    Array.from(
        new Set([,
            // app.__opts.graphQLPathPrefix,
            // app.__opts.rpcPathPrefix,
            // app.__opts.apiPathPrefix,
            // app.__opts.viewPathPrefix,
            // app.__opts.websocketPathPrefix,
            app.__opts.batchPathPrefix,
        ])
    )
    .filter(x => !!x)
    .forEach((path,) => {
        if (!path) return ;

        path = ensureSlashStart(path)
        routingObj[path] = app
    })

    return new mq.Routing(routingObj)
}

function ensureSlashStart (str: string = '') {
    if (str && str[0] !== '/')
        str = '/' + str

    return str
}

export function mountAppToSessionServer (
    app: FibApp.FibAppClass,
    options: FibApp.GetTestServerOptions
): FibApp.SessionTestServerInfo {
    const Session = require('fib-session')
    const detectPort = require('@fibjs/detect-port')

    const port = detectPort(options.port)
    
    const session = new Session(new fc.LRU({ max: 20000 }), {
        timeout: 60 * 1000
    });

    const routing = getTestRouting(app, options)

    const httpHost = `http://127.0.0.1:${port}`
    const websocketHost = `ws://127.0.0.1:${port}`
    const appUrlBase = `${httpHost}${ensureSlashStart(app.__opts.apiPathPrefix)}`

    const server = new http.Server(port, [
        session.cookie_filter,
        routing
    ] as any)

    const httpClient = options?.httpClient || new http.Client();

    function sessionAs (sessionInfo: Fibjs.AnyObject) {
        httpClient.post(httpHost + '/set_session', {
            json: sessionInfo
        });
    }

    return {
        app,
        server,
        port,
        httpHost,
        serverBase: httpHost,
        websocketHost,
        appUrlBase,
        routing,
        httpClient,
        utils: {
            sessionAs
        }
    }
}
