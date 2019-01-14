/// <reference lib="es2017" />

import orm = require('@fxjs/orm');
import util = require('util');
import { get_many_association_item, get_one_association_item } from './orm-assoc';
import { checkout_robj_acl } from './checkout_acl';

export function query_filter_where (query: FibApp.FibAppReqQuery) {
    var where = query.where;

    if (where !== undefined)
        where = convert_where(where as FibApp.ReqWhere);
    else
        where = {};

    return where
}

export function query_filter_findby (req: FibApp.FibAppReq, base_model: FxOrmModel.Model) {
    const query = req.query;

    var findby = (query.findby || null) as FibApp.ReqFindByItem;
    if (typeof findby === 'string') {
        try {
            findby = JSON.parse(findby)
        } catch (e) {
            findby = null;
        }
    }

    if (!findby) return ;

    if (!findby.extend) return ;

    let hasmany_assoc: FxOrmNS.InstanceAssociationItem_HasMany,
        hasone_assoc: FxOrmNS.InstanceAssociationItem_HasOne

    let exists: FxOrmQuery.ChainWhereExistsInfo[] = null,
        findby_accessor: string = null,
        findby_conditions: FxSqlQuerySubQuery.SubQueryConditions = null;
    
    const base_instance = new base_model()

    if (
        findby.on
        && (hasmany_assoc = get_many_association_item(base_instance, findby.extend))
    ) {
        // TODO: make sure order of mg_ks is corresponding to mks
        const mg_ks = Object.values(hasmany_assoc.mergeId).map(x => x.mapsTo);
        const mks = base_model.id;

        const extend_instance = new hasmany_assoc.model();
        if (
            !checkout_robj_acl(req.session, 'find', base_instance, extend_instance, findby.extend)
        ) return ;

        /**
         * @description code below means 'support single key only'
         */
        // const mg_assocks = Object.values(hasmany_assoc.mergeAssocId).map(x => x.mapsTo);
        // if (mg_assocks.length !== 1 || mks.length !== 1) return ;

        exists = [
            {
                table: hasmany_assoc.mergeTable,
                link: [ mg_ks, mks ],
                conditions: findby.on
            }
        ];

        exists = convert_exists(exists)
    } else if (
        findby.where
        && (hasone_assoc = get_one_association_item(base_instance, findby.extend))
    ) {
        if (!filter_conditions(findby_conditions))
            return ;

        const extend_instance = new hasone_assoc.model();
        if (
            !checkout_robj_acl(req.session, 'find', base_instance, extend_instance, findby.extend)
        ) return ;

        const assocTplName = hasone_assoc.getAccessor.slice(3)
        findby_accessor = typeof base_instance.model[assocTplName] === 'function' ? assocTplName : null
        findby_conditions = findby.where
    }
    
    return { exists, findby_accessor, findby_conditions }
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

const model_conjunctions_keys: (keyof FxSqlQuerySubQuery.ConjunctionInput__Sample)[] = [
    'or',
    'and',
    'not_or',
    'not_and',
    'not'
];

const ops = {
    "like": orm.like,
    "eq": orm.eq,
    "ne": orm.ne,
    "gt": orm.gt,
    "gte": orm.gte,
    "lt": orm.lt,
    "lte": orm.lte,
    "not_like": orm.not_like,
    "not_in": orm.not_in
};

function convert_where (where: FibApp.ReqWhere, result_where = {}) {
    var conjunction_where = util.pick(where, model_conjunctions_keys);
    var normal_where = util.omit(where, model_conjunctions_keys);

    for (let k in conjunction_where) {
        const cw = conjunction_where[k]
        if (!Array.isArray(cw)) continue
        
        result_where[k] = cw.map((o: FxSqlQueryComparator.SubQueryInput) => convert_where(o));
    }

    for (var k in normal_where) {
        var v = normal_where[k];

        if (util.isArray(v))
            result_where[k] = v;
        else if (util.isObject(v)) {
            const keys = Object.keys(v);
            if (keys.length >= 1) {
                var op = keys[0];

                if (op === "between") {
                    var as = v[op];
                    if (util.isArray(as))
                        result_where[k] = orm.between(as[0], as[1]);
                } else if (op === "not_between") {
                    var as = v[op];
                    if (util.isArray(as))
                        result_where[k] = orm.not_between(as[0], as[1]);
                } else if (op === "in")
                    result_where[k] = v[op];
                else if (ops[op])
                    result_where[k] = ops[op](v[op]);
            }
        } else
            result_where[k] = v;
    }

    return result_where;
};

function convert_exists (exists: FibApp.ReqWhereExists) {
    if (!Array.isArray(exists))
        exists = []

    return exists.filter(exist_item => {
        if (!exist_item) return false;
        if (!exist_item.table || typeof exist_item.table !== 'string') return false;

        if (!filter_exist_item_link(exist_item)) return false;

        if (!filter_conditions(exist_item.conditions)) return false;
        
        exist_item.conditions = convert_where(exist_item.conditions);

        if (!filter_conditions(exist_item.conditions)) return false;

        return true;
    })
};

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