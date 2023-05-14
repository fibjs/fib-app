import { err_info, fill_error } from '../utils/err_info';

import _base = require('./base');
import _extend = require('./extend');
import _function = require('./function');

import { parse_req_resource_and_hdlr_type, filterRequest } from '../utils/filter_request'
import { run_graphql, is_graphql_request } from '../utils/graphql';
import { bind_websocket_and_rpc } from './websocket_rpc';
import { run_batch } from '../utils/batch-request';
import * as Hook from './hook';
import { ROOT_PATH } from './_ctx';
import { FibApp } from '../Typo/app';
import { FibAppACL } from '../Typo/acl';
import { FxOrmError } from '@fxjs/orm';

const defaultCustomizeApiRoute: FibApp.FibAppOpts['customizeApiRoute'] = (ctx) => {
    return ctx.handler;
}

export function bind (app: FibApp.FibAppClass) {
    // bind it firstly
    app.filterRequest = filterRequest

    const api = app.api = {} as FibApp.FibAppInternalApis;

    _base.setup(app);
    _extend.setup(app);
    _function.setup(app);

    const apiPathPrefix = app.__opts.apiPathPrefix
    const graphQLPathPrefix = app.__opts.graphQLPathPrefix
    const batchPathPrefix = app.__opts.batchPathPrefix
    const _customizeApiRoute = app.__opts.customizeApiRoute || defaultCustomizeApiRoute;

    if (typeof _customizeApiRoute !== 'function') {
        throw new Error(`[FibApp] app.__opts.customizeApiRoute must be a function`);
    }

    type CustomizeParamas = Parameters<typeof app.__opts.customizeApiRoute>;
    const customizeApiRoute = (ctx: CustomizeParamas[0]) => {
        const _handlers = _customizeApiRoute(ctx);

        const handlers = Array.isArray(_handlers) ? _handlers : [_handlers];
        if (!handlers.includes(ctx.handler)) {
            console.warn(`[fib-app] return of customizeApiRoute(ctx) must includes ctx.handler, but not found now. we will add it at the end of handlers automatically.`);
            handlers.push(ctx.handler);
        }

        if (!_customizeApiRoute.allowCustomizePostApiRoute && handlers[handlers.length - 1] !== ctx.handler) {
            throw new Error(`[fib-app] customizeApiRoute should return the last handler as the final handler, but got ${handlers[handlers.length - 1].name} instead of ${ctx.handler.name}`);
        }

        return handlers;
    };

    const filterApiCollection = () => app.api
    
    function setupApiRoute () {
        /* api base :start */
        app.post(`${apiPathPrefix}/:classname`, customizeApiRoute({
            app,  routeType: 'http-rest-post',
            handler: (req: FibApp.FibAppHttpRequest, classname: string) => app.filterRequest(req, classname, api.post),
        }));

        app.get(`${apiPathPrefix}/:classname/:id`, customizeApiRoute({
            app,  routeType: 'http-rest-get',
            handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => app.filterRequest(req, classname, id, app.api.get),
        }));

        app.put(`${apiPathPrefix}/:classname/:id`, customizeApiRoute({
            app,  routeType: 'http-rest-put',
            handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => app.filterRequest(req, classname, id, api.put),
        }));

        app.del(`${apiPathPrefix}/:classname/:id`, customizeApiRoute({
            app,  routeType: 'http-rest-delete',
            handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => app.filterRequest(req, classname, id, api.del),
        }));

        app.get(`${apiPathPrefix}/:classname`, customizeApiRoute({
            app,  routeType: 'http-rest-find',
            handler: (req: FibApp.FibAppHttpRequest, classname: string) => app.filterRequest(req, classname, app.api.find),
        }));
        /* api base :end */

        /* api extend :start */
        app.put(`${apiPathPrefix}/:classname/:id/:extend`, customizeApiRoute({
            app,  routeType: 'http-rest-eput', withExtendId: false,
            handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType) => app.filterRequest(req, classname, id, extend, api.elink),
        }));

        app.put(`${apiPathPrefix}/:classname/:id/:extend/:rid`, customizeApiRoute({
            app,  routeType: 'http-rest-eput', withExtendId: true,
            handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType) => app.filterRequest(req, classname, id, extend, rid, api.eput),
        }));

        app.post(`${apiPathPrefix}/:classname/:id/:extend`, customizeApiRoute({
            app,  routeType: 'http-rest-epost',
            handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType) => app.filterRequest(req, classname, id, extend, api.epost),
        }));

        app.get(`${apiPathPrefix}/:classname/:id/:extend`, customizeApiRoute({
            app,  routeType: 'http-rest-efind',
            handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType) => app.filterRequest(req, classname, id, extend, app.api.efind),
        }));

        app.get(`${apiPathPrefix}/:classname/:id/:extend/:rid`, customizeApiRoute({
            app,  routeType: 'http-rest-eget',
            handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType) => app.filterRequest(req, classname, id, extend, rid, app.api.eget),
        }));

        app.del(`${apiPathPrefix}/:classname/:id/:extend/:rid`, customizeApiRoute({
            app,  routeType: 'http-rest-edel',
            handler: (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid: FibApp.AppIdType) => app.filterRequest(req, classname, id, extend, rid, api.edel),
        }));
        /* api extend :end */

        app.post(`${apiPathPrefix}/:classname/:func`, customizeApiRoute({
            app,  routeType: 'http-postfunc',
            handler: (req: FibApp.FibAppHttpRequest, classname: string, func: string) => {
                app.filterRequest(req, classname, api.functionHandler(classname, func));
            },
        }));
    }

    Hook.wait(app as any, app.__opts.hooks.beforeSetupRoute, function (err: FxOrmError.ExtendedError) {
        if (err)
            throw err;

        /* setup websocket :start */
        bind_websocket_and_rpc(app)
        /* setup websocket :end */

        /* setup graphql :start */
        const mergeRootAndGraphqlRoot = !graphQLPathPrefix || graphQLPathPrefix === ROOT_PATH
        if (!mergeRootAndGraphqlRoot)
            app.post(graphQLPathPrefix, (req: FibApp.FibAppHttpRequest) => {
                if (!is_graphql_request(req))
                    return fill_error(req, err_info(4000005))
            
                run_graphql(app, req)
            })
        /* setup graphql :end */
        
        setupApiRoute()
    
        /* setup batch task :end */
        const mergeRootAndBatchRoot = !batchPathPrefix || batchPathPrefix === ROOT_PATH
        if (!mergeRootAndBatchRoot)
            app.post(batchPathPrefix, (req: FibApp.FibAppHttpRequest) => run_batch(app, req))
        /* setup batch task :end */
        
    
        /* finally, root setup */
        app.post(ROOT_PATH, (req: FibApp.FibAppHttpRequest) => {
            if (is_graphql_request(req))
                return mergeRootAndGraphqlRoot && run_graphql(app, req);
    
            mergeRootAndBatchRoot && run_batch(app, req)
        });
    });
};
