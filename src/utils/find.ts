import FibOrmNS from 'orm';

import convert_where from './convert_where';
import {
    check_obj_acl,
    check_robj_acl
} from './check_acl';
import {
    filter,
    filter_ext
} from './filter';
import { FibAppReq } from '../../@types/app';

export default function (req: FibAppReq, exec: FibOrmNS.IChainFibORMFind, bobj?: FibOrmNS.FibOrmFixedModelInstance, extend?: ACLExtendModelNameType) {
    var query = req.query;

    var keys = query.keys;
    if (keys !== undefined)
        exec = exec.only(keys);

    var where = query.where;
    if (where !== undefined)
        where = convert_where(where as ReqWhere);
    else where = {};

    var exec = exec.where(where) as FibOrmNS.IChainFibORMFind;

    var skip = +query.skip;
    if (isNaN(skip) || skip < 0)
        skip = 0;
    exec = exec.offset(skip) as FibOrmNS.IChainFibORMFind;

    var limit = +query.limit;
    if (isNaN(limit) || limit < 0 || limit > 1000)
        limit = 100;
    exec = exec.limit(limit) as FibOrmNS.IChainFibORMFind;

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
            a = check_robj_acl(req.session, 'read', bobj, obj, extend);
        else
            a = check_obj_acl(req.session, 'read', obj);
        if (!a)
            return null;

        return filter(filter_ext(req.session, obj), keys, a);
    });

    if (query.count == 1)
        return {
            results: objs,
            count: exec.countSync()
        };

    return objs;
};
