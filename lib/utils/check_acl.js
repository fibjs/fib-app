var util = require('util');

module.exports = function (session, act, acl, acl1, acl2) {
    var aa = undefined;
    var roles = session.roles;

    function _check_acl_act(_acl_role) {
        if (_acl_role !== undefined) {
            var _aa;

            _aa = _acl_role[act];
            if (_aa !== undefined) {
                aa = _aa;
                return true;
            }

            _aa = _acl_role['*'];
            if (_aa !== undefined) {
                aa = _aa;
                return true;
            }
        }
    }

    function _check_acl(_acl) {
        if (_acl === null || _acl === undefined)
            return false;

        if (util.isFunction(_acl))
            _acl = _acl(session);

        if (_acl === null || _acl === undefined)
            return false;

        if (_check_acl_act(_acl[session.id]))
            return true;

        if (roles !== undefined)
            for (var i = roles.length - 1; i >= 0; i--)
                if (_check_acl_act(_acl["role:" + roles[i]]))
                    return true;

        if (_check_acl_act(_acl['*']))
            return true;
    }

    _check_acl(acl2) || _check_acl(acl1) || _check_acl(acl);

    return aa;
}