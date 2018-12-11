import { checkout_obj_acl, checkout_robj_acl } from './checkout_acl';
import { filter, filter_ext } from './filter';

import { filterSkip, filterLimit, filterWhere, is_count_required } from './query';

export = function<ReponseT = any> (req: FibApp.FibAppReq, exec: FxOrmNS.IChainFibORMFind, bobj?: FxOrmNS.Instance, extend?: FibAppACL.ACLExtendModelNameType): FibApp.FibAppIneternalApiFindResult<ReponseT> {
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

    if (is_count_required(query))
        return {
            results: objs,
            count: exec.countSync()
        };

    return {
        results: objs,
        count: 0
    };
};
