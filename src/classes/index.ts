import { FibAppClass, FibAppSetupChainFn, FibAppHttpRequest, FibAppDb, FibAppReq, FibDataPayload, GraphQLString } from "../../@types/app";
import * as FibOrmNS from 'orm'

import mq = require('mq');
import http = require('http');
import json = require('json');
import * as err_info from '../utils/err_info';
import * as _extend from './extend';
import * as _base from './base';

const { APPError } = require('../utils/err_info');
const { check_acl } = require('../utils/check_acl');

const _slice = Array.prototype.slice;

export const bind = (app: FibAppClass) => {
    var pool = app.db;
    app.api = {};

    function fill_error(req: FibAppHttpRequest, e: { error: APPError }) {
        var code = e.error.code;

        req.response.statusCode = code / 10000;
        req.response.json({
            code: e.error.cls ? code + e.error.cls * 100 : code,
            message: e.error.message
        });
    }

    const _: FibAppSetupChainFn = function (req: FibAppHttpRequest, classname: string, ...args: any[]) {
        var arglen = arguments.length;
        var earg = _slice.call(arguments, 2, arglen - 1);
        var func = arguments[arglen - 1];

        pool((db: FibAppDb) => {
            var data;

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
            const cls = db.models[classname];
            if (cls === undefined)
                return fill_error(req,
                    err_info(4040001, {
                        classname: classname
                    }));

            var _req: FibAppReq = {
                session: req.session,
                query: req.query.toJSON(),
                request: req
            };

            var where = _req.query.where;
            if (where !== undefined)
                try {
                    _req.query.where = json.decode(where as string);
                } catch (e) {
                    return fill_error(req, err_info(4000003));
                }

            var keys = _req.query.keys;
            if (keys !== undefined && typeof keys === 'string')
                _req.query.keys = keys.split(',');

            var result;
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
                    }, cls.cid));
                }
            }
            if (result.success) {
                if (result.status)
                    req.response.statusCode = result.status;
                req.response.json(result.success);
            } else
                fill_error(req, result);
        });
    }

    _base.bind(_, app);
    _extend.bind(_, app);

    app.post('/:classname/:func', (req: FibAppHttpRequest, classname: string, func: string) => {
        _(req, classname, (_req: FibAppReq, db: FibAppDb, cls: FibOrmNS.FibOrmFixedModel, data: FibDataPayload) => {
            if (!check_acl(_req.session, func, cls.ACL))
                return err_info(4030001, {}, cls.cid);

            const f = cls.functions[func];
            if (f === undefined)
                return err_info(4040004, {
                    function: func,
                    classname: classname
                }, cls.cid);

            try {
                return f(_req, data);
            } catch (e) {
                console.error(e.stack);
                return err_info(5000002, {
                    function: func,
                    classname: classname,
                    message: e.message
                }, cls.cid);
            }
        });
    });

    app.post('/', (req: FibAppHttpRequest) => {
        if (req.firstHeader('Content-Type').split(';')[0] === 'application/graphql') {
            pool((db: FibAppDb) => {
                var data: GraphQLString = "";
                try {
                    data = req.data.toString();
                } catch (e) {}

                req.response.json(db.graphql(data, req));
            });
        } else {
            var querys;
            try {
                querys = req.json().requests;
            } catch (e) {
                return fill_error(req, err_info(4000002));
            }
            if (!Array.isArray(querys))
                return fill_error(req, err_info(4000004));

            var results = querys.map(q => {
                var r = new http.Request() as FibAppHttpRequest;
                r.method = q.method;

                if (typeof q.headers === 'object' && Object.keys(q.headers).length) {
                    r.setHeader(q.headers)
                }

                var a = q.path.split('?');
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

                var p = r.response;
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
