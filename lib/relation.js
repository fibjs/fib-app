const util = require('util');
const err = require('./err');
const check_acl = require('./check_acl');
const filter = require('./filter');
const _find = require('./find');
const _get = require('./get');

exports.bind = (_, api) => {
    api.put('/:classname/:id/:relation', (req, classname, id, relation) => {
        _(req, classname, (db, cls, data) => {
            if (data === undefined)
                err.API(107);

            var rel_model = cls.relations[relation];
            if (rel_model === undefined)
                err.API(102);

            var obj = _get(cls, id, []);

            var a = check_acl(req.session, "write", cls.ACL, obj.ACL);
            if (!a)
                err.API(119);

            if (Array.isArray(a) && a.indexOf(relation) === -1)
                err.API(119);

            var _association;

            var rid = data.id;
            if (rid === undefined)
                err.API(107);

            if (rel_model.type === 'hasOne') {
                _association = obj.__opts.one_associations.find(a => a.name === relation);
                var obj_relation = _get(_association.model, rid, []);

                var a = check_acl(req.session, "read", _association.model.ACL, obj_relation.ACL);
                if (!a)
                    err.API(119);

                obj[_association.setAccessor + 'Sync'].call(obj, obj_relation);

                return {
                    id: obj.id,
                    updateAt: obj.updateAt
                };
            }

            if (rel_model.type === 'hasMany') {
                _association = obj.__opts.many_associations.find(a => a.name === relation);
                var obj_relation = _get(_association.model, rid, []);

                var a = check_acl(req.session, "read", _association.model.ACL, obj_relation.ACL);
                if (!a)
                    err.API(119);

                obj[_association.addAccessor + 'Sync'].call(obj, obj_relation);

                return {
                    id: obj.id,
                    updateAt: obj.updateAt
                };
            }

            err.API(103);
        });
    });

    api.post('/:classname/:id/:relation', (req, classname, id, relation) => {
        _(req, classname, (db, cls, data) => {
            if (data === undefined)
                err.API(107);

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
                    data.ACL = {};
                    data.ACL[req.session.id] = oa;
                }
            }

            var robj = rel_model.model.createSync(data);
            var rid = robj.id;

            var _association;

            if (rel_model.type === 'hasOne') {
                _association = obj.__opts.one_associations.find(a => a.name === relation);
                var obj_relation = _get(_association.model, rid, []);

                obj[_association.setAccessor + 'Sync'].call(obj, obj_relation);

                return {
                    id: robj.id,
                    createAt: robj.createAt
                };
            }

            if (rel_model.type === 'hasMany') {
                _association = obj.__opts.many_associations.find(a => a.name === relation);
                var obj_relation = _get(_association.model, rid, []);

                obj[_association.addAccessor + 'Sync'].call(obj, obj_relation);

                return {
                    id: robj.id,
                    createAt: robj.createAt
                };
            }

            err.API(103);
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

            var _association;

            if (rel_model.type === 'hasOne') {
                _association = obj.__opts.one_associations.find(a => a.name === relation);
                var keys = req.query.keys;
                if (keys !== undefined)
                    keys = keys.split(',');

                var rid = obj[Object.keys(_association.field)[0]];
                var obj_relation = _get(_association.model, rid, keys);

                var a = check_acl(req.session, "+read", _association.model.ACL, obj_relation.ACL);
                if (!a)
                    err.API(119);

                if (Array.isArray(a))
                    keys = keys !== undefined ? util.intersection(keys, a) : a;
                return keys !== undefined ? filter(obj_relation, keys) : obj_relation;
            }

            if (rel_model.type === 'hasMany') {
                _association = obj.__opts.many_associations.find(a => a.name === relation);
                var cls_relation = _association.model;
                if (!check_acl(req.session, "+find", cls_relation.ACL))
                    err.API(119);

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

            if (rel_model.type === 'hasMany') {
                var _association = obj.__opts.many_associations.find(a => a.name === relation);
                var keys = req.query.keys;
                if (keys !== undefined)
                    keys = keys.split(',');

                var obj_relation = _get(_association.model, rid, keys);
                if (!obj[_association.hasAccessor + 'Sync'].call(obj, obj_relation))
                    err.API(101);

                var a = check_acl(req.session, "+read", _association.model.ACL, obj_relation.ACL);
                if (!a)
                    err.API(119);

                if (Array.isArray(a))
                    keys = keys !== undefined ? util.intersection(keys, a) : a;
                return keys !== undefined ? filter(obj_relation, keys) : obj_relation;
            }

            err.API(103);
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
                var _association = obj.__opts.one_associations.find(a => a.name === relation);
                obj[_association.delAccessor + 'Sync'].call(obj);

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
                var _association = obj.__opts.many_associations.find(a => a.name === relation);
                var obj_relation = _get(_association.model, rid, []);

                obj[_association.delAccessor + 'Sync'].call(obj, obj_relation);

                return {
                    id: obj.id,
                    updateAt: obj.updateAt
                };
            }

            err.API(103);
        });
    });
};