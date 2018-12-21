import convert_where = require("./convert_where");

export function query_filter_where (query: FibApp.FibAppReqQuery) {
    var where = query.where;

    if (where !== undefined)
        where = convert_where(where as FibApp.ReqWhere);
    else
        where = {};

    return where
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