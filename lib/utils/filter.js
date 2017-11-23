const util = require('util');
const {
    check_obj_acl,
    check_robj_acl
} = require('./check_acl');


exports.filter = function (obj, keys, keys1) {
    if (Array.isArray(keys)) {
        if (Array.isArray(keys1))
            keys = util.intersection(keys, keys1)
    } else if (Array.isArray(keys1))
        keys = keys1

    if (!Array.isArray(keys))
        return obj;

    var obj1 = {};
    var v;

    keys.forEach(k => (v = obj[k]) !== undefined ? obj1[k] = v : undefined);
    return obj1;
};

exports.filter_ext = function (session, obj) {
    var cls = obj.model();

    function _do_ext(robj, extend) {
        var acl = check_robj_acl(session, 'read', obj, robj, extend);
        if (!acl)
            return undefined;

        return exports.filter(exports.filter_ext(session, robj), acl);
    }

    for (var k in cls.extends) {
        var robj = obj[k];

        if (robj !== undefined) {
            if (Array.isArray(robj)) {
                if (check_obj_acl(session, 'find', obj, k))
                    obj[k] = robj.map(r => _do_ext(r, k));
                else obj[k] = undefined;
            } else
                obj[k] = _do_ext(robj, k);
        }
    }

    return obj;
}