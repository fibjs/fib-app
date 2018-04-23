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

function formatDate(date, fmt) {
    let o = {
        'M+': date.getMonth() + 1,
        'd+': date.getDate(),
        'h+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds(),
        'q+': Math.floor((date.getMonth() + 3) / 3),
        'S': date.getMilliseconds()
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    for (let k in o)
        if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
    return fmt;
};

function convertDate(dateList, driver, where) {
    for (var key in dateList) {
        if (dateList[key].type !== "date" && driver !== "mysql") return;

        for (var k in where) {
            var v = where[k];
            if (util.isArray(v)) {
                for (let i = 0; i < v.length; i++) {
                    v[i] = formatDate(new Date(v[i]), "yyyy-MM-dd hh:mm:ss");
                }
            }
            else if (util.isObject(v)) {
                const keys = Object.keys(v);
                if (keys.length >= 1) {
                    var op = keys[0];

                    if (op === "in" || op === "not_in" || op === "not_between" || op === "between") {
                        var as = v[op];
                        if (util.isArray(as)) {
                            for (let i = 0; i < as.length; i++) {
                                as[i] = formatDate(new Date(as[i]), "yyyy-MM-dd hh:mm:ss");
                            }
                        }
                    } else if (op !== "like" && op !== "not_like") {
                        for (var key in v) {
                            v[key] = formatDate(new Date(v[key]), "yyyy-MM-dd hh:mm:ss");
                        }
                    }
                    // Not to deal with like & not_like
                }
            }else {
                v = formatDate(new Date(v), "yyyy-MM-dd hh:mm:ss");
            }
        }
    }
}

var convert_where = module.exports = function (where, dateList, driver) {
    var where1 = {};
    var or = where["or"];

    if (util.isArray(or)) {
        where1["or"] = or.map((o, dateList, driver) => convert_where(o, dateList, driver));
        return where1;
    }

    convertDate(dateList, driver, where);
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