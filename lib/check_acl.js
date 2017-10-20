module.exports = function (session, act, acl, oacl) {
    var aa = false;

    function merge(a) {
        if (a !== undefined) {
            var _aa;

            _aa = a['*'];
            if (_aa !== undefined)
                aa = _aa;

            _aa = a[act];
            if (_aa !== undefined)
                aa = _aa;
        }
    }

    merge(acl['*']);
    var roles = session.roles;
    if (roles !== undefined)
        roles.forEach(r => merge(acl["role:" + r]));
    merge(acl[session.id]);

    if (oacl !== null && oacl !== undefined) {
        merge(oacl['*']);
        if (roles !== undefined)
            roles.forEach(r => merge(oacl["role:" + r]));
        merge(oacl[session.id]);
    }

    return aa;
}