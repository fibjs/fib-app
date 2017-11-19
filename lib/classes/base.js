const util = require('util');
const err_info = require('../utils/err_info');
const check_acl = require('../utils/check_acl');
const filter = require('../utils/filter');
const _find = require('../utils/find');
const _get = require('../utils/get');

exports.bind = (_, app) => {
    var api = app.api;

    api.post = (req, db, cls, data) => {
        if (!check_acl(req.session, "create", cls.ACL))
            return err_info(4030001, {}, cls.cid);

        var _createBy = cls.extends['createBy'];
        var me;
        var _opt;
        var rdata;

        if (_createBy !== undefined)
            me = _createBy.model.getSync(req.session.id);

        if (Array.isArray(data)) {
            rdata = [];
            data.forEach(d => {
                var rd = {};
                rdata.push(rd);

                for (var k in cls.extends) {
                    var r = d[k];

                    if (r !== undefined) {
                        rd[k] = r;
                        delete d[k];
                    }
                }
            });
        } else {
            rdata = {};
            for (var k in cls.extends) {
                var r = data[k];

                if (r !== undefined) {
                    rdata[k] = r;
                    delete data[k];
                }
            }
        }

        var obj = cls.createSync(data);

        if (me !== undefined) {
            if (Array.isArray(obj)) {
                _opt = obj[0].__opts.one_associations.find(a => a.name === 'createBy').setAccessor;
                obj.forEach(o => o[_opt + 'Sync'].call(o, me));
            } else {
                _opt = obj.__opts.one_associations.find(a => a.name === 'createBy').setAccessor;
                obj[_opt + 'Sync'].call(obj, me);
            }
        }

        if (Array.isArray(rdata)) {
            for (var i = 0; i < rdata.length; i++) {
                var rd = rdata[i];
                for (var k in rd) {
                    var res = api.rpost(req, db, cls, obj[i].id, k, rd[k]);
                    if (res.error)
                        return res;
                }
            }
        } else {
            for (var k in rdata) {
                var res = api.rpost(req, db, cls, obj.id, k, rdata[k]);
                if (res.error)
                    return res;
            }
        }

        if (Array.isArray(obj))
            return {
                status: 201,
                success: obj.map(o => {
                    return {
                        id: o.id,
                        createAt: o.createAt
                    };
                })
            };
        else
            return {
                status: 201,
                success: {
                    id: obj.id,
                    createAt: obj.createAt
                }
            };
    };

    api.get = (req, db, cls, id) => {
        var keys = req.query.keys;
        if (keys !== undefined)
            keys = keys.split(',');

        var obj = _get(cls, null, 'find', id, req.session, "read");
        if (obj.error)
            return obj;

        if (Array.isArray(obj.acl))
            keys = keys !== undefined ? util.intersection(keys, obj.acl) : obj.acl;
        return {
            success: keys !== undefined ? filter(obj.data, keys) : obj.data
        };
    };

    api.put = (req, db, cls, id, data) => {
        var obj = _get(cls, null, 'find', id, req.session, "write");
        if (obj.error)
            return obj;

        if (Array.isArray(obj.acl))
            data = filter(data, obj.acl);

        var rdata;

        for (var k in cls.extends) {
            var r = data[k];

            if (r !== undefined) {
                rdata[k] = r;
                delete data[k];
            }
        }

        for (var k in data)
            obj.data[k] = data[k];

        obj.data.saveSync();

        return {
            success: {
                id: obj.data.id,
                updateAt: obj.data.updateAt
            }
        };
    };

    api.del = (req, db, cls, id) => {
        var obj = _get(cls, null, 'find', id, req.session, "delete");
        if (obj.error)
            return obj;

        obj.data.removeSync();

        return {
            success: {
                id: obj.data.id
            }
        };
    };

    api.find = (req, db, cls) => {
        if (!check_acl(req.session, "find", cls.ACL))
            return err_info(4030001, {}, cls.cid);

        return {
            success: _find(req, cls, cls.find(), 'read')
        };
    };

    app.post('/:classname', (req, classname) => _(req, classname, api.post));
    app.get('/:classname/:id', (req, classname, id) => _(req, classname, id, api.get));
    app.put('/:classname/:id', (req, classname, id) => _(req, classname, id, api.put));
    app.del('/:classname/:id', (req, classname, id) => _(req, classname, id, api.del));
    app.get('/:classname', (req, classname) => _(req, classname, api.find));
};