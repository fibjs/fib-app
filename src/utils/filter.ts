import FibOrmNS from 'orm';
import { FibDataPayload } from '../../@types/app';
import util = require('util');

import {
    check_obj_acl,
    check_robj_acl
} from './check_acl';

export const filter = function (obj: FibDataPayload, keys: boolean | string | string[], keys1?: string[]) {
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

    var ekeys = util.difference(Object.keys(obj), keys);

    ekeys.forEach(k => {
        obj[k] = undefined;
        delete obj[k];
    });
    return obj;
};

export const filter_ext = function (session: FibAppSession, obj: FibOrmNS.FibOrmFixedModelInstance) {
    var cls = obj.model();

    function _do_ext(robj: FibOrmNS.FibOrmFixedModelInstance, extend: ACLExtendModelNameType) {
        var acl = check_robj_acl(session, 'read', obj, robj, extend);
        if (!acl) {
            return undefined;
        }
        return filter(filter_ext(session, robj), acl);
    }

    for (var k in cls.extends) {
        var robj = obj[k];

        if (robj !== undefined) {
            if (Array.isArray(robj)) {
                if (check_obj_acl(session, 'find', obj, k)) {
                    obj[k] = robj.map(r => _do_ext(r, k));
                } else {
                    obj[k] = undefined;
                }
            } else {
                obj[k] = _do_ext(robj, k);
            }
        }
    }

    return obj;
}
