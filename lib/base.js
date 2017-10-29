const util = require('util');
const err = require('./err');
const check_acl = require('./check_acl');
const filter = require('./filter');
const _find = require('./find');
const _get = require('./get');

exports.bind = (_, api) => {
    api.post('/:classname', (req, classname) => {
        _(req, classname, (db, cls, data) => {
            if (!check_acl(req.session, "create", cls.ACL))
                err.API(119);

            var obj;

            var acl = cls.ACL;
            if (util.isFunction(acl))
                acl = acl();
            var oa = acl[":owner"];

            if (req.session.id !== undefined && oa !== undefined) {
                if (Array.isArray(data)) {
                    data.forEach(d => {
                        if (d.ACL === undefined) {
                            d.ACL = {};
                            d.ACL[req.session.id] = oa;
                        }
                    });
                } else {
                    if (data.ACL === undefined) {
                        var oa = acl[":owner"];
                        data.ACL = {};
                        data.ACL[req.session.id] = oa;
                    }
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

    api.put('/:classname/:id', (req, classname, id) => {
        _(req, classname, (db, cls, data) => {
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

    api.get('/:classname', (req, classname) => {
        _(req, classname, (db, cls) => {
            if (!check_acl(req.session, "find", cls.ACL))
                err.API(119);

            return _find(req, cls, cls.find(), 'read');
        });
    });
};