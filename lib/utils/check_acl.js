var util = require('util');

exports.check_acl = function (session, act, acl, extend) {
    var aa = undefined;

    function _check_acl_act(_acl_role) {
        if (_acl_role === undefined)
            return;

        /*
        {
            '1234': true
        }
        */
        if (_acl_role === false || _acl_role === true || Array.isArray(_acl_role)) {
            aa = _acl_role;
            return true;
        }

        /*
        {
            '1234': {
                'read': true
            }
        }
        */
        aa = _acl_role[act];
        if (aa !== undefined)
            return true;

        /*
        {
            '1234': {
                '*': true
            }
        }
        */
        aa = _acl_role['*'];
        if (aa !== undefined)
            return true;
    }

    function _check_acl_role(_acl_role) {
        if (_acl_role === undefined)
            return;

        if (extend === undefined)
            return _check_acl_act(_acl_role);

        var exts = _acl_role.extends;
        if (exts !== undefined) {
            /*
            {
                '1234': {
                    'extends': {
                        'ext': {}
                    }
                }
            }
            */
            if (_check_acl_act(exts[extend]))
                return true;

            /*
            {
                '1234': {
                    'extends': {
                        '*': {}
                    }
                }
            }
            */
            return _check_acl_act(exts['*']);
        }
    }

    if (util.isFunction(acl))
        acl = acl(session);

    if (acl === null || acl === undefined)
        return;

    /*
    {
        '1234': {}
    }
    */
    if (_check_acl_role(acl[session.id]))
        return aa;

    /*
    {
        'roles': {
            'r1': {}
        }
    }
    */
    var roles = session.roles;
    if (roles !== undefined) {
        var role_acls = acl.roles;

        if (role_acls !== undefined) {
            for (var i = roles.length - 1; i >= 0; i--)
                if (_check_acl_role(role_acls[roles[i]]))
                    return aa;
        }
    }

    /*
    {
        '*': {}
    }
    */
    if (_check_acl_role(acl['*']))
        return aa;

    return;
}

exports.check_obj_acl = function (session, act, obj, extend) {
    var cls = obj.model();

    var acl;

    var _oacl = cls.OACL;
    if (util.isFunction(_oacl))
        _oacl = _oacl.call(obj, session);

    acl = exports.check_acl(session, act, _oacl, extend);
    if (acl === undefined)
        acl = exports.check_acl(session, act, cls.ACL, extend);

    if (act === 'read' && Array.isArray(acl))
        acl = acl.concat(Object.keys(cls.extends));

    return acl;
}

exports.check_robj_acl = function (session, act, obj, robj, extend) {
    var cls = obj.model();
    var rcls = robj.model();

    var acl;

    var _oacl = rcls.OACL;
    if (util.isFunction(_oacl))
        _oacl = _oacl.call(robj, session);

    acl = exports.check_acl(session, act, _oacl);
    if (acl === undefined)
        acl = exports.check_obj_acl(session, act, obj, extend);
    if (acl === undefined)
        acl = exports.check_acl(session, act, rcls.ACL);

    if (act === 'read' && Array.isArray(acl))
        acl = acl.concat(Object.keys(rcls.extends));

    return acl;
}