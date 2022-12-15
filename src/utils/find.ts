import { FxOrmAssociation, FxOrmInstance, FxOrmModel, FxOrmQuery } from '@fxjs/orm';
import util = require('util')
import { FibAppACL } from '../Typo/acl';
import { FibApp } from '../Typo/app';
import { checkout_obj_acl, checkout_robj_acl } from './checkout_acl';
import { filter, filter_ext } from './filter';

import {
    query_filter_skip,
    query_filter_limit,
    query_filter_where,
    query_filter_findby,
    is_count_required,
    parse_json_queryarg,
    query_filter_join_where,
    query_filter_order
} from './query';

export = function (
    req: FibApp.FibAppReq,
    finder: FxOrmQuery.IChainFind['find'],
    base_model: FxOrmModel.Model,
    ext_info?: {
        base_instance: FxOrmInstance.Instance,
        extend_in_rest: FibAppACL.ACLExtendModelNameType
    }
): FibApp.FibAppIneternalApiFindResult<FxOrmInstance.Instance> {
    const query = req.query;

    let exists_args: any[] = [];
    let init_conditions: FibApp.FibAppReqQuery['where'] & object = {};

    /**
     * NOTICE: temp solution to resolve no select extra data in
     * HASMANY_association.getAccessor method
     */
    let findby_get_nil: boolean = false;
    const { extend_in_rest = undefined } = ext_info || {}

    ;(() => {
        if (!base_model)
            return ;
        
        var findby = parse_json_queryarg<FibApp.FibAppReqQuery['findby']>(req, 'findby');
        var { exists: findby_exists, findby_infos } = query_filter_findby(findby, base_model, { req, extend_in_rest });
        
        if (findby_infos && findby_infos.length) {
            let findby_ids: string[] = [];
            findby_infos.forEach(findby_info => {
                if (findby_info.accessor_payload && findby_info.accessor && findby_info.conditions) {
                    const findby_finder = findby_info.accessor_payload[findby_info.accessor]
                    
                    const idHolders = findby_finder(findby_info.conditions)
                        .only(base_model.keys)
                        .allSync() as Record<string, any>

                    findby_ids = findby_ids.concat( idHolders.map((x: any) => x[base_model.keys + '']) )
                }
            });

            if (!init_conditions.id) { // pointless here but I still leave it.
                init_conditions.id = { in: findby_ids };
            }

            findby_get_nil = !findby_ids.length
        }

        if (Array.isArray(findby_exists))
            exists_args = exists_args.concat(findby_exists)
    })();
    
    const where = query_filter_where(req);
    // filter out hasMany's extra properties from where, it should in `init_conditions` rather than `where`
    if (extend_in_rest && base_model.associations[extend_in_rest]?.type === 'hasMany') {
        const many_assoc = base_model.associations[extend_in_rest].association as FxOrmAssociation.InstanceAssociationItem_HasMany
        Object.keys(many_assoc.props).forEach(k => {
            if (where[k]) {
                init_conditions[k] = where[k];
                delete where[k];
            }
        });
    }
    
    const extra_where = query_filter_join_where(req);
    let exec = finder(init_conditions, { join_where: extra_where });

    if (exists_args.length && exec.whereExists)
        exec = exec.whereExists(exists_args)

    var keys = query.keys;
    if (keys !== undefined)
        exec = exec.only(keys);

    exec = exec.where(where, { join_where: extra_where });
    
    var skip = query_filter_skip(query);
    exec = exec.offset(skip)

    var limit = query_filter_limit(query);
    exec = exec.limit(limit)

    query_filter_order(query)
        .map(order => exec = exec.order(order));
    
    // avoid unnecessary find action such as `exec.allSync()`
    var objs: FxOrmInstance.Instance[] = [];
    if (limit > 0 && !findby_get_nil) {
        objs = exec.allSync();
    }
    
    objs = objs.map(obj => {
        let a: FibAppACL.RoleActDescriptor | false;
        if (ext_info)
            a = checkout_robj_acl(req.session, 'read', ext_info.base_instance, obj, ext_info.extend_in_rest);
        else
            a = checkout_obj_acl(req.session, 'read', obj);
        if (!a)
            return null;

        return filter(filter_ext(req.session, obj), keys, a);
    });

    if (is_count_required(query))
        return {
            results: objs,
            count: findby_get_nil ? 0 : exec.countSync()
        };

    return {
        results: objs,
        count: 0
    };
};
