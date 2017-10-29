const util = require('util');
const err = require('./err');
const check_acl = require('./check_acl');
const filter = require('./filter');
const _find = require('./find');
const _get = require('./get');

exports.bind = (_, api) => {
    api.put('/:classname/:id/:relation', (req, classname, id, relation) => {
        _(req, classname, (db, cls, data) => {
            var rel_model = cls.relations[relation];
            if (rel_model === undefined)
                err.API(102);

            var obj = _get(cls, id, []);
            var a = check_acl(req.session, "write", cls.ACL, obj.ACL);
            if (!a)
                err.API(119);

            if (Array.isArray(a) && a.indexOf(relation) === -1)
                err.API(119);

            var rid = data.id;
            if (rid === undefined)
                err.API(107);

            var robj = _get(rel_model.model, rid, []);
            var a = check_acl(req.session, "read", rel_model.model.ACL, robj.ACL);
            if (!a)
                err.API(119);

            var _opt;
            if (rel_model.type === 'hasOne')
                _opt = obj.__opts.one_associations.find(a => a.name === relation).setAccessor;
            else if (rel_model.type === 'hasMany')
                _opt = obj.__opts.many_associations.find(a => a.name === relation).addAccessor;
            else
                err.API(103);

            obj[_opt + 'Sync'].call(obj, robj);

            return {
                id: obj.id,
                updateAt: obj.updateAt
            };

        });
    });

    api.post('/:classname/:id/:relation', (req, classname, id, relation) => {
        _(req, classname, (db, cls, data) => {
            var rel_model = cls.relations[relation];
            if (rel_model === undefined)
                err.API(102);

            if (!check_acl(req.session, "+create", rel_model.model.ACL))
                err.API(119);

            var obj = _get(cls, id, []);
            var a = check_acl(req.session, "write", cls.ACL, obj.ACL);
            if (!a)
                err.API(119);

            if (Array.isArray(a) && a.indexOf(relation) === -1)
                err.API(119);

            if (data.ACL === undefined && req.session.id !== undefined) {
                var acl = rel_model.model.ACL;
                if (util.isFunction(acl))
                    acl = acl();

                var oa = acl[":owner"];
                if (oa !== undefined) {
                    if (Array.isArray(data)) {
                        data.forEach(d => {
                            d.ACL = {};
                            d.ACL[req.session.id] = oa;
                        });
                    } else {
                        data.ACL = {};
                        data.ACL[req.session.id] = oa;
                    }
                }
            }

            var robj = rel_model.model.createSync(data);

            var _opt;
            if (rel_model.type === 'hasOne')
                _opt = obj.__opts.one_associations.find(a => a.name === relation).setAccessor;
            else if (rel_model.type === 'hasMany')
                _opt = obj.__opts.many_associations.find(a => a.name === relation).addAccessor;
            else
                err.API(103);

            obj[_opt + 'Sync'].call(obj, robj);

            if (Array.isArray(robj)) {
                return robj.map(o => {
                    return {
                        id: o.id,
                        createAt: o.createAt
                    };
                });
            } else
                return {
                    id: robj.id,
                    createAt: robj.createAt
                };
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

            if (rel_model.type === 'hasOne') {
                var keys = req.query.keys;
                if (keys !== undefined)
                    keys = keys.split(',');

                var rid = obj[Object.keys(obj.__opts.one_associations.find(a => a.name === relation).field)[0]];
                var obj_relation = _get(rel_model.model, rid, keys);

                var a = check_acl(req.session, "+read", rel_model.model.ACL, obj_relation.ACL);
                if (!a)
                    err.API(119);

                if (Array.isArray(a))
                    keys = keys !== undefined ? util.intersection(keys, a) : a;
                return keys !== undefined ? filter(obj_relation, keys) : obj_relation;
            }

            if (rel_model.type === 'hasMany') {
                var cls_relation = rel_model.model;
                if (!check_acl(req.session, "+find", cls_relation.ACL))
                    err.API(119);

                var _association = obj.__opts.many_associations.find(a => a.name === relation);
                return _find(req, cls_relation, obj[_association.getAccessor].call(obj), '+read');
            }

            err.API(103);
        });
    });

    api.get('/:classname/:id/:relation/:rid', (req, classname, id, relation, rid) => {
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

            var keys = req.query.keys;
            if (keys !== undefined)
                keys = keys.split(',');

            if (rel_model.type === 'hasOne') {
                if (Number(rid) !== obj[Object.keys(obj.__opts.one_associations.find(a => a.name === relation).field)[0]])
                    err.API(101);
            } else if (rel_model.type === 'hasMany') {
                if (!obj[obj.__opts.many_associations.find(a => a.name === relation).hasAccessor + 'Sync'].call(obj, {
                        id: rid
                    }))
                    err.API(101);
            } else
                err.API(103);

            var obj_relation = _get(rel_model.model, rid, keys);
            var a = check_acl(req.session, "+read", rel_model.model.ACL, obj_relation.ACL);
            if (!a)
                err.API(119);

            if (Array.isArray(a))
                keys = keys !== undefined ? util.intersection(keys, a) : a;
            return keys !== undefined ? filter(obj_relation, keys) : obj_relation;
        });
    });

    api.put('/:classname/:id/:relation/:rid', (req, classname, id, relation, rid) => {
        _(req, classname, (db, cls, data) => {
            var rel_model = cls.relations[relation];
            if (rel_model === undefined)
                err.API(102);

            var obj = _get(cls, id);

            var a = check_acl(req.session, "read", cls.ACL, obj.ACL);
            if (!a)
                err.API(119);

            if (Array.isArray(a) && a.indexOf(relation) === -1)
                err.API(119);

            if (rel_model.type === 'hasOne') {
                if (Number(rid) !== obj[Object.keys(obj.__opts.one_associations.find(a => a.name === relation).field)[0]])
                    err.API(101);
            } else if (rel_model.type === 'hasMany') {
                if (!obj[obj.__opts.many_associations.find(a => a.name === relation).hasAccessor + 'Sync'].call(obj, {
                        id: rid
                    }))
                    err.API(101);
            } else
                err.API(103);

            var obj_relation = _get(rel_model.model, rid, Object.keys(data));
            var a = check_acl(req.session, "+write", rel_model.model.ACL, obj_relation.ACL);
            if (!a)
                err.API(119);

            if (Array.isArray(a))
                data = filter(data, a);

            for (var k in data)
                obj_relation[k] = data[k];

            obj_relation.saveSync();

            return {
                id: obj_relation.id,
                updateAt: obj_relation.updateAt
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
                obj[obj.__opts.one_associations.find(a => a.name === relation).delAccessor + 'Sync'].call(obj);

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
                var obj_relation = _get(rel_model.model, rid, []);

                obj[obj.__opts.many_associations.find(a => a.name === relation).delAccessor + 'Sync'].call(obj, obj_relation);

                return {
                    id: obj.id,
                    updateAt: obj.updateAt
                };
            }

            err.API(103);
        });
    });
};