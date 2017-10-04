const mq = require('mq');
const util = require('util');
const json = require('json');
const orm = require('fib-orm');
const err = require('./err');

function filter(obj, keys) {
    var obj1 = {};
    var v;

    keys.forEach(k => (v = obj[k]) !== undefined ? obj1[k] = v : undefined);
    return obj1;
}

exports.api = pool => {
    var api = new mq.Routing();

    api.post('/:classname', (req, classname) => {
        pool((db) => {
            const cls = db.models[classname];
            if (cls === undefined) {
                err.API(req, 103);
                return;
            }

            var data;
            var obj;

            try {
                data = req.json();
            } catch (e) {
                err.API(req, 107);
                return;
            }

            try {
                obj = cls.createSync(data);
            } catch (e) {
                err.API(req, 119, e.message);
                return;
            }

            err.API(req, 201);

            if (Array.isArray(obj)) {
                req.response.json(obj.map(o => {
                    return {
                        id: o.id
                    };
                }));
            } else
                req.response.json({
                    id: obj.id
                });
        });
    });

    api.get('/:classname/:id', (req, classname, id) => {
        pool((db) => {
            const cls = db.models[classname];
            if (cls === undefined) {
                err.API(req, 103);
                return;
            }

            var obj;
            try {
                obj = cls.getSync(id);
            } catch (e) {
                err.API(req, 101);
                return;
            }

            var keys = req.query.keys;
            if (keys) {
                keys = keys.split(',');
                obj = filter(obj, keys);
            }

            req.response.json(obj);
        });
    });

    api.put('/:classname/:id', (req, classname, id) => {
        pool((db) => {
            const cls = db.models[classname];
            if (cls === undefined) {
                err.API(req, 103);
                return;
            }

            var data;
            var obj;

            try {
                obj = cls.getSync(id);
            } catch (e) {
                err.API(req, 101);
                return;
            }

            try {
                data = req.json();
            } catch (e) {
                err.API(req, 107);
                return;
            }

            for (var k in data)
                obj[k] = data[k];
            obj.saveSync();

            req.response.json({
                id: obj.id
            });
        });
    });

    api.del('/:classname/:id', (req, classname, id) => {
        pool((db) => {
            const cls = db.models[classname];
            if (cls === undefined) {
                err.API(req, 103);
                return;
            }

            var obj;
            try {
                obj = cls.getSync(id);
            } catch (e) {
                err.API(req, 101);
                return;
            }

            obj.removeSync();

            req.response.json({
                id: obj.id
            });
        });
    });

    api.get('/:classname', (req, classname) => {
        pool((db) => {
            const cls = db.models[classname];
            if (cls === undefined) {
                err.API(req, 103);
                return;
            }

            var where1 = {};
            var where = req.query.where;
            if (where !== undefined) {
                try {
                    where = json.decode(where);
                } catch (e) {
                    err.API(req, 107);
                    return;
                }

                for (var k in where) {
                    var v = where[k];

                    if (util.isArray(v))
                        where1[k] = v;
                    else if (util.isObject(v)) {
                        const keys = Object.keys(v);
                        if (keys.length !== 1) {
                            err.API(req, 102);
                            return;
                        }

                        var op = keys[0];

                        if (op === "$eq")
                            where1[k] = orm.eq(v[op]);
                        else if (op === "$ne")
                            where1[k] = orm.ne(v[op]);
                        else if (op === "$gt")
                            where1[k] = orm.gt(v[op]);
                        else if (op === "$gte")
                            where1[k] = orm.gte(v[op]);
                        else if (op === "$lt")
                            where1[k] = orm.lt(v[op]);
                        else if (op === "$lte")
                            where1[k] = orm.lte(v[op]);
                        else if (op === "$between") {
                            var a = v[op];
                            if (!util.isArray(a) || a.length !== 2) {
                                err.API(req, 102);
                                return;
                            }
                            where1[k] = orm.between(a[0], a[1]);
                        } else if (op === "$not_between") {
                            var a = v[op];
                            if (!util.isArray(a) || a.length !== 2) {
                                err.API(req, 102);
                                return;
                            }
                            where1[k] = orm.not_between(a[0], a[1]);
                        } else if (op === "$like")
                            where1[k] = orm.like(v[op]);
                        else if (op === "$not_like")
                            where1[k] = orm.not_like(v[op]);
                        else if (op === "$in")
                            where1[k] = v[op];
                        else if (op === "$not_in")
                            where1[k] = orm.not_in(v[op]);
                        else {
                            err.API(req, 102);
                            return;
                        }
                    } else
                        where1[k] = v;
                }
            }
            var exec = cls.find(where1);

            var order = req.query.order;
            if (order !== undefined)
                exec = exec.order(order);

            var skip = req.query.skip;
            if (skip !== undefined) {
                skip = +skip;
                if (isNaN(skip) || skip < 0) {
                    err.API(req, 118);
                    return;
                }
                exec = exec.offset(skip);
            }

            var limit = req.query.limit;
            if (limit !== undefined) {
                limit = +limit;
                if (isNaN(limit) || limit < 0) {
                    err.API(req, 118);
                    return;
                }

                exec = exec.limit(limit);
            }

            var objs;
            try {
                objs = exec.allSync();
            } catch (e) {
                err.API(req, 119, e.message);
                return;
            }

            var keys = req.query.keys;
            if (keys) {
                keys = keys.split(',');
                objs = objs.map(obj => filter(obj, keys));
            }

            req.response.json(objs);
        });
    });

    return api;
};