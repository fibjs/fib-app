const util = require('util');
const check_acl = require('../utils/check_acl');
const filter = require('../utils/filter');
const _find = require('../utils/find');
const err_info = require('../utils/err_info');
const {
    _get,
    _eget
} = require('../utils/get');

exports.bind = (_, app) => {
    var api = app.api;

    api.rput = (req, db, cls, id, extend, rid, data) => {
        var rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        var obj = _get(cls, id, req.session, "write", extend);
        if (obj.error)
            return obj;

        var robj = _eget(obj.data, extend, rid, req.session, "write");
        if (robj.error)
            return robj;

        if (Array.isArray(robj.acl))
            data = filter(data, robj.acl);

        for (var k in data)
            robj.data[k] = data[k];

        var rdata;

        for (var k in rel_model.model.extends) {
            var r = data[k];

            if (r !== undefined) {
                rdata[k] = r;
                delete data[k];
            }
        }

        robj.data.saveSync();

        return {
            success: {
                id: robj.data.id,
                updateAt: robj.data.updateAt
            }
        };
    };

    api.rlink = (req, db, cls, id, extend, data) => {
        var rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        var obj = _get(cls, id, req.session, "write", extend);
        if (obj.error)
            return obj;

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

    api.rpost = (req, db, cls, id, extend, data) => {
        var rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        if (!check_acl(req.session, "+create", rel_model.model.ACL))
            return err_info(4030001, {}, rel_model.model.cid);

        var obj = _get(cls, id, req.session, "write", extend);
        if (obj.error)
            return obj;

        var _createBy = rel_model.model.extends['createBy'];
        var me;
        var _opt;

        if (_createBy !== undefined)
            me = _createBy.model.getSync(req.session.id);

        var robj;
        var rdata;

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
                    var res = api.rpost(req, db, cls, robj[i].id, k, rd[k]);
                    if (res.error)
                        return res;
                }
            }
        } else {
            for (var k in rdata) {
                var res = api.rpost(req, db, cls, robj.id, k, rdata[k]);
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

    api.rfind = (req, db, cls, id, extend) => {
        var rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        var obj = _get(cls, id, req.session, "read", extend);
        if (obj.error)
            return obj;

        var _association;

        if (rel_model.type === 'hasOne') {
            _association = obj.data.__opts.one_associations.find(a => a.name === extend);
            if (!_association.reversed) {
                var keys = req.query.keys;
                if (keys !== undefined)
                    keys = keys.split(',');

                var rid = obj.data[Object.keys(_association.field)[0]];
                var robj = _get(rel_model.model, rid, req.session, "+read");
                if (robj.error)
                    return robj;

                if (Array.isArray(robj.acl))
                    keys = keys !== undefined ? util.intersection(keys, robj.acl) : robj.acl;
                return {
                    success: keys !== undefined ? filter(robj.data, keys) : robj.data
                };
            }
        }

        if (!check_acl(req.session, "+find", rel_model.model.ACL))
            return err_info(4030001, {}, rel_model.model.cid);

        if (_association === undefined)
            _association = obj.data.__opts.many_associations.find(a => a.name === extend);

        return {
            success: _find(req, rel_model.model, obj.data[_association.getAccessor].call(obj.data), '+read')
        };
    };

    api.rget = (req, db, cls, id, extend, rid) => {
        var rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        var obj = _get(cls, id, req.session, "read", extend);
        if (obj.error)
            return obj;

        var keys = req.query.keys;
        if (keys !== undefined)
            keys = keys.split(',');

        var robj = _eget(obj.data, extend, rid, req.session, "read");
        if (robj.error)
            return robj;

        if (Array.isArray(robj.acl))
            keys = keys !== undefined ? util.intersection(keys, robj.acl) : robj.acl;
        return {
            success: keys !== undefined ? filter(robj.data, keys) : robj.data
        };
    };

    api.rdel = (req, db, cls, id, extend, rid) => {
        var rel_model = cls.extends[extend];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: extend
            });

        var obj = _get(cls, id, req.session, "write", extend);
        if (obj.error)
            return obj;

        if (rel_model.type === 'hasMany') {
            var robj = _get(rel_model.model, rid);
            if (robj.error)
                return robj;

            obj.data[obj.data.__opts.many_associations.find(a => a.name === extend).delAccessor + 'Sync'].call(obj.data, robj.data);

            return {
                success: {
                    id: obj.data.id,
                    updateAt: obj.data.updateAt
                }
            };
        }

        if (rel_model.type === 'hasOne') {
            obj.data[obj.data.__opts.one_associations.find(a => a.name === extend).delAccessor + 'Sync'].call(obj.data);

            return {
                success: {
                    id: obj.data.id,
                    updateAt: obj.data.updateAt
                }
            };
        }
    };

    app.put('/:classname/:id/:extend', (req, classname, id, extend) => _(req, classname, id, extend, api.rlink));
    app.put('/:classname/:id/:extend/:rid', (req, classname, id, extend, rid) => _(req, classname, id, extend, rid, api.rput));
    app.post('/:classname/:id/:extend', (req, classname, id, extend) => _(req, classname, id, extend, api.rpost));
    app.get('/:classname/:id/:extend', (req, classname, id, extend) => _(req, classname, id, extend, api.rfind));
    app.get('/:classname/:id/:extend/:rid', (req, classname, id, extend, rid) => _(req, classname, id, extend, rid, api.rget));
    app.del('/:classname/:id/:extend/:rid', (req, classname, id, extend, rid) => _(req, classname, id, extend, rid, api.rdel));
};