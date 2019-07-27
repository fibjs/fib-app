import http = require('http')
import util = require('util')

import Rpc = require('fib-rpc')
import { makeFibAppReqInfo, normalizeQueryWhere } from '../utils/filter_request';
import { default_session_for_acl } from '../utils/checkout_acl';

export function bind_rpc (app: FibApp.FibAppClass) {
    const handlers = Rpc.open_handler(
        (
            input: Fibjs.AnyObject & {
                $method: string,
                $session: FibApp.FibAppSession,
                data: FibApp.FibDataPayload
            }
        ) => {
            const {
                $method = '',
                $session = default_session_for_acl(),
                ...restInput
            } = input || {};

            if (!$method || typeof $method !== 'string')
                throw Rpc.rpcError(-32601)
                
            const [ modelName, rpcMehthod ] = ($method).split('.')

            if (!modelName)
                throw Rpc.rpcError(-32601)
                
            return app.dbPool((db: FibApp.FibAppORM) => {
                const model = db.models[modelName]
                if (!model)
                    throw Rpc.rpcError(-32601)

                if (!rpcMehthod)
                    throw Rpc.rpcError(-32601)

                if (typeof model.$webx.rpc[rpcMehthod] === 'function')
                    return model.$webx.rpc[rpcMehthod].call(null, input)

                // when rpc method didn't exist, fallback rpc call to functions[rpcMethod]
                if (typeof model.$webx.functions[rpcMehthod] === 'function') {
                    const request = <FibApp.FibAppHttpRequest>(new http.Request())
                    request.session = default_session_for_acl($session)

                    const req = makeFibAppReqInfo(
                        request,
                        app,
                        {
                            classname: modelName,
                            handler: model.$webx.functions[rpcMehthod]
                        }
                    )

                    try {
                        const where = normalizeQueryWhere(req);
                        if (where) req.query.where = where
                    } catch (error) {}
                    req.query.where = req.query.where || {};
                    
                    const result = <FibApp.FibAppResponse>model.$webx.functions[rpcMehthod].apply(null, [req, restInput])
                    if (result.error)
                        throw Rpc.rpcError(
                            result.error.code || -32000,
                            result.error.message
                        )

                    return result.success
                }
                
                throw Rpc.rpcError(-32601)
            }
        );
    }, { log_error_stack: !app.__opts.hideErrorStack });

    Object.defineProperty(app, 'rpcCall', {
        value: <FibApp.FibAppClass['rpcCall']>(function (reqObj, opts) {
            const { session: default_session = null } = opts || {};
            
            let data: Fibjs.AnyObject = {};
            let rpcId = null, _method = '';
            let $session: FibApp.FibAppSession = default_session_for_acl(default_session)

            let params: FibApp.FibDataPayload = {};

            if (reqObj instanceof http.Request) {
                try {
                    data = reqObj.json();

                    rpcId = data.id || reqObj.firstHeader('x-rpc-id')
                    $session = default_session_for_acl(reqObj.session)
                    _method = data.method
                    params = data.params || {};
                } catch (e) {}
            } else {
                rpcId = reqObj.id;
                _method = reqObj.method;
                
                params = reqObj.params || {};
            }

            const response = Rpc.httpCall(handlers, {
                id: rpcId,
                method: '*',
                params: util.extend({}, params, {
                    $session: $session,
                    $method: _method,
                })
            });

            return response.json();
        })
    });

    app.all(app.__opts.rpcPathPrefix, (req: FibApp.FibAppHttpRequest) => {
        const result = app.rpcCall(req)

        req.response.json(result)
    })
}