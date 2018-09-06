Object.defineProperty(exports, "__esModule", { value: true });
const mq = require("mq");
const http = require("http");
const json = require("json");
const { err_info, fill_error } = require('../utils/err_info');
const _extend = require("./extend");
const _base = require("./base");
const { check_acl } = require('../utils/check_acl');
const _slice = Array.prototype.slice;
exports.bind = (app) => {
    var pool = app.db;
    app.api = {};
    app.filterRequest = function (req, classname) {
        var arglen = arguments.length;
        var earg = _slice.call(arguments, 2, arglen - 1);
        var func = arguments[arglen - 1];
        return pool((db) => {
            var data;
            // check empty data
            if (req.length == 0 && func.length === arglen + 1)
                return fill_error(req, err_info(4000001, {
                    method: req.method
                }));
            // decode json data
            if (req.length > 0)
                try {
                    data = req.json();
                }
                catch (e) {
                    return fill_error(req, err_info(4000002));
                }
            // check classname
            let cls = null;
            if (classname) {
                cls = db.models[classname];
                if (cls === undefined)
                    return fill_error(req, err_info(4040001, {
                        classname: classname
                    }));
            }
            var _req = {
                session: req.session,
                query: req.query.toJSON(),
                request: req
            };
            var where = _req.query.where;
            if (where !== undefined)
                try {
                    _req.query.where = json.decode(where);
                }
                catch (e) {
                    return fill_error(req, err_info(4000003));
                }
            var keys = _req.query.keys;
            if (keys !== undefined && typeof keys === 'string')
                _req.query.keys = keys.split(',');
            var result;
            try {
                result = func.apply(undefined, [_req, db, cls].concat(earg, [data]));
            }
            catch (e) {
                console.error(e.stack);
                if (e.type === 'validation') {
                    result = {
                        error: {
                            code: 5000000,
                            message: e.msg
                        }
                    };
                }
                else {
                    return fill_error(req, err_info(5000002, {
                        function: "func",
                        classname: classname,
                        message: e.message
                    }, cls ? cls.cid : '-1'));
                }
            }
            if (result.success) {
                if (result.status)
                    req.response.statusCode = result.status;
                req.response.json(result.success);
            }
            else
                fill_error(req, result);
        });
    };
    _base.bind(app.filterRequest, app);
    _extend.bind(app.filterRequest, app);
    app.post('/:classname/:func', (req, classname, func) => {
        app.filterRequest(req, classname, (_req, db, cls, data) => {
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
            }
            catch (e) {
                console.error(e.stack);
                return err_info(5000002, {
                    function: func,
                    classname: classname,
                    message: e.message
                }, cls.cid);
            }
        });
    });
    app.post('/', (req) => {
        if (req.firstHeader('Content-Type').split(';')[0] === 'application/graphql') {
            pool((db) => {
                var data = "";
                try {
                    data = req.data.toString();
                }
                catch (e) { }
                req.response.json(db.graphql(data, req));
            });
        }
        else {
            var querys;
            try {
                querys = req.json().requests;
            }
            catch (e) {
                return fill_error(req, err_info(4000002));
            }
            if (!Array.isArray(querys))
                return fill_error(req, err_info(4000004));
            var results = querys.map(q => {
                var r = new http.Request();
                r.method = q.method;
                if (typeof q.headers === 'object' && Object.keys(q.headers).length) {
                    r.setHeader(q.headers);
                }
                var a = q.path.split('?');
                r.address = r.value = a[0];
                r.queryString = a[1];
                r.session = req.session;
                if (q.body) {
                    if (r.firstHeader('Content-Type') === 'application/graphql') {
                        /* support graphql */
                        r.write(q.body);
                    }
                    else {
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
