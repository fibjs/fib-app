import mq = require('mq')

const DEFAULT_APP_PATH = '/api'

export function getTestRouting (app: FibApp.FibAppClass, opts: FibApp.GetTestRoutingOptions) {
    const { appPath = DEFAULT_APP_PATH } = opts || {}
    
    return new mq.Routing({
        '/set_session': (req: FibApp.FibAppHttpRequest) => {
            var data = req.json();
            req.session.id = data.id;
            req.session.roles = data.roles;
        },
        [`${appPath}`]: app
    })
}

function ensureSlashStart (str: string = '') {
    if (str && str[0] !== '/')
        str = '/' + str

    return str
}

export function mountAppToSessionServer (app: FibApp.FibAppClass, options: FibApp.GetTestServerOptions): FibApp.SessionTestServerInfo {
    const http = require('http')
    const util = require('util')

    const Session = require('fib-session')
    const detectPort = require('@fibjs/detect-port')

    const port = detectPort(options.port)
    
    const session = new Session(new util.LruCache(20000), {
        timeout: 60 * 1000
    });

    const { appPath = DEFAULT_APP_PATH } = options
    const serverBase = `http://127.0.0.1:${port}`
    const appUrlBase = `${serverBase}${ensureSlashStart(appPath)}`

    const routing = getTestRouting(app, options)
    const server = new http.Server(port, [
        session.cookie_filter,
        routing
    ])

    function sessionAs (sessionInfo: Fibjs.AnyObject) {
        http.post(serverBase + '/set_session', {
            json: sessionInfo
        });
    }

    return {
        app,
        server,
        port,
        serverBase,
        appUrlBase,
        routing,
        utils: {
            sessionAs
        }
    }
}
