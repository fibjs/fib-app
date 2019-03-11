/// <reference lib="es2017" />

import util = require('util');
import { get_many_association_item, get_one_association_item, get_extendsto_association_item } from './orm-assoc';
import { checkout_acl } from './checkout_acl';
import { ucfirst } from './str';

export function query_filter_where (query: FibApp.FibAppReqQuery) {
    var where = query.where;

    where = where || {};

    return where
}

interface FindByFilteredInfo {
    exists: FxOrmQuery.ChainWhereExistsInfo[] | null
    findby_infos: FibApp.FilteredFindByInfo[]
}
export function query_filter_findby (findby: FibApp.FibAppReqQuery['findby'], base_model: FibApp.FibAppORMModel, opts: {
    pre_exec?: FxOrmNS.IChainFind
    req: FibApp.FibAppReq
}): FindByFilteredInfo {
    const { req, pre_exec = null } = opts

    const __wrapper = { exists: null, findby_infos: [] }

    if (!findby) return __wrapper;

    if (!findby.extend || typeof findby.extend !== 'string') return __wrapper;

    let hasmany_assoc: FxOrmNS.InstanceAssociationItem_HasMany;
    let found_assoc: FxOrmAssociation.InstanceAssociationItem;
    
    const base_instance = new base_model()

    if (
        findby.on
        && (found_assoc = hasmany_assoc = get_many_association_item(base_instance, findby.extend))
    ) {
        // TODO: make sure order of mg_ks is corresponding to mks
        const mg_ks = Object.values(hasmany_assoc.mergeId).map(x => x.mapsTo);
        const mks = base_model.id;

        if (!checkout_acl(req.session, 'find', base_model.ACL, findby.extend)) return __wrapper;

        /**
         * @description code below means 'support single key only'
         */
        // const mg_assocks = Object.values(hasmany_assoc.mergeAssocId).map(x => x.mapsTo);
        // if (mg_assocks.length !== 1 || mks.length !== 1) return __wrapper;

        __wrapper.exists = [
            {
                table: hasmany_assoc.mergeTable,
                link: [ mg_ks, mks ],
                conditions: findby.on
            }
        ];

        __wrapper.exists = convert_exists(__wrapper.exists)
    } else if (
        findby.where
        && (
            (found_assoc = get_one_association_item(base_instance, findby.extend))
            ||
            (found_assoc = get_extendsto_association_item(base_instance, findby.extend))
        )
    ) {
        let findby_conditions = findby.where
        if (!filter_conditions(findby_conditions)) return __wrapper;

        if (!checkout_acl(req.session, 'find', base_model.ACL, findby.extend)) return __wrapper;

        let accessor_fn = null ,
            accessor_name = null,
            accessor_payload = null;
            
        const findby_accessor_name = found_assoc.modelFindByAccessor || `findBy${ucfirst(findby.extend)}`;

        ;[
            base_model
        ].forEach(test_payload => {
            if (accessor_name)
                return ;
            
            accessor_fn = test_payload[findby_accessor_name]
            if (typeof accessor_fn === 'function') {
                accessor_payload = test_payload
                accessor_name = findby_accessor_name
            }
        });
        
        __wrapper.findby_infos.push({
            accessor: accessor_name,
            accessor_payload: accessor_payload,
            conditions: findby_conditions
        })
    }
    
    return __wrapper
}

export function query_filter_skip (query: FibApp.FibAppReqQuery) {
    var skip = +query.skip;
    if (isNaN(skip) || skip < 0)
        skip = 0;

    return skip
}

export function query_filter_limit (query: FibApp.FibAppReqQuery) {
    var limit = +query.limit;
    if (isNaN(limit) || limit < 0 || limit > 1000)
        limit = 100;

    return limit
}

export function is_count_required (query: FibApp.FibAppReqQuery) {
    if (!query)
        return false
    
    return query.count_required == true || query.count == 1
}

export function found_result_selector (result: FibApp.FibAppIneternalApiFindResult, fetch_field: 'results' | 'count' | '' = '') {
    return fetch_field ? result[fetch_field] : result
}

function convert_exists (exists: FibApp.ReqWhereExists) {
    if (!Array.isArray(exists))
        exists = []

    return exists.filter(exist_item => {
        if (!exist_item) return false;
        if (!exist_item.table || typeof exist_item.table !== 'string') return false;

        if (!filter_exist_item_link(exist_item)) return false;

        if (!filter_conditions(exist_item.conditions)) return false;

        return true;
    })
};

export function parse_findby (req: FibApp.FibAppReq): FibApp.FibAppReqQuery['findby'] | null {
    const query = req.query;

    var findby: FibApp.FibAppReqQuery['findby'] = (query.findby || null)
    if (typeof findby === 'string') {
        try {
            findby = JSON.parse(findby)
        } catch (e) {
            findby = null;
        }
    }

    return findby;
}

// internal helper function for `filter_exist_item_link`
function filter_link_tuple (tuple: any): any[] {
    if (!Array.isArray(tuple))
        return []
    
    return tuple.filter(x => x)
}

function is_valid_string_tuple (tuple: any): any {
    return tuple.every(x => typeof x === 'string') 
}

function filter_exist_item_link (exist_item: FxOrmQuery.ChainWhereExistsInfo) {
    if (!Array.isArray(exist_item.link))
        return false;

    const link_list = filter_link_tuple(exist_item.link)

    /**
     * tuple1: ['t1_assocf', 't2_assocf']
     * tuple2: [
     *      ['t1_assocf1', 't1_assocf2'],
     *      ['t2_assocf1', 't2_assocf2'],
     * ]
     */
    if (link_list.length !== 2)
        return false;
    
    if (Array.isArray(link_list[0])) {
        link_list[0] = filter_link_tuple(link_list[0])
        
        if (link_list[0].length === 0) return false;
        link_list[1] = filter_link_tuple(link_list[1])
        if (link_list[1].length === 0) return false;

        if (link_list[0].length !== link_list[1].length) return false;

        if (!is_valid_string_tuple(link_list[0])) return false;
        if (!is_valid_string_tuple(link_list[1])) return false;
    } else if (!is_valid_string_tuple(link_list)) {
        return false
    }
    
    return link_list
}

function filter_conditions (conditions: FxSqlQuerySubQuery.SubQueryConditions) {
    if (!conditions) return false;

    if (util.isArray(conditions)) return false;
    if (!util.isObject(conditions)) return false;
    
    if (!Object.keys(conditions).length) return false;

    return conditions
}