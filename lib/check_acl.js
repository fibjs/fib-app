var util = require('util');

module.exports = function (session, act, acl, oacl) {
    var aa = undefined;
    var roles = session.roles;

    function _check_acl_act(a) {
        if (a !== undefined) {
            var _aa;

            _aa = a[act];
            if (_aa !== undefined) {
                aa = _aa;
                return true;
            }

            _aa = a['*'];
            if (_aa !== undefined) {
                aa = _aa;
                return true;
            }
        }
    }

    function _check_acl(acl) {
        if (_check_acl_act(acl[session.id]))
            return true;

        if (roles !== undefined)
            for (var i = roles.length - 1; i >= 0; i--)
                if (_check_acl_act(acl["role:" + roles[i]]))
                    return true;

        if (_check_acl_act(acl['*']))
            return true;
    }

    function _check_act(act) {
        if (oacl !== null && oacl !== undefined)
            if (_check_acl(oacl))
                return true;

        return _check_acl(acl);
    }

    if (util.isFunction(acl))
        acl = acl();

    if (act.substr(0, 1) == '+') {
        if (!_check_act(act))
            _check_act(act.substr(1));
    } else
        _check_act(act);

    return aa;
}