const orm = require('fib-orm');
const util = require('util');

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

var convert_where = function (where: ReqWhere) {
    var where1 = {};
    var or = where["or"];

    if (util.isArray(or)) {
        where1["or"] = or.map(o => convert_where(o));
        return where1;
    }

    for (var k in where) {
        var v = where[k];

        if (util.isArray(v))
            where1[k] = v;
        else if (util.isObject(v)) {
            const keys = Object.keys(v);
            if (keys.length >= 1) {
                var op = keys[0];

                if (op === "between") {
                    var as = v[op];
                    if (util.isArray(as))
                        where1[k] = orm.between(as[0], as[1]);
                } else if (op === "not_between") {
                    var as = v[op];
                    if (util.isArray(as))
                        where1[k] = orm.not_between(as[0], as[1]);
                } else if (op === "in")
                    where1[k] = v[op];
                else if (ops[op])
                    where1[k] = ops[op](v[op]);
            }
        } else
            where1[k] = v;
    }

    return where1;
};

export = convert_where;
