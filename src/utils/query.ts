/// <reference lib="es2017" />

import util = require('util');
import  ORM = require('@fxjs/orm');
const Helpers = ORM.Helpers;

import { checkout_acl } from './checkout_acl';
import { ucfirst } from './str';

export function query_filter_where (req: FibApp.FibAppReq) {
    var where = parse_json_queryarg(req, 'where');

    where = where || {};

    return where
}

export function query_filter_join_where (req: FibApp.FibAppReq) {
    var join_where = parse_json_queryarg(req, 'join_where');

    join_where = join_where || {};

    return join_where
}

function assert_valid_findby (
    found_assoc: FxOrmAssociation.InstanceAssociationItem,
    findby: FibApp.ReqFindByItem,
    exec_model: FxOrmModel.Model
) {
    if (!found_assoc) {
        throw `invalid association symbol '${findby.extend}' for model '${exec_model.model_name || exec_model.table}'`
    }

    return true
}

export function query_filter_findby (
    findby: FibApp.FibAppReqQuery['findby'],
    base_model: FxOrmModel.Model,
    opts: {
        extend_in_rest?: string,
        req: FibApp.FibAppReq
    }
): {
    exists: FxOrmQuery.ChainWhereExistsInfo[] | null
    findby_infos: FibApp.FilteredFindByInfo[]
} {
    const { req, extend_in_rest = '' } = opts

    const __wrapper = { exists: null, findby_infos: [] }

    if (!findby) return __wrapper;

    if (!findby.extend || typeof findby.extend !== 'string') return __wrapper;

    let found_assoc: FxOrmAssociation.InstanceAssociationItem;
    
    const exec_model = extend_in_rest && base_model.associations[extend_in_rest] ? base_model.associations[extend_in_rest].association.model : base_model;
    const exec_instance = new exec_model()

    ;(() => {
        if (!findby.on)
            return ;

        if (
            found_assoc = Helpers.getManyAssociationItemFromInstanceByExtname(exec_instance, findby.extend)
        ) {
            const hasmany_assoc = found_assoc as FxOrmNS.InstanceAssociationItem_HasMany;

            // TODO: make sure order of mg_ks is corresponding to mks
            const mg_ks = Object.keys(hasmany_assoc.mergeId).map(k => hasmany_assoc.mergeId[k].mapsTo || k);
            const mks = exec_model.id;

            if (!checkout_acl(req.session, 'find', exec_model.ACL, findby.extend)) return ;

            /**
             * @description code below means 'support single key only'
             */
            const exists_conditions = findby.on
            if (!filter_conditions(exists_conditions)) return ;
            
            __wrapper.exists = [
                {
                    table: hasmany_assoc.mergeTable,
                    link: [ mg_ks, mks ],
                    conditions: exists_conditions
                }
            ];

            __wrapper.exists = convert_exists(__wrapper.exists)
        }

        assert_valid_findby(found_assoc, findby, exec_model);
    })();

    ;(() => {
        if (!findby.where)
            return ;

        if (
            (found_assoc = Helpers.getAssociationItemFromInstanceByExtname('hasOne', exec_instance, findby.extend))
            || (found_assoc = Helpers.getAssociationItemFromInstanceByExtname('hasMany', exec_instance, findby.extend))
            || (found_assoc = Helpers.getAssociationItemFromInstanceByExtname('extendsTo', exec_instance, findby.extend))
        ) {
            const findby_conditions = findby.where
            if (!filter_conditions(findby_conditions)) return ;

            if (!checkout_acl(req.session, 'find', exec_model.ACL, findby.extend)) return ;

            let accessor_fn = null ,
                accessor_name = null,
                accessor_payload = null;
                
            const findby_accessor_name = found_assoc.modelFindByAccessor || `findBy${ucfirst(findby.extend)}`;

            ;[ exec_model ].forEach(test_payload => {
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

        assert_valid_findby(found_assoc, findby, exec_model);
    })();
    
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

export function query_filter_order (query: FibApp.FibAppReqQuery): string[] {
    let order_list = [] as string[]
    var order = query.order;
    if (order !== undefined) {
        order = order || ''
            
        order_list = order.split(',').filter(x => x)
    }
    
    return order_list;
}

export function is_count_required (query: FibApp.FibAppReqQuery) {
    if (!query)
        return false
    
    return query.count_required == true || query.count == 1
}

export function found_result_selector (result: FibApp.FibAppIneternalApiFindResult, fetch_field: 'results' | 'count' | '' = '') {
    return fetch_field ? result[fetch_field] : result
}

function convert_exists (
    exists: FibApp.ReqWhereExists,
    is_allow_empty_link: boolean = false
) {
    if (!Array.isArray(exists))
        exists = []

    return exists.filter(exist_item => {
        if (!exist_item) return false;
        if (!exist_item.table || typeof exist_item.table !== 'string') return false;

        if (!filter_exist_item_link(exist_item)) {
            if (!is_allow_empty_link)
                return false;

            exist_item.link = [[], []];
        }

        if (!filter_conditions(exist_item.conditions)) return false;

        return true;
    })
};

export function parse_json_queryarg <T> (
    req: FibApp.FibAppReq,
    k: 'findby' | 'join_where' | 'where'
): T | null {
    var parsed: any = (req.query[k] || null)
    if (typeof parsed === 'string') {
        try {
            parsed = JSON.parse(parsed)
        } catch (e) {
            parsed = null;
        }
    }

    return parsed;
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
     * exist_item.link: ['t1_assocf', 't2_assocf']
     * exist_item.link: [
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

function filter_conditions (
    conditions: FxSqlQuerySubQuery.SubQueryConditions
) {
    if (!conditions) return false;

    if (util.isArray(conditions)) return false;
    if (!util.isObject(conditions)) return false;
    
    if (!Object.keys(conditions).length) return false;

    return conditions
}

function find_date_property_keys_from_property_hash (hash: FxOrmProperty.NormalizedPropertyHash) {
    return Object.keys(hash).filter(pname => {
        return hash[pname].type === 'date'
    })
}