const util = require('util');
const check_acl = require('../utils/check_acl');
const filter = require('../utils/filter');
const _find = require('../utils/find');
const err_info = require('../utils/err_info');

function getObject(cls, id) {
    try {
        return cls.getSync(id)
    } catch (e) {
        return null;
    }
}

exports.bind = (_, api) => {
    api.put('/:classname/:id/:relation', (req, classname, id, relation) => {
        _(req, classname, (req, db, cls, data) => {
            var rel_model = cls.relations[relation];
            if (rel_model === undefined)
                return err_info(4040001, {
                    classname: relation
                });

            var obj = getObject(cls, id);
            if (obj === null)
                return err_info(4040002, {
                    id: id,
                    classname: classname
                }, cls.cid);

            var a = check_acl(req.session, "write", cls.ACL, obj.ACL);
            if (!a)
                return err_info(4030001, {}, cls.cid);

            if (Array.isArray(a) && a.indexOf(relation) === -1)
                return err_info(4030001, {}, cls.cid);

            var rid = data.id;
            if (rid === undefined)
                return err_info(4040002, {
                    id: rid,
                    classname: relation
                }, rel_model.model.cid);

            var robj = getObject(rel_model.model, rid);
            if (robj === null)
                return err_info(4040002, {
                    id: rid,
                    classname: rel_model.model.model_name
                }, rel_model.model.cid);

            var a = check_acl(req.session, "read", rel_model.model.ACL, robj.ACL);
            if (!a)
                return err_info(4030001, {}, rel_model.model.cid);

            var _opt;
            if (rel_model.type === 'hasOne')
                _opt = obj.__opts.one_associations.find(a => a.name === relation).setAccessor;
            else
                _opt = obj.__opts.many_associations.find(a => a.name === relation).addAccessor;

            obj[_opt + 'Sync'].call(obj, robj);

            return {
                success: {
                    id: obj.id,
                    updateAt: obj.updateAt
                }
            };
        });
    });

    api.post('/:classname/:id/:relation', (req, classname, id, relation) => {
        _(req, classname, (req, db, cls, data) => {
            var rel_model = cls.relations[relation];
            if (rel_model === undefined)
                return err_info(4040001, {
                    classname: relation
                });

            if (!check_acl(req.session, "+create", rel_model.model.ACL))
                return err_info(4030001, {}, rel_model.model.cid);

            var obj = getObject(cls, id);
            if (obj === null)
                return err_info(4040002, {
                    id: id,
                    classname: classname
                }, cls.cid);

            var a = check_acl(req.session, "write", cls.ACL, obj.ACL);
            if (!a)
                return err_info(4030001, {}, cls.cid);

            if (Array.isArray(a) && a.indexOf(relation) === -1)
                return err_info(4030001, {}, cls.cid);

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

            var robj = rel_model.model.createSync(data);

            var _opt;
            if (rel_model.type === 'hasOne')
                _opt = obj.__opts.one_associations.find(a => a.name === relation).setAccessor;
            else
                _opt = obj.__opts.many_associations.find(a => a.name === relation).addAccessor;

            obj[_opt + 'Sync'].call(obj, robj);

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
        });
    });

    api.get('/:classname/:id/:relation', (req, classname, id, relation) => {
        _(req, classname, (req, db, cls) => {
            var rel_model = cls.relations[relation];
            if (rel_model === undefined)
                return err_info(4040001, {
                    classname: relation
                });

            var obj = getObject(cls, id);
            if (obj === null)
                return err_info(4040002, {
                    id: id,
                    classname: classname
                }, cls.cid);

            var a = check_acl(req.session, "read", cls.ACL, obj.ACL);
            if (!a)
                return err_info(4030001, {}, cls.cid);

            if (Array.isArray(a) && a.indexOf(relation) === -1)
                return err_info(4030001, {}, cls.cid);

            if (rel_model.type === 'hasOne') {
                var keys = req.query.keys;
                if (keys !== undefined)
                    keys = keys.split(',');

                var rid = obj[Object.keys(obj.__opts.one_associations.find(a => a.name === relation).field)[0]];
                var robj = getObject(rel_model.model, rid);
                if (robj === null)
                    return err_info(4040002, {
                        id: rid,
                        classname: rel_model.model.model_name
                    }, rel_model.model.cid);

                var a = check_acl(req.session, "+read", rel_model.model.ACL, robj.ACL);
                if (!a)
                    return err_info(4030001, {}, rel_model.model.cid);

                if (Array.isArray(a))
                    keys = keys !== undefined ? util.intersection(keys, a) : a;
                return {
                    success: keys !== undefined ? filter(robj, keys) : robj
                };
            } else {
                if (!check_acl(req.session, "+find", rel_model.model.ACL))
                    return err_info(4030001, {}, rel_model.model.cid);

                var _association = obj.__opts.many_associations.find(a => a.name === relation);
                return {
                    success: _find(req, rel_model.model, obj[_association.getAccessor].call(obj), '+read')
                };
            }
        });
    });

    api.get('/:classname/:id/:relation/:rid', (req, classname, id, relation, rid) => {
        _(req, classname, (req, db, cls) => {
            var rel_model = cls.relations[relation];
            if (rel_model === undefined)
                return err_info(4040001, {
                    classname: relation
                });

            var obj = getObject(cls, id);
            if (obj === null)
                return err_info(4040002, {
                    id: id,
                    classname: classname
                }, cls.cid);

            var a = check_acl(req.session, "read", cls.ACL, obj.ACL);
            if (!a)
                return err_info(4030001, {}, cls.cid);

            if (Array.isArray(a) && a.indexOf(relation) === -1)
                return err_info(4030001, {}, cls.cid);

            var keys = req.query.keys;
            if (keys !== undefined)
                keys = keys.split(',');

            if (rel_model.type === 'hasOne') {
                if (rid != obj[Object.keys(obj.__opts.one_associations.find(a => a.name === relation).field)[0]])
                    return err_info(4040002, {
                        id: rid,
                        classname: relation
                    }, rel_model.model.cid);
            } else {
                if (!obj[obj.__opts.many_associations.find(a => a.name === relation).hasAccessor + 'Sync'].call(obj, {
                        id: rid
                    }))
                    return err_info(4040002, {
                        id: rid,
                        classname: relation
                    }, rel_model.model.cid);
            }

            var robj = getObject(rel_model.model, rid);
            if (robj === null)
                return err_info(4040002, {
                    id: rid,
                    classname: rel_model.model.model_name
                }, rel_model.model.cid);

            var a = check_acl(req.session, "+read", rel_model.model.ACL, robj.ACL);
            if (!a)
                return err_info(4030001, {}, rel_model.model.cid);

            if (Array.isArray(a))
                keys = keys !== undefined ? util.intersection(keys, a) : a;
            return {
                success: keys !== undefined ? filter(robj, keys) : robj
            };
        });
    });

    api.put('/:classname/:id/:relation/:rid', (req, classname, id, relation, rid) => {
        _(req, classname, (req, db, cls, data) => {
            var rel_model = cls.relations[relation];
            if (rel_model === undefined)
                return err_info(4040001, {
                    classname: relation
                });

            var obj = getObject(cls, id);
            if (obj === null)
                return err_info(4040002, {
                    id: id,
                    classname: classname
                }, cls.cid);

            var a = check_acl(req.session, "read", cls.ACL, obj.ACL);
            if (!a)
                return err_info(4030001, {}, cls.cid);

            if (Array.isArray(a) && a.indexOf(relation) === -1)
                return err_info(4030001, {}, cls.cid);

            if (rel_model.type === 'hasOne') {
                if (Number(rid) !== obj[Object.keys(obj.__opts.one_associations.find(a => a.name === relation).field)[0]])
                    return err_info(4040002, {
                        id: rid,
                        classname: relation
                    }, rel_model.model.cid);
            } else {
                if (!obj[obj.__opts.many_associations.find(a => a.name === relation).hasAccessor + 'Sync'].call(obj, {
                        id: rid
                    }))
                    return err_info(4040002, {
                        id: rid,
                        classname: relation
                    }, rel_model.model.cid);
            }

            var robj = getObject(rel_model.model, rid);
            if (robj === null)
                return err_info(4040002, {
                    id: rid,
                    classname: rel_model.model.model_name
                }, rel_model.model.cid);

            var a = check_acl(req.session, "+write", rel_model.model.ACL, robj.ACL);
            if (!a)
                return err_info(4030001, {}, rel_model.model.cid);

            if (Array.isArray(a))
                data = filter(data, a);

            for (var k in data)
                robj[k] = data[k];

            robj.saveSync();

            return {
                success: {
                    id: robj.id,
                    updateAt: robj.updateAt
                }
            };
        });
    });

    api.del('/:classname/:id/:relation', (req, classname, id, relation) => {
        _(req, classname, (req, db, cls) => {
            var rel_model = cls.relations[relation];
            if (rel_model === undefined)
                return err_info(4040001, {
                    classname: relation
                });

            var obj = getObject(cls, id);
            if (obj === null)
                return err_info(4040002, {
                    id: id,
                    classname: classname
                }, cls.cid);

            var a = check_acl(req.session, "write", cls.ACL, obj.ACL);
            if (!a)
                return err_info(4030001, {}, cls.cid);

            if (Array.isArray(a) && a.indexOf(relation) === -1)
                return err_info(4030001, {}, cls.cid);

            if (rel_model.type === 'hasOne') {
                obj[obj.__opts.one_associations.find(a => a.name === relation).delAccessor + 'Sync'].call(obj);

                return {
                    success: {
                        id: obj.id,
                        updateAt: obj.updateAt
                    }
                };
            }

            return err_info(4040003, {
                classname: classname,
                relation: relation
            }, cls.cid);
        });
    });

    api.del('/:classname/:id/:relation/:rid', (req, classname, id, relation, rid) => {
        _(req, classname, (req, db, cls) => {
            var rel_model = cls.relations[relation];
            if (rel_model === undefined)
                return err_info(4040001, {
                    classname: relation
                });

            var obj = getObject(cls, id);
            if (obj === null)
                return err_info(4040002, {
                    id: id,
                    classname: classname
                }, cls.cid);

            var a = check_acl(req.session, "write", cls.ACL, obj.ACL);
            if (!a)
                return err_info(4030001, {}, cls.cid);

            if (Array.isArray(a) && a.indexOf(relation) === -1)
                return err_info(4030001, {}, cls.cid);

            if (rel_model.type === 'hasMany') {
                var robj = getObject(rel_model.model, rid);
                if (robj === null)
                    return err_info(4040002, {
                        id: rid,
                        classname: rel_model.model.model_name
                    }, rel_model.model.cid);

                obj[obj.__opts.many_associations.find(a => a.name === relation).delAccessor + 'Sync'].call(obj, robj);

                return {
                    success: {
                        id: obj.id,
                        updateAt: obj.updateAt
                    }
                };
            }

            return err_info(4040003, {
                classname: classname,
                relation: relation
            }, cls.cid);
        });
    });
};