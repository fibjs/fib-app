const {
    check_acl,
    check_obj_acl
} = require('../utils/check_acl');
const {
    filter,
    filter_ext
} = require('../utils/filter');
const _find = require('../utils/find');
const err_info = require('../utils/err_info');
const {
    _get,
    _eget
} = require('../utils/get');

exports.bind = (_, app) => {
    var api = app.api;

    api.eput = (req, db, cls, id, extend, rid, data) => {
        var rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        var robj = _eget(cls, id, extend, rid, req.session, "write");
        if (robj.error)
            return robj;

        data = filter(data, robj.acl);

        var rdata;

        for (var k in rel_model.model.extends) {
            var r = data[k];

            if (r !== undefined) {
                rdata[k] = r;
                delete data[k];
            }
        }

        for (var k in data)
            robj.data[k] = data[k];

        robj.data.saveSync();

        return {
            success: {
                id: robj.data.id,
                updateAt: robj.data.updateAt
            }
        };
    };

    api.elink = (req, db, cls, id, extend, data) => {
        var rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        var obj = _get(cls, id, req.session, "write");
        if (obj.error)
            return obj;

        if (Array.isArray(obj.acl) && obj.acl.indexOf(extend) === -1)
            return err_info(4030001, {}, cls.cid);

        var rid = data.id;
        if (rid === undefined)
            return err_info(4040002, {
                id: rid,
                classname: extend
            }, rel_model.model.cid);

        var robj = _get(rel_model.model, rid, req.session, "read");
        if (robj.error)
            return robj;

        var _opt;
        if (rel_model.type === 'hasOne')
            _opt = obj.data.__opts.one_associations.find(a => a.name === extend).setAccessor;
        else
            _opt = obj.data.__opts.many_associations.find(a => a.name === extend).addAccessor;

        obj.data[_opt + 'Sync'].call(obj.data, robj.data);

        return {
            success: {
                id: obj.data.id,
                updateAt: obj.data.updateAt
            }
        };
    };

    api.epost = (req, db, cls, id, extend, data) => {
        var rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        var obj = _get(cls, id, req.session);
        if (obj.error)
            return obj;

        var acl = check_obj_acl(req.session, 'create', obj.data, extend);
        if (!acl)
            return err_info(4030001, {}, cls.cid);

        var _createBy = rel_model.model.extends['createBy'];
        var me;
        var _opt;

        if (_createBy !== undefined)
            me = _createBy.model.getSync(req.session.id);

        var robj;
        var rdata;

        if (Array.isArray(data)) {
            data = data.map(d => filter(d, acl));

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
            data = filter(data, acl);

            rdata = {};
            for (var k in cls.extends) {
                var r = data[k];

                if (r !== undefined) {
                    rdata[k] = r;
                    delete data[k];
                }
            }
        }

        if (rel_model.reversed) {
            obj.data[extend] = data;
            obj.data.saveSync();
            robj = obj.data[extend];
            if (!Array.isArray(data))
                robj = robj[0];
        } else
            robj = rel_model.model.createSync(data);

        if (me !== undefined) {
            if (Array.isArray(robj)) {
                _opt = robj[0].__opts.one_associations.find(a => a.name === 'createBy').setAccessor;
                robj.forEach(o => o[_opt + 'Sync'].call(o, me));
            } else {
                _opt = robj.__opts.one_associations.find(a => a.name === 'createBy').setAccessor;
                robj[_opt + 'Sync'].call(robj, me);
            }
        }

        if (Array.isArray(rdata)) {
            for (var i = 0; i < rdata.length; i++) {
                var rd = rdata[i];
                for (var k in rd) {
                    var res = api.epost(req, db, cls, robj[i].id, k, rd[k]);
                    if (res.error)
                        return res;
                }
            }
        } else {
            for (var k in rdata) {
                var res = api.epost(req, db, cls, robj.id, k, rdata[k]);
                if (res.error)
                    return res;
            }
        }

        if (!rel_model.reversed) {
            var _opt;
            if (rel_model.type === 'hasOne')
                _opt = obj.data.__opts.one_associations.find(a => a.name === extend).setAccessor;
            else
                _opt = obj.data.__opts.many_associations.find(a => a.name === extend).addAccessor;

            obj.data[_opt + 'Sync'].call(obj.data, robj);
        }

        if (Array.isArray(robj)) {
            return {
                status: 201,
                success: robj.map(o => {
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
                    id: robj.id,
                    createAt: robj.createAt
                }
            };
    };

    api.efind = (req, db, cls, id, extend) => {
        var rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        if (rel_model.type === 'hasOne' && !rel_model.reversed)
            return api.eget(req, db, cls, id, extend);

        var obj = _get(cls, id, req.session);
        if (obj.error)
            return obj;

        if (!check_obj_acl(req.session, 'find', obj.data, extend))
            return err_info(4030001, {}, rel_model.model.cid);

        var _association;
        if (rel_model.type === 'hasOne')
            _association = obj.data.__opts.one_associations.find(a => a.name === extend);
        else
            _association = obj.data.__opts.many_associations.find(a => a.name === extend);

        return {
            success: _find(req, obj.data[_association.getAccessor].call(obj.data), obj.data, extend)
        };
    };

    api.eget = (req, db, cls, id, extend, rid) => {
        var robj = _eget(cls, id, extend, rid, req.session, "read");
        if (robj.error)
            return robj;

        return {
            success: filter(filter_ext(req.session, robj.data), req.query.keys, robj.acl)
        };
    };

    api.edel = (req, db, cls, id, extend, rid) => {
        var robj = _eget(cls, id, extend, rid, req.session, "delete");
        if (robj.error)
            return robj;

        var rel_model = cls.extends[extend];

        if (rel_model.type === 'hasMany') {
            robj.base[robj.base.__opts.many_associations.find(a => a.name === extend).delAccessor + 'Sync'].call(robj.base, robj.data);

            return {
                success: {
                    id: robj.base.id,
                    updateAt: robj.base.updateAt
                }
            };
        }

        if (rel_model.type === 'hasOne') {
            robj.base[robj.base.__opts.one_associations.find(a => a.name === extend).delAccessor + 'Sync'].call(robj.base);

            return {
                success: {
                    id: robj.base.id,
                    updateAt: robj.base.updateAt
                }
            };
        }
    };

    app.put('/:classname/:id/:extend', (req, classname, id, extend) => _(req, classname, id, extend, api.elink));
    app.put('/:classname/:id/:extend/:rid', (req, classname, id, extend, rid) => _(req, classname, id, extend, rid, api.eput));
    app.post('/:classname/:id/:extend', (req, classname, id, extend) => _(req, classname, id, extend, api.epost));
    app.get('/:classname/:id/:extend', (req, classname, id, extend) => _(req, classname, id, extend, api.efind));
    app.get('/:classname/:id/:extend/:rid', (req, classname, id, extend, rid) => _(req, classname, id, extend, rid, api.eget));
    app.del('/:classname/:id/:extend/:rid', (req, classname, id, extend, rid) => _(req, classname, id, extend, rid, api.edel));
};