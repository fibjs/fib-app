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
    finder_model: FxOrmModel.Model,
    ext_info?: {
        base_instance: FxOrmInstance.Instance,
        extend_in_rest: FibAppACL.ACLExtendModelNameType
    }
): FibApp.FibAppIneternalApiFindResult<FxOrmInstance.Instance> {
    const query = req.query;

    let exists_args: any[] = [];
    let accessor_conditions: FibApp.FibAppReqQuery['where'] & object = {};

    /**
     * NOTICE: temp solution to resolve no select extra data in
     * HASMANY_association.getAccessor method
     */
    let base_findby_find_nil: boolean = false;

    const { extend_in_rest = undefined } = ext_info || {}
    const where = query_filter_where(req);
    
    // filter out hasMany's extra properties from where, it should in `accessor_conditions` rather than `where`
    if (extend_in_rest && finder_model.associations[extend_in_rest]?.type === 'hasMany') {
        const many_assoc = finder_model.associations[extend_in_rest].association as FxOrmAssociation.InstanceAssociationItem_HasMany
        Object.keys(many_assoc.props).forEach(k => {
            if (where[k]) {
                accessor_conditions[k] = where[k];
                delete where[k];
            }
        });
    }
    const extra_where = query_filter_join_where(req);

    let parent_findby: FxOrmQuery.IChainFind;

    ;(() => {
        if (!finder_model)
            return ;
        
        const findby = parse_json_queryarg<FibApp.FibAppReqQuery['findby']>(req, 'findby');
        const { base_assoc_holder, exists: findby_exists, findby_infos } = query_filter_findby(findby, finder_model, {
            req,
            extend_in_rest,
        });

        if (findby_infos?.length) {
            if (extend_in_rest) {
                // now finder is `base_instance.getAccessor<extend_in_rest>()`
                const asssocInstances: FxOrmInstance.Instance[] = finder?.(accessor_conditions).allSync() || [];
        
                parent_findby = base_assoc_holder.association.model.findBy(
                    findby_infos.map(item => ({
                        association_name: item.association_name,
                        conditions: item.conditions,
                    })),
                    {
                        [finder_model.keys + '']: asssocInstances.map(item => item[finder_model.keys + ''] as any),
                        ...where
                    } as FxOrmModel.ModelQueryConditions__Find,
                )
            } else if (!extend_in_rest) {
                parent_findby = finder_model.findBy(
                    findby_infos.map(item => ({
                        association_name: item.association_name,
                        conditions: item.conditions,
                    })),
                    {
                        ...where,
                        ...accessor_conditions
                    } as FxOrmModel.ModelQueryConditions__Find,
                )
            }
        }

        if (extend_in_rest && parent_findby && !accessor_conditions.id) {
            const pRows = parent_findby.allSync();
            const ids = pRows.map(row => row[finder_model.keys + '']);

            accessor_conditions.id = { in: ids };

            base_findby_find_nil = !ids.length;
        }

        if (Array.isArray(findby_exists))
            exists_args = exists_args.concat(findby_exists)
    })();
    
    const orig_chainfind = finder(accessor_conditions, { join_where: extra_where });
    let exec = !extend_in_rest && parent_findby ? parent_findby : orig_chainfind;
    

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
    if (limit > 0 && !base_findby_find_nil) {
        // add one count field if count is required
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

    // TODO: ask orm to support query-level custom select?
    if (is_count_required(query))
        return {
            results: objs,
            count: base_findby_find_nil ? 0 : exec.countSync()
        };

    return {
        results: objs,
        count: 0
    };
};
