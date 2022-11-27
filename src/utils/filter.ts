import util = require('util');

import {
    checkout_obj_acl,
    checkout_robj_acl
} from './checkout_acl';

import type { FibApp } from '../Typo/app';
import type { FxOrmNS, FxOrmInstance } from '@fxjs/orm'
import type { FibAppACL } from '../Typo/acl';

export function filter <T = FxOrmInstance.Instance | FibApp.FibDataPayload> (
    obj: FxOrmInstance.Instance | FibApp.FibDataPayload,
    keys: boolean | string | string[],
    readonly_keys?: FibAppACL.RoleActDescriptor
): T {
    if (Array.isArray(keys)) {
        if (Array.isArray(readonly_keys)) {
            keys = util.intersection(keys, readonly_keys)
        }
    } else if (Array.isArray(readonly_keys)) {
        keys = readonly_keys
    }

    if (!Array.isArray(keys)) {
        return obj as T;
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
            throw new Error(`error occured when trying to set obj['${k}'] = undefined`)
        }
        delete obj[k];
    });
    return obj as T;
};

export function filter_ext (session: FibApp.FibAppSession, obj: FxOrmInstance.Instance) {
    var cls = obj.model();

    function _do_ext(robj: FxOrmInstance.Instance, extend: FibAppACL.ACLExtendModelNameType) {
        var acl = checkout_robj_acl(session, 'read', obj, robj, extend) as FibAppACL.AclPermissionType__Read;
        if (!acl) {
            return undefined;
        }
        return filter(filter_ext(session, robj), acl);
    }

    for (var k in cls.associations) {
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
