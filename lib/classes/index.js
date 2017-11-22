const mq = require('mq');
const util = require('util');
const http = require('http');
const json = require('json');
const err_info = require('../utils/err_info');
const check_acl = require('../utils/check_acl');
const _extend = require('./extend');
const _base = require('./base');

const _slice = Array.prototype.slice;

module.exports = pool => {
    var app = new mq.Routing();
    app.api = {};

    function fill_error(req, e) {
        var code = e.error.code;

        req.response.statusCode = code / 10000;
        req.response.json({
            code: e.error.cls ? code + e.error.cls * 100 : code,
            message: e.error.message
        });
    }

    function _(req, classname, func) {
        var arglen = arguments.length;
        var earg = _slice.call(arguments, 2, arglen - 1);
        func = arguments[arglen - 1];

        pool(db => {
            var data;

            // check empry data
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

            var _req = {
                session: req.session,
                query: req.query.toJSON()
            };

            var where = _req.query.where;
            if (where !== undefined)
                try {
                    _req.query.where = json.decode(where);
                } catch (e) {
                    return fill_error(req, err_info(4000003));
                }

            var keys = _req.query.keys;
            if (keys !== undefined)
                _req.query.keys = keys.split(',');

            var result = func.apply(undefined, [_req, db, cls].concat(earg, [data]));
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

    app.post('/:classname/:func', (req, classname, func) => {
        _(req, classname, (req, db, cls, data) => {
            if (!check_acl(req.session, func, cls.ACL))
                return err_info(4030001, {}, cls.cid);

            const f = cls.functions[func];
            if (f === undefined)
                return err_info(4040004, {
                    function: func,
                    classname: classname
                }, cls.cid);

            try {
                return f(req, data);
            } catch (e) {
                return err_info(5000002, {
                    function: func,
                    classname: classname
                }, cls.cid);
            }
        });
    });

    app.post('/', (req) => {
        if (req.firstHeader('Content-Type') === 'application/graphql') {
            pool(db => {
                var data = "";
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
                var r = new http.Request();
                r.method = q.method;

                var a = q.path.split('?');
                r.address = r.value = a[0];
                r.queryString = a[1];

                r.session = req.session;
                if (q.body)
                    r.json(q.body);
                mq.invoke(app, r);

                var p = r.response;
                if (p.statusCode / 100 !== 2)
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

    return app;
};