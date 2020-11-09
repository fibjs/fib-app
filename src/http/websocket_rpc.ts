import Rpc = require('fib-rpc')
import http = require('http')
import util = require('util')
import ws = require('ws')

import coroutine = require('coroutine')
import { makeFibAppReqInfo, normalizeQueryWhere } from '../utils/filter_request';
import { default_session_for_acl } from '../utils/checkout_acl';
import * as Hook from './hook';
import { capabilities, ROOT_PATH } from './_ctx';
import { FibApp } from '../Typo/app'

function noOp () {}

export function bind_rpc (app: FibApp.FibAppClass) {    
    const shouldLogError = !app.__opts.hideErrorStack

    const methodMap = new Map<string, FibApp.RpcMethod>()
    const methods_lock = new coroutine.Lock()
    // this must be one immutable object, which as fib-rpc's handlers dictionary
    const rpcMethods = <{[k: string]: FibApp.RpcMethod}>{}

    function syncMethodToMethods (name: string) {
        if (methodMap.has(name))
            rpcMethods[name] = methodMap.get(name)
        else
            delete rpcMethods[name]
    }

    app.addRpcMethod = function (name, fn) {
        if (!name)
            throw Rpc.rpcError(-1, 'rpc method name is required!')
        if (typeof fn !== 'function')
            throw Rpc.rpcError(-1, 'rpc handler is invalid')

        if (app.hasRpcMethod(name))
            throw Rpc.rpcError(-1, `rpc method '${name}' existed!`)
            
        methods_lock.acquire()
        methodMap.set(name, fn)
        syncMethodToMethods(name)
        methods_lock.release()

        return methodMap.size
    }
    Object.defineProperty(app, 'addRpcMethod', { value: app.addRpcMethod, writable: false, configurable: false})
    
    app.hasRpcMethod = (name) => !!methodMap.has(name)
    Object.defineProperty(app, 'hasRpcMethod', { value: app.hasRpcMethod, writable: false, configurable: false})
    
    app.allRpcMethodNames = () => Array.from(methodMap.keys())
    Object.defineProperty(app, 'allRpcMethodNames', { value: app.allRpcMethodNames, writable: false, configurable: false})
    
    app.removeRpcMethod = function (name) {
        methods_lock.acquire()
        methodMap.delete(name)
        syncMethodToMethods(name)
        methods_lock.release()

        return methodMap.size
    }
    Object.defineProperty(app, 'removeRpcMethod', { value: app.removeRpcMethod, writable: false, configurable: false})
    
    app.clearRpcMethods = function () {
        const cl_lock = new coroutine.Lock();
        cl_lock.acquire()
        Array.from(methodMap.keys()).forEach(name => app.removeRpcMethod(name));
        cl_lock.release()
    }
    Object.defineProperty(app, 'clearRpcMethods', { value: app.clearRpcMethods, writable: false, configurable: false})
    
    const httpcallee_handlers = Rpc.open_handler(
        rpcMethods,
        {
            log_error_stack: shouldLogError,
            interceptor (reqPayload: FibRpcJsonRpcSpec.RequestPayload) {
                if (!reqPayload.method)
                    return undefined

                const method = reqPayload.method

                return (rpcParams: Fibjs.AnyObject & {$session: FibApp.FibAppSession, $sessionid: string}) => {
                    if (!method || typeof method !== 'string')
                        throw Rpc.rpcError(-32601)
                        
                    const [ modelName, rpcMehthod ] = (method).split('.')

                    if (!modelName)
                        throw Rpc.rpcError(-32601)
                        
                    return app.dbPool((orm: FibApp.FibAppORM) => {
                        const model = orm.models[modelName]
                        if (!model)
                            throw Rpc.rpcError(-32601)

                        if (!rpcMehthod)
                            throw Rpc.rpcError(-32601)

                        if (typeof model.$webx.rpc[rpcMehthod] === 'function')
                            return model.$webx.rpc[rpcMehthod].call(null, rpcParams)

                        // when rpc method didn't exist, fallback rpc call to functions[rpcMethod]
                        if (typeof model.$webx.functions[rpcMehthod] === 'function') {
                            const request = <FibApp.FibAppHttpRequest>(new http.Request())
                            request.session = default_session_for_acl(rpcParams.$session)
                            request.sessionid = rpcParams.$sessionid

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
                            
                            const result = <FibApp.FibAppResponse>model.$webx.functions[rpcMehthod].apply(
                                null, [req, util.omit(rpcParams, ['$session', '$sessionid'])]
                            )

                            if (result.error)
                                throw Rpc.rpcError(
                                    result.error.code || -32000,
                                    result.error.message
                                )

                            return result.success
                        }
                        
                        throw Rpc.rpcError(-32601)
                    });
                }
            }
        }
    );
    
    Object.defineProperty(app, 'rpcCall', {
        value: <FibApp.FibAppClass['rpcCall']>(function (reqObj, opts) {
            const { session: default_session = null } = opts || {};
            let { sessionid: $sessionid = null } = opts || {};
            
            let data: Fibjs.AnyObject = {};
            let rpcId = null, _method = '';
            let $session: FibApp.FibAppSession = default_session_for_acl(default_session)

            let params: FibApp.FibDataPayload = {};

            if (reqObj instanceof http.Request) {
                try {
                    data = reqObj.json();

                    rpcId = data.id || reqObj.firstHeader('x-rpc-id')
                    $session = default_session_for_acl({...reqObj.session})
                    $sessionid = reqObj.sessionid
                    _method = data.method
                    params = data.params || {};
                } catch (e) {}
            } else {
                rpcId = reqObj.id;
                _method = reqObj.method;
                
                params = reqObj.params || {};
            }

            const response = Rpc.httpCall(httpcallee_handlers, {
                id: rpcId,
                method: _method,
                params: util.extend({$session, $sessionid}, params)
            });

            return response.json();
        })
    });

    app.all(app.__opts.rpcPathPrefix, (req: FibApp.FibAppHttpRequest) => {
        const result = app.rpcCall(req)

        req.response.json(result)
    });

}

export function bind_websocket_and_rpc (app: FibApp.FibAppClass) {
    const rpcPathPrefix = app.__opts.rpcPathPrefix
    const websocketPathPrefix = app.__opts.websocketPathPrefix

    const couldBind = {
        rpc: rpcPathPrefix && rpcPathPrefix !== ROOT_PATH,
        websocket: websocketPathPrefix && websocketPathPrefix !== ROOT_PATH
    }
    
    if (couldBind.rpc) bind_rpc(app)

    if (couldBind.websocket) {
        app.all(websocketPathPrefix, ws.upgrade(
            (ws_conn: Class_WebSocket, request: FibApp.FibAppHttpRequest) => {
                ws_conn.onmessage = ((msg: FibRpcInvoke.FibRpcInvokeWsSocketMessage) => {
                    let input = <any>{}
                    try { input = msg.json() } catch (error) {}
                    
                    if (capabilities['fib-push'] && (
                        input.act && typeof input.act === 'string' && !!input.timestamp
                    )) {
                        const ctx = {
                            data: input,
                            app,
                            websocket_msg: msg,
                            websocket: ws_conn,
                            request
                        }

                        app.eventor.emit('onReceiveFibPushAct', ctx)
                    } else if (couldBind.rpc) {
                        const result = app.rpcCall(input, {
                            sessionid: request.sessionid,
                            session: request.session
                        })

                        ws_conn.send(JSON.stringify(result))
                    }
                })
            }
        ))
    }
}