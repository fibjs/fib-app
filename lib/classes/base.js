const util = require('util');
const err_info = require('../utils/err_info');
const check_acl = require('../utils/check_acl');
const filter = require('../utils/filter');
const _find = require('../utils/find');
const _get = require('../utils/get');

exports.bind = (_, api) => {
    api.post('/:classname', (req, classname) => {
        _(req, classname, (req, db, cls, data) => {
            if (!check_acl(req.session, "create", cls.ACL))
                return err_info(4030001, {}, cls.cid);

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

            if (Array.isArray(data))
                data.forEach(d => d.createBy = {
                    id: req.session.id
                });
            else
                data.createBy = {
                    id: req.session.id
                };

            obj = cls.createSync(data);

            if (Array.isArray(obj)) {
                return {
                    status: 201,
                    success: obj.map(o => {
                        return {
                            id: o.id,
                            createAt: o.createAt

                        };
                    })
                };
            } else
                return {
                    status: 201,
                    success: {
                        id: obj.id,
                        createAt: obj.createAt
                    }
                };
        });
    });

    api.get('/:classname/:id', (req, classname, id) => {
        _(req, classname, (req, db, cls) => {
            var keys = req.query.keys;
            if (keys !== undefined)
                keys = keys.split(',');

            var obj = _get(cls, id, req.session, "read");
            if (obj.error)
                return obj;

            if (Array.isArray(obj.acl))
                keys = keys !== undefined ? util.intersection(keys, obj.acl) : obj.acl;
            return {
                success: keys !== undefined ? filter(obj.data, keys) : obj.data
            };
        });
    });

    api.put('/:classname/:id', (req, classname, id) => {
        _(req, classname, (req, db, cls, data) => {
            var obj = _get(cls, id, req.session, "write");
            if (obj.error)
                return obj;

            if (Array.isArray(obj.acl))
                data = filter(data, obj.acl);

            for (var k in data)
                obj.data[k] = data[k];

            obj.data.saveSync();

            return {
                success: {
                    id: obj.data.id,
                    updateAt: obj.data.updateAt
                }
            };
        });
    });

    api.del('/:classname/:id', (req, classname, id) => {
        _(req, classname, (req, db, cls) => {
            var obj = _get(cls, id, req.session, "delete");
            if (obj.error)
                return obj;

            obj.data.removeSync();

            return {
                success: {
                    id: obj.data.id
                }
            };
        });
    });

    api.get('/:classname', (req, classname) => {
        _(req, classname, (req, db, cls) => {
            if (!check_acl(req.session, "find", cls.ACL))
                return err_info(4030001, {}, cls.cid);

            return {
                success: _find(req, cls, cls.find(), 'read')
            };
        });
    });
};