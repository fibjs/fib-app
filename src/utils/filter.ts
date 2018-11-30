import util = require('util');

import {
    checkout_obj_acl,
    checkout_robj_acl
} from './checkout_acl';

export function filter (obj: FxOrmNS.Instance | FibApp.FibDataPayload, keys: boolean | string | string[], keys1?: FibAppACL.RoleActDescriptor) {
    if (Array.isArray(keys)) {
        if (Array.isArray(keys1)) {
            keys = util.intersection(keys, keys1)
        }
    } else if (Array.isArray(keys1)) {
        keys = keys1
    }

    if (!Array.isArray(keys)) {
        return obj;
    }
    let objModelProperties = Object.keys(obj)
    /**
     * there may be 'extra' prop in `obj`, we must try to get real properties in obj which defined by its model class(access it by calling `obj.model()`)
     */
    if (typeof obj.model === 'function') {
        const cls = obj.model()
        if (cls && cls.allProperties) {
            objModelProperties = Object.keys(cls.allProperties)
        }
    }

    const ekeys = util.difference(objModelProperties, keys);

    ekeys.forEach(k => {
        try {
            obj[k] = undefined;
        } catch (e) {
            throw `error occured when trying to set obj['${k}'] = undefined`
        }
        delete obj[k];
    });
    return obj;
};

export function filter_ext (session: FibApp.FibAppSession, obj: FxOrmNS.Instance) {
    var cls = obj.model();

    function _do_ext(robj: FxOrmNS.Instance, extend: FibAppACL.ACLExtendModelNameType) {
        var acl = checkout_robj_acl(session, 'read', obj, robj, extend) as FibAppACL.AclPermissionType__Read;
        if (!acl) {
            return undefined;
        }
        return filter(filter_ext(session, robj), acl);
    }

    for (var k in cls.extends) {
        var robj = obj[k];

        if (robj === undefined)
            continue

        if (Array.isArray(robj)) {
            if (checkout_obj_acl(session, 'find', obj, k)) {
                obj[k] = robj.map(r => _do_ext(r, k));
            } else {
                obj[k] = undefined;
            }
        } else {
            obj[k] = _do_ext(robj, k);
        }
    }

    return obj;
}
