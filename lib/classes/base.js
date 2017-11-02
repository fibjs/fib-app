const util = require('util');
const err_info = require('../utils/err_info');
const check_acl = require('../utils/check_acl');
const filter = require('../utils/filter');
const _find = require('../utils/find');

function getObject(cls, id) {
    try {
        return cls.getSync(id)
    } catch (e) {
        return null;
    }
}

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

            var obj = getObject(cls, id);
            if (obj === null)
                return err_info(4040002, {
                    id: id,
                    classname: classname
                }, cls.cid);

            var a = check_acl(req.session, "read", cls.ACL, obj.ACL);
            if (!a)
                return err_info(4030001, {}, cls.cid);

            if (Array.isArray(a))
                keys = keys !== undefined ? util.intersection(keys, a) : a;
            return {
                success: keys !== undefined ? filter(obj, keys) : obj
            };
        });
    });

    api.put('/:classname/:id', (req, classname, id) => {
        _(req, classname, (req, db, cls, data) => {
            var obj = getObject(cls, id);
            if (obj === null)
                return err_info(4040002, {
                    id: id,
                    classname: classname
                }, cls.cid);

            var a = check_acl(req.session, "write", cls.ACL, obj.ACL);
            if (!a)
                return err_info(4030001, {}, cls.cid);

            if (Array.isArray(a))
                data = filter(data, a);

            for (var k in data)
                obj[k] = data[k];

            obj.saveSync();

            return {
                success: {
                    id: obj.id,
                    updateAt: obj.updateAt
                }
            };
        });
    });

    api.del('/:classname/:id', (req, classname, id) => {
        _(req, classname, (req, db, cls) => {
            var obj = getObject(cls, id);
            if (obj === null)
                return err_info(4040002, {
                    id: id,
                    classname: classname
                }, cls.cid);

            if (!check_acl(req.session, "delete", cls.ACL, obj.ACL))
                return err_info(4030001, {}, cls.cid);

            obj.removeSync();

            return {
                success: {
                    id: obj.id
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