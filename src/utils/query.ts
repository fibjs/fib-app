import convert_where = require("./convert_where");

export function filterWhere (query: FibApp.FibAppReqQuery) {
    var where = query.where;

    if (where !== undefined)
        where = convert_where(where as FibApp.ReqWhere);
    else
        where = {};

    return where
}

export function filterSkip (query: FibApp.FibAppReqQuery) {
    var skip = +query.skip;
    if (isNaN(skip) || skip < 0)
        skip = 0;

    return skip
}

export function filterLimit (query: FibApp.FibAppReqQuery) {
    var limit = +query.limit;
    if (isNaN(limit) || limit < 0 || limit > 1000)
        limit = 100;

    return limit
}

export function isCountOnly (query: FibApp.FibAppReqQuery) {
    return query.count == 1
}