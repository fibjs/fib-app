const mq = require('mq');
const util = require('util');
const http = require('http');
const orm = require('fib-orm');
const err = require('./err');
const check_acl = require('./check_acl');
const filter = require('./filter');
const _find = require('./find');
const _get = require('./get');

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

    api.post('/:classname', (req, classname) => {
        _(req, classname, (db, cls, data) => {
            if (data === undefined)
                err.API(107);

            if (!check_acl(req.session, "create", cls.ACL))
                err.API(119);

            var obj;

            if (data.ACL === undefined && req.session.id !== undefined) {
                var acl = cls.ACL;
                if (util.isFunction(acl))
                    acl = acl();

                var oa = acl[":owner"];
                if (oa !== undefined) {
                    data.ACL = {};
                    data.ACL[req.session.id] = oa;
                }
            }

            obj = cls.createSync(data);

            req.response.writeHead(201, "Created");

            if (Array.isArray(obj)) {
                return obj.map(o => {
                    return {
                        id: o.id,
                        createAt: o.createAt
                    };
                });
            } else
                return {
                    id: obj.id,
                    createAt: obj.createAt
                };
        });
    });

    api.get('/:classname/:id', (req, classname, id) => {
        _(req, classname, (db, cls) => {
            var keys = req.query.keys;
            if (keys !== undefined)
                keys = keys.split(',');

            var obj = _get(cls, id, keys);

            var a = check_acl(req.session, "read", cls.ACL, obj.ACL);
            if (!a)
                err.API(119);

            if (Array.isArray(a))
                keys = keys !== undefined ? util.intersection(keys, a) : a;
            return keys !== undefined ? filter(obj, keys) : obj;
        });
    });

    api.get('/:classname/:id/:relation', (req, classname, id, relation) => {
        _(req, classname, (db, cls) => {
            var rel_model = cls.relations[relation];
            if (rel_model === undefined)
                err.API(102);

            var obj = _get(cls, id);

            var a = check_acl(req.session, "read", cls.ACL, obj.ACL);
            if (!a)
                err.API(119);

            if (Array.isArray(a) && a.indexOf(relation) === -1)
                err.API(119);

            var _association;

            if (rel_model.type === 'hasOne') {
                _association = obj.__opts.one_associations.find(a => a.name === relation);
                var keys = req.query.keys;
                if (keys !== undefined)
                    keys = keys.split(',');

                var rid = obj[Object.keys(_association.field)[0]];
                var obj_relation = _get(_association.model, rid, keys);

                var a = check_acl(req.session, "+read", _association.model.ACL, obj_relation.ACL);
                if (!a)
                    err.API(119);

                if (Array.isArray(a))
                    keys = keys !== undefined ? util.intersection(keys, a) : a;
                return keys !== undefined ? filter(obj_relation, keys) : obj_relation;
            }

            if (rel_model.type === 'hasMany') {
                _association = obj.__opts.many_associations.find(a => a.name === relation);
                var cls_relation = _association.model;
                if (!check_acl(req.session, "+find", cls_relation.ACL))
                    err.API(119);

                return _find(req, cls_relation, obj[_association.getAccessor].call(obj), '+read');
            }

            err.API(103);
        });
    });

    api.put('/:classname/:id', (req, classname, id) => {
        _(req, classname, (db, cls, data) => {
            if (data === undefined)
                err.API(107);

            var obj = _get(cls, id, Object.keys(data));

            var a = check_acl(req.session, "write", cls.ACL, obj.ACL);
            if (!a)
                err.API(119);

            if (Array.isArray(a))
                data = filter(data, a);

            for (var k in data)
                obj[k] = data[k];

            obj.saveSync();

            return {
                id: obj.id,
                updateAt: obj.updateAt
            };
        });
    });

    api.put('/:classname/:id/:relation', (req, classname, id, relation) => {
        _(req, classname, (db, cls, data) => {
            if (data === undefined)
                err.API(107);

            var rid = data.id;
            if (rid === undefined)
                err.API(107);

            var rel_model = cls.relations[relation];
            if (rel_model === undefined)
                err.API(102);

            var obj = _get(cls, id, []);

            var a = check_acl(req.session, "write", cls.ACL, obj.ACL);
            if (!a)
                err.API(119);

            if (Array.isArray(a) && a.indexOf(relation) === -1)
                err.API(119);

            var _association;

            if (rel_model.type === 'hasOne') {
                _association = obj.__opts.one_associations.find(a => a.name === relation);
                var obj_relation = _get(_association.model, rid, []);

                var a = check_acl(req.session, "read", _association.model.ACL, obj_relation.ACL);
                if (!a)
                    err.API(119);

                obj[_association.setAccessor + 'Sync'].call(obj, obj_relation);

                return {
                    id: obj.id,
                    updateAt: obj.updateAt
                };
            }

            if (rel_model.type === 'hasMany') {
                _association = obj.__opts.many_associations.find(a => a.name === relation);
                var obj_relation = _get(_association.model, rid, []);

                var a = check_acl(req.session, "read", _association.model.ACL, obj_relation.ACL);
                if (!a)
                    err.API(119);

                obj[_association.addAccessor + 'Sync'].call(obj, obj_relation);

                return {
                    id: obj.id,
                    updateAt: obj.updateAt
                };
            }

            err.API(103);
        });
    });

    api.del('/:classname/:id', (req, classname, id) => {
        _(req, classname, (db, cls) => {
            var obj = _get(cls, id, []);

            if (!check_acl(req.session, "delete", cls.ACL, obj.ACL))
                err.API(119);

            obj.removeSync();

            return {
                id: obj.id
            };
        });
    });

    api.del('/:classname/:id/:relation', (req, classname, id, relation) => {
        _(req, classname, (db, cls) => {
            var rel_model = cls.relations[relation];
            if (rel_model === undefined)
                err.API(102);

            var obj = _get(cls, id);

            var a = check_acl(req.session, "write", cls.ACL, obj.ACL);
            if (!a)
                err.API(119);

            if (Array.isArray(a) && a.indexOf(relation) === -1)
                err.API(119);

            if (rel_model.type === 'hasOne') {
                var _association = obj.__opts.one_associations.find(a => a.name === relation);
                obj[_association.delAccessor + 'Sync'].call(obj);

                return {
                    id: obj.id,
                    updateAt: obj.updateAt
                };
            }

            err.API(103);
        });
    });

    api.del('/:classname/:id/:relation/:rid', (req, classname, id, relation, rid) => {
        _(req, classname, (db, cls) => {
            var rel_model = cls.relations[relation];
            if (rel_model === undefined)
                err.API(102);

            var obj = _get(cls, id);

            var a = check_acl(req.session, "write", cls.ACL, obj.ACL);
            if (!a)
                err.API(119);

            if (Array.isArray(a) && a.indexOf(relation) === -1)
                err.API(119);

            if (rel_model.type === 'hasMany') {
                var _association = obj.__opts.many_associations.find(a => a.name === relation);
                var obj_relation = _get(_association.model, rid, []);

                obj[_association.delAccessor + 'Sync'].call(obj, obj_relation);

                return {
                    id: obj.id,
                    updateAt: obj.updateAt
                };
            }

            err.API(103);
        });
    });

    api.get('/:classname', (req, classname) => {
        _(req, classname, (db, cls) => {
            if (!check_acl(req.session, "find", cls.ACL))
                err.API(119);

            return _find(req, cls, cls.find(), 'read');
        });
    });

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