const err_info = require('../utils/err_info');
const check_acl = require('../utils/check_acl');

module.exports = function getObject(cls, id, session, act, field) {
    try {
        var obj = {
            data: cls.getSync(id)
        };

        if (act) {
            var acl = check_acl(session, act, cls.ACL, obj.data.ACL);
            if (!acl)
                return err_info(4030001, {}, cls.cid);
            obj.acl = acl;

            if (field && Array.isArray(obj.acl) && a.indexOf(field) === -1)
                return err_info(4030001, {}, cls.cid);
        }

        return obj;
    } catch (e) {
        return err_info(4040002, {
            id: id,
            classname: cls.model_name
        }, cls.cid);
    }
};