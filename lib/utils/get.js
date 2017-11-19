const err_info = require('../utils/err_info');
const check_acl = require('../utils/check_acl');

exports._get = function _get(cls, id, session, act) {
    var obj = {
        data: cls.find().where({
            id: id
        }).firstSync()
    };

    if (obj.data === null)
        return err_info(4040002, {
            id: id,
            classname: cls.model_name
        }, cls.cid);

    if (act) {
        var acl = check_acl(session, act, cls.ACL, obj.data.ACL);
        if (!acl)
            return err_info(4030001, {}, cls.cid);
        obj.acl = acl;
    }

    return obj;
};

exports._eget = function _eget(obj, extend, rid, session, act) {
    var cls = obj.model();
    var rel_model = cls.extends[extend];
    var __opt;

    if (rel_model.type === 'hasOne') {
        if (rel_model.reversed)
            __opt = obj[obj.__opts.one_associations.find(a => a.name === extend).getAccessor].call(obj);
        else {
            if (rid != obj[Object.keys(obj.__opts.one_associations.find(a => a.name === extend).field)[0]])
                return err_info(4040002, {
                    id: rid,
                    classname: `${cls.model_name}.${extend}`
                }, cls.cid);
            __opt = rel_model.model.find();
        }
    } else
        __opt = obj[obj.__opts.many_associations.find(a => a.name === extend).getAccessor].call(obj);

    var robj = {
        data: __opt.where({
            id: rid
        }).firstSync()
    };

    if (robj.data === null)
        return err_info(4040002, {
            id: rid,
            classname: `${cls.model_name}.${extend}`
        }, cls.cid);

    return robj;
};