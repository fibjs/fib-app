const util = require('util');
const check_acl = require('../utils/check_acl');
const filter = require('../utils/filter');
const _find = require('../utils/find');
const err_info = require('../utils/err_info');
const _get = require('../utils/get');

exports.bind = (_, app) => {
    var api = app.api;

    api.rput = (req, db, cls, id, relation, rid, data) => {
        var rel_model = cls.relations[relation];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: relation
            });

        var obj = _get(cls, id, req.session, "write", relation);
        if (obj.error)
            return obj;

        if (data == undefined) {
            data = rid;
            rid = undefined;

            var rid = data.id;
            if (rid === undefined)
                return err_info(4040002, {
                    id: rid,
                    classname: relation
                }, rel_model.model.cid);

            var robj = _get(rel_model.model, rid, req.session, "read");
            if (robj.error)
                return robj;

            var _opt;
            if (rel_model.type === 'hasOne')
                _opt = obj.data.__opts.one_associations.find(a => a.name === relation).setAccessor;
            else
                _opt = obj.data.__opts.many_associations.find(a => a.name === relation).addAccessor;

            obj.data[_opt + 'Sync'].call(obj.data, robj.data);

            return {
                success: {
                    id: obj.data.id,
                    updateAt: obj.data.updateAt
                }
            };
        } else {
            if (rel_model.type === 'hasOne') {
                if (Number(rid) !== obj.data[Object.keys(obj.data.__opts.one_associations.find(a => a.name === relation).field)[0]])
                    return err_info(4040002, {
                        id: rid,
                        classname: relation
                    }, rel_model.model.cid);
            } else {
                if (!obj.data[obj.data.__opts.many_associations.find(a => a.name === relation).hasAccessor + 'Sync'].call(obj.data, {
                        id: rid
                    }))
                    return err_info(4040002, {
                        id: rid,
                        classname: relation
                    }, rel_model.model.cid);
            }

            var robj = _get(rel_model.model, rid, req.session, "+write");
            if (robj.error)
                return robj;

            if (Array.isArray(robj.acl))
                data = filter(data, robj.acl);

            for (var k in data)
                robj.data[k] = data[k];

            robj.data.saveSync();

            return {
                success: {
                    id: robj.data.id,
                    updateAt: robj.data.updateAt
                }
            };
        }
    };

    api.rpost = (req, db, cls, id, relation, data) => {
        var rel_model = cls.relations[relation];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: relation
            });

        if (!check_acl(req.session, "+create", rel_model.model.ACL))
            return err_info(4030001, {}, rel_model.model.cid);

        var obj = _get(cls, id, req.session, "write", relation);
        if (obj.error)
            return obj;

        var acl = rel_model.model.ACL;
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

        var robj = rel_model.model.createSync(data);

        var _opt;
        if (rel_model.type === 'hasOne')
            _opt = obj.data.__opts.one_associations.find(a => a.name === relation).setAccessor;
        else
            _opt = obj.data.__opts.many_associations.find(a => a.name === relation).addAccessor;

        obj.data[_opt + 'Sync'].call(obj.data, robj);

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

    api.rfind = (req, db, cls, id, relation) => {
        var rel_model = cls.relations[relation];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: relation
            });

        var obj = _get(cls, id, req.session, "read", relation);
        if (obj.error)
            return obj;

        var _association;

        if (rel_model.type === 'hasOne') {
            _association = obj.data.__opts.one_associations.find(a => a.name === relation);
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
            _association = obj.data.__opts.many_associations.find(a => a.name === relation);

        return {
            success: _find(req, rel_model.model, obj.data[_association.getAccessor].call(obj.data), '+read')
        };
    };

    api.rget = (req, db, cls, id, relation, rid) => {
        var rel_model = cls.relations[relation];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: relation
            });

        var obj = _get(cls, id, req.session, "read", relation);
        if (obj.error)
            return obj;

        var keys = req.query.keys;
        if (keys !== undefined)
            keys = keys.split(',');

        if (rel_model.type === 'hasOne') {
            if (rid != obj.data[Object.keys(obj.data.__opts.one_associations.find(a => a.name === relation).field)[0]])
                return err_info(4040002, {
                    id: rid,
                    classname: relation
                }, rel_model.model.cid);
        } else {
            if (!obj.data[obj.data.__opts.many_associations.find(a => a.name === relation).hasAccessor + 'Sync'].call(obj.data, {
                    id: rid
                }))
                return err_info(4040002, {
                    id: rid,
                    classname: relation
                }, rel_model.model.cid);
        }

        var robj = _get(rel_model.model, rid, req.session, "+read");
        if (robj.error)
            return robj;

        if (Array.isArray(robj.acl))
            keys = keys !== undefined ? util.intersection(keys, robj.acl) : robj.acl;
        return {
            success: keys !== undefined ? filter(robj.data, keys) : robj.data
        };
    };

    api.rdel = (req, db, cls, id, relation, rid) => {
        var rel_model = cls.relations[relation];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: relation
            });

        var obj = _get(cls, id, req.session, "write", relation);
        if (obj.error)
            return obj;

        if (rel_model.type === 'hasMany') {
            var robj = _get(rel_model.model, rid);
            if (robj.error)
                return robj;

            obj.data[obj.data.__opts.many_associations.find(a => a.name === relation).delAccessor + 'Sync'].call(obj.data, robj.data);

            return {
                success: {
                    id: obj.data.id,
                    updateAt: obj.data.updateAt
                }
            };
        }

        if (rel_model.type === 'hasOne') {
            obj.data[obj.data.__opts.one_associations.find(a => a.name === relation).delAccessor + 'Sync'].call(obj.data);

            return {
                success: {
                    id: obj.data.id,
                    updateAt: obj.data.updateAt
                }
            };
        }
    };

    app.put('/:classname/:id/:relation', (req, classname, id, relation) => _(req, classname, id, relation, api.rput));
    app.put('/:classname/:id/:relation/:rid', (req, classname, id, relation, rid) => _(req, classname, id, relation, rid, api.rput));
    app.post('/:classname/:id/:relation', (req, classname, id, relation) => _(req, classname, id, relation, api.rpost));
    app.get('/:classname/:id/:relation', (req, classname, id, relation) => _(req, classname, id, relation, api.rfind));
    app.get('/:classname/:id/:relation/:rid', (req, classname, id, relation, rid) => _(req, classname, id, relation, rid, api.rget));
    app.del('/:classname/:id/:relation/:rid', (req, classname, id, relation, rid) => _(req, classname, id, relation, rid, api.rdel));
};