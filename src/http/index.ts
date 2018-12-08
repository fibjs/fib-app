import mq = require('mq');
import http = require('http');
import json = require('json');
import util = require('util');

import { err_info, fill_error, render_error } from '../utils/err_info';

import _base = require('./base');
import _extend = require('./extend');
import _function = require('./function');
import _view = require('./view');

const _slice = Array.prototype.slice;

import { isAppInternalBaseApiFunction, isAppInternalExtApiFunction, getRequestResourceAndHandlerType } from '../utils/filter_request'
import { ouputMap } from "../utils/mimes";


function writeInSuccess (result: FibApp.FibAppResponse, req: FibApp.FibAppHttpRequest) {
    if (result.success)
        req.response.write(result.success);
}

export function bind (app: FibApp.FibAppClass) {
    const pool = app.dbPool;

    app.filterRequest = function (req: FibApp.FibAppHttpRequest, classname: string) {
        const arglen = arguments.length;
        const earg = _slice.call(arguments, 2, arglen - 1);
        const func: FibApp.FibAppFunctionToBeFilter = arguments[arglen - 1];

        return pool((db: FibApp.FibAppDb) => {
            let data;

            // check empty data
            if (req.length == 0 && func.length === arglen + 1)
                return fill_error(req,
                    err_info(4000001, {
                        method: req.method
                    }));

            // decode json data
            if (req.length > 0)
                try {
                    data = req.json();
                } catch (e) {
                    return fill_error(req, err_info(4000002));
                }

            // check classname
            let cls  = null
            if (classname) {
                cls = db.models[classname];
                if (cls === undefined)
                    return fill_error(req,
                        err_info(4040001, {
                            classname: classname
                        }));
            }
            
            const _req: FibApp.FibAppReq = {
                session: req.session as FibApp.FibAppSession,
                query: req.query.toJSON(),
                request: req,

                req_resource_type: getRequestResourceAndHandlerType(req).requestedResultType,
                req_resource_basecls: classname,
                req_resource_extend: undefined,
                req_resource_handler_type: undefined
            }

            if (isAppInternalBaseApiFunction(app, func)) {
                _req.req_resource_handler_type = 'builtInBaseRest'
            } else if (isAppInternalExtApiFunction(app, func)) {
                _req.req_resource_handler_type = 'builtInExtRest'
                _req.req_resource_extend = earg[1]
            } else {
                _req.req_resource_handler_type = 'modelFunction'
            }

            const where = _req.query.where;
            if (where !== undefined)
                try {
                    _req.query.where = json.decode(where as string);
                } catch (e) {
                    return fill_error(req, err_info(4000003));
                }

            const keys = _req.query.keys;
            if (keys !== undefined && typeof keys === 'string')
                _req.query.keys = keys.split(',');

            let result: FibApp.FibAppResponse = null;
            try {
                result = func.apply(undefined, [_req, db, cls].concat(earg, [data]));
            } catch (e) {
                console.error(e.stack);
                if (e.type === 'validation') {
                    result = {
                        error: {
                            code: 5000000,
                            message: e.msg
                        }
                    };
                } else {
                    return fill_error(req, err_info(5000002, {
                        function: "func",
                        classname: classname,
                        message: e.message
                    }, cls ? cls.cid : '-1'));
                }
            }

            if (result.status)
                req.response.statusCode = result.status;

            switch (_req.req_resource_type) {
                case 'json':
                    if (result.success) {
                        req.response.json(result.success);
                    } else
                        fill_error(req, result);
                    break
                case 'css':
                    writeInSuccess(result, req);
                    break
                case 'js':
                    writeInSuccess(result, req);
                    break
                case 'html':
                    if (result.success) {
                        switch (typeof result.success) {
                            default:
                                writeInSuccess(result, req);
                                break
                            case 'object':
                                req.response.json(result.success);
                                break
                        }
                    } else
                        render_error(req, result);
                    break
            }

            _req.response_headers = util.extend({
                'Content-Type': ouputMap[_req.req_resource_type] || ouputMap.json
            }, _req.response_headers)

            req.response.setHeader(_req.response_headers);
        });
    }

    const api = app.api = {} as FibApp.FibAppInternalApis;
    const viewApi = app.viewApi = {} as FibApp.FibAppInternalViewApis;
    _base.setup(app);
    _extend.setup(app);
    _function.setup(app);
    _view.setup(app);

    const apiPathPrefix = app.__opts.apiPathPrefix
    const viewPathPrefix = app.__opts.viewPathPrefix

    const enableFilterApiCollection = apiPathPrefix === viewPathPrefix
    const filterApiCollection = enableFilterApiCollection ? selectApiCollection : () => app.api
    
    function setupApiRoute () {
        /* api base :start */
        app.post(`${apiPathPrefix}/:classname`, (req: FibApp.FibAppHttpRequest, classname: string) => app.filterRequest(req, classname, api.post));
        app.get(`${apiPathPrefix}/:classname/:id`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => app.filterRequest(req, classname, id, filterApiCollection(req, app).get));
        app.put(`${apiPathPrefix}/:classname/:id`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => app.filterRequest(req, classname, id, api.put));
        app.del(`${apiPathPrefix}/:classname/:id`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => app.filterRequest(req, classname, id, api.del));
        app.get(`${apiPathPrefix}/:classname`, (req: FibApp.FibAppHttpRequest, classname: string) => app.filterRequest(req, classname, filterApiCollection(req, app).find));
        /* api base :end */

        /* api extend :start */
        app.put(`${apiPathPrefix}/:classname/:id/:extend`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType) => app.filterRequest(req, classname, id, extend, api.elink));
        app.put(`${apiPathPrefix}/:classname/:id/:extend/:rid`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid) => app.filterRequest(req, classname, id, extend, rid, api.eput));
        app.post(`${apiPathPrefix}/:classname/:id/:extend`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType) => app.filterRequest(req, classname, id, extend, api.epost));
        app.get(`${apiPathPrefix}/:classname/:id/:extend`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType) => app.filterRequest(req, classname, id, extend, filterApiCollection(req, app).efind));
        app.get(`${apiPathPrefix}/:classname/:id/:extend/:rid`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid) => app.filterRequest(req, classname, id, extend, rid, filterApiCollection(req, app).eget));
        app.del(`${apiPathPrefix}/:classname/:id/:extend/:rid`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid) => app.filterRequest(req, classname, id, extend, rid, api.edel));
        /* api extend :end */

        app.post(`${apiPathPrefix}/:classname/:func`, (req: FibApp.FibAppHttpRequest, classname: string, func: string) => {
            app.filterRequest(req, classname, api.functionHandler(classname, func));
        });
    }

    function setupViewRoute () {
        /* when `apiPathPrefix === viewPathPrefix`, you don't need set it because it's settled above */
        if (!enableFilterApiCollection) {
            /* view base :start */
            app.get(`${viewPathPrefix}/:classname/:id`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType) => app.filterRequest(req, classname, id, viewApi.get));
            app.get(`${viewPathPrefix}/:classname`, (req: FibApp.FibAppHttpRequest, classname: string) => app.filterRequest(req, classname, viewApi.find));
            /* view base :end */
            /* view extend :start */
            app.get(`${viewPathPrefix}/:classname/:id/:extend`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType) => app.filterRequest(req, classname, id, extend, viewApi.efind));
            app.get(`${viewPathPrefix}/:classname/:id/:extend/:rid`, (req: FibApp.FibAppHttpRequest, classname: string, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid) => app.filterRequest(req, classname, id, extend, rid, viewApi.eget));
            /* view extend :end */
        }
    }

    if (!apiPathPrefix && viewPathPrefix) {
        setupViewRoute()
        setupApiRoute()
    } else {
        setupApiRoute()
        setupViewRoute()
    }

    app.post('/', (req: FibApp.FibAppHttpRequest) => {
        if (req.firstHeader('Content-Type').split(';')[0] === 'application/graphql') {
            pool((db: FibApp.FibAppDb) => {
                let data: FibApp.GraphQLQueryString = "";
                try {
                    data = req.data.toString();
                } catch (e) {}

                req.response.json(db.graphql(data, req));
            });
        } else {
            let querys;
            try {
                querys = req.json().requests;
            } catch (e) {
                return fill_error(req, err_info(4000002));
            }
            if (!Array.isArray(querys))
                return fill_error(req, err_info(4000004));

            const results = querys.map(q => {
                const r = new http.Request() as FibApp.FibAppHttpRequest;
                r.method = q.method;

                if (typeof q.headers === 'object' && Object.keys(q.headers).length) {
                    r.setHeader(q.headers)
                }

                const a = q.path.split('?');
                r.address = r.value = a[0];
                r.queryString = a[1];

                r.session = req.session;
                if (q.body) {
                    if (r.firstHeader('Content-Type') === 'application/graphql') {
                        /* support graphql */
                        r.write(q.body);
                    } else {
                        /* default for json format */
                        r.json(q.body);
                    }
                }
                mq.invoke(app, r);

                const p = r.response;
                if (Math.floor(p.statusCode / 100) !== 2)
                    return {
                        'error': p.json()
                    };
                else
                    return {
                        'success': p.json()
                    };
            });

            req.response.json(results);
        }
    });
};

function selectApiCollection (req: FibApp.FibAppHttpRequest, app: FibApp.FibAppClass): FibApp.FibAppHttpApiCollectionType {
    switch (getRequestResourceAndHandlerType(req).requestedResultType) {
        case 'css':
        case 'js':
        case 'html':
            return app.viewApi
        case 'json':
            return app.api
    }
}
