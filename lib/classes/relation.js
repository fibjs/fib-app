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

        var obj = _get(cls, null, 'find', id, req.session, "write", relation);
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

            var robj = _get(rel_model.model, null, 'find', rid, req.session, "read");
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
                if (rel_model.reversed) {
                    var robj = _get(rel_model.model, obj.data, obj.data.__opts.one_associations.find(a => a.name === relation).getAccessor, rid, req.session, "+write");
                    if (robj.error)
                        return robj;
                } else {
                    if (rid != obj.data[Object.keys(obj.data.__opts.one_associations.find(a => a.name === relation).field)[0]])
                        return err_info(4040002, {
                            id: rid,
                            classname: relation
                        }, rel_model.model.cid);

                    var robj = _get(rel_model.model, null, 'find', rid, req.session, "+write");
                    if (robj.error)
                        return robj;
                }
            } else {
                var robj = _get(rel_model.model, obj.data, obj.data.__opts.many_associations.find(a => a.name === relation).getAccessor, rid, req.session, "+write");
                if (robj.error)
                    return robj;
            }

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

        var obj = _get(cls, null, 'find', id, req.session, "write", relation);
        if (obj.error)
            return obj;

        var _createBy = rel_model.model.relations['createBy'];
        var me;
        var _opt;

        if (_createBy !== undefined)
            me = _createBy.model.getSync(req.session.id);

        var robj;

        if (rel_model.reversed) {
            obj.data[relation] = data;
            obj.data.saveSync();
            robj = obj.data[relation];
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

        if (!rel_model.reversed) {
            var _opt;
            if (rel_model.type === 'hasOne')
                _opt = obj.data.__opts.one_associations.find(a => a.name === relation).setAccessor;
            else
                _opt = obj.data.__opts.many_associations.find(a => a.name === relation).addAccessor;

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

    api.rfind = (req, db, cls, id, relation) => {
        var rel_model = cls.relations[relation];
        if (rel_model === undefined)
            return err_info(4040001, {
                classname: relation
            });

        var obj = _get(cls, null, 'find', id, req.session, "read", relation);
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
                var robj = _get(rel_model.model, null, 'find', rid, req.session, "+read");
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

        var obj = _get(cls, null, 'find', id, req.session, "read", relation);
        if (obj.error)
            return obj;

        var keys = req.query.keys;
        if (keys !== undefined)
            keys = keys.split(',');

        if (rel_model.type === 'hasOne') {
            if (rel_model.reversed) {
                var robj = _get(rel_model.model, obj.data, obj.data.__opts.one_associations.find(a => a.name === relation).getAccessor, rid, req.session, "+read");
                if (robj.error)
                    return robj;
            } else {
                if (rid != obj.data[Object.keys(obj.data.__opts.one_associations.find(a => a.name === relation).field)[0]])
                    return err_info(4040002, {
                        id: rid,
                        classname: relation
                    }, rel_model.model.cid);

                var robj = _get(rel_model.model, null, 'find', rid, req.session, "+read");
                if (robj.error)
                    return robj;
            }
        } else {
            var robj = _get(rel_model.model, obj.data, obj.data.__opts.many_associations.find(a => a.name === relation).getAccessor, rid, req.session, "+read");
            if (robj.error)
                return robj;
        }

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

        var obj = _get(cls, null, 'find', id, req.session, "write", relation);
        if (obj.error)
            return obj;

        if (rel_model.type === 'hasMany') {
            var robj = _get(rel_model.model, null, 'find', rid);
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