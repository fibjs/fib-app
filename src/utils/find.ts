import { checkout_obj_acl, checkout_robj_acl } from './checkout_acl';
import { filter, filter_ext } from './filter';

import convert_where = require('./convert_where');
import { filterSkip, filterLimit, filterWhere, isCountOnly } from './query';

export = function (req: FibApp.FibAppReq, exec: FxOrmNS.IChainFibORMFind, bobj?: FxOrmNS.FibOrmFixedModelInstance, extend?: FibAppACL.ACLExtendModelNameType) {
    var query = req.query;

    var keys = query.keys;
    if (keys !== undefined)
        exec = exec.only(keys);

    var where = filterWhere(query);

    var exec = exec.where(where) as FxOrmNS.IChainFibORMFind;

    var skip = filterSkip(query)
    exec = exec.offset(skip) as FxOrmNS.IChainFibORMFind;

    var limit = filterLimit(query)
    exec = exec.limit(limit) as FxOrmNS.IChainFibORMFind;

    var order = query.order;
    if (order !== undefined)
        exec = exec.order(order);
    
    // avoid extra find action such as `exec.allSync()`
    var objs = [];
    if (limit > 0) {
        objs = exec.allSync();
    }
    objs = objs.map(obj => {
        var a
        if (extend !== undefined)
            a = checkout_robj_acl(req.session, 'read', bobj, obj, extend);
        else
            a = checkout_obj_acl(req.session, 'read', obj);
        if (!a)
            return null;

        return filter(filter_ext(req.session, obj), keys, a);
    });

    if (isCountOnly(query))
        return {
            results: objs,
            count: exec.countSync()
        };

    return objs;
};
