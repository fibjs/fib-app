const orm = require('fib-orm');
const util = require('util');

var convert_where = module.exports = function (where) {
    var where1 = {};
    var or = where["$or"];

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

                if (op === "$eq")
                    where1[k] = orm.eq(v[op]);
                else if (op === "$ne")
                    where1[k] = orm.ne(v[op]);
                else if (op === "$gt")
                    where1[k] = orm.gt(v[op]);
                else if (op === "$gte")
                    where1[k] = orm.gte(v[op]);
                else if (op === "$lt")
                    where1[k] = orm.lt(v[op]);
                else if (op === "$lte")
                    where1[k] = orm.lte(v[op]);
                else if (op === "$between") {
                    var as = v[op];
                    if (util.isArray(as))
                        where1[k] = orm.between(as[0], as[1]);
                } else if (op === "$not_between") {
                    var as = v[op];
                    if (util.isArray(as))
                        where1[k] = orm.not_between(as[0], as[1]);
                } else if (op === "$like")
                    where1[k] = orm.like(v[op]);
                else if (op === "$not_like")
                    where1[k] = orm.not_like(v[op]);
                else if (op === "$in")
                    where1[k] = v[op];
                else if (op === "$not_in")
                    where1[k] = orm.not_in(v[op]);
            }
        } else
            where1[k] = v;
    }

    return where1;
};