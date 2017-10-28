const mq = require('mq');
const util = require('util');
const http = require('http');
const err = require('./err');
const check_acl = require('./check_acl');
const _base = require('./base');
const _relation = require('./relation');

module.exports = pool => {
    var api = new mq.Routing();

    function _(req, classname, func) {
        pool(db => {
            try {
                const cls = db.models[classname];
                if (cls === undefined)
                    err.API(103);

                var data;
                if (req.length > 0)
                    try {
                        data = req.json();
                    } catch (e) {
                        err.API(107, e.message);
                    }

                var result = func(db, cls, data);
                if (result !== undefined)
                    req.response.json(result);
            } catch (e) {
                if (!e.code)
                    e.code = 119;

                req.response.writeHead(e.code, e.message);

                req.response.json({
                    code: e.code,
                    descript: e.descript
                });
            }
        });
    }

    _base.bind(_, api);
    _relation.bind(_, api);

    api.post('/:classname/:func', (req, classname, func) => {
        _(req, classname, (db, cls, data) => {
            if (!check_acl(req.session, func, cls.ACL))
                err.API(119);

            const f = cls.functions[func];
            if (f === undefined)
                err.API(141);

            try {
                return f(req, data);
            } catch (e) {
                err.API(500, e.message);
            }
        });
    });

    api.post('/', (req) => {
        if (req.firstHeader('Content-Type') === 'application/graphql') {
            pool(db => {
                try {
                    var data;
                    try {
                        data = req.data.toString();
                    } catch (e) {
                        err.API(107, e.message);
                    }

                    req.response.json(db.graphql(data, req));
                } catch (e) {
                    if (!e.code)
                        e.code = 119;

                    req.response.writeHead(e.code, e.message);

                    req.response.json({
                        code: e.code,
                        descript: e.descript
                    });
                }
            });
        } else {
            try {
                var querys;
                try {
                    querys = req.json().requests;
                } catch (e) {
                    err.API(107, e.message);
                }
                if (!Array.isArray(querys))
                    err.API(102);

                var results = querys.map(q => {
                    var r = new http.Request();
                    r.method = q.method;

                    var a = q.path.split('?');
                    r.address = r.value = a[0];
                    r.queryString = a[1];

                    r.session = req.session;
                    if (q.body)
                        r.json(q.body);
                    mq.invoke(api, r);

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
            } catch (e) {
                if (!e.code)
                    e.code = 119;

                req.response.writeHead(e.code, e.message);

                req.response.json({
                    code: e.code,
                    descript: e.descript
                });
            }
        }
    });

    return api;
};