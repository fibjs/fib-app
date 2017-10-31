var util = require('util');
const json = require('json');
const err = require('./err');
const convert_where = require('./convert_where');
const check_acl = require('./check_acl');
const filter = require('./filter');

module.exports = function (req, cls, exec, acl_name) {
    var query = req.query;
    var where = query.where;
    if (where !== undefined) {
        try {
            where = json.decode(where);
        } catch (e) {
            err.API(107, e.message);
        }

        where = convert_where(where);
    } else where = {};

    var exec = exec.where(where);

    var order = query.order;
    if (order !== undefined)
        exec = exec.order(order);

    var skip = query.skip;
    if (skip !== undefined) {
        skip = +skip;
        if (isNaN(skip) || skip < 0)
            err.API(118);
        exec = exec.offset(skip);
    }

    var keys = query.keys;
    if (keys !== undefined) {
        keys = keys.split(',');
        exec = exec.only(keys);
    }

    var limit = +query.limit;
    if (isNaN(limit) || limit <= 0 || limit > 1000)
        limit = 100;

    var objs = exec.limit(limit).allSync();
    objs = objs.map(obj => {
        var a = check_acl(req.session, acl_name, cls.ACL, obj.ACL);
        if (!a)
            return null;

        if (Array.isArray(a))
            keys = keys !== undefined ? util.intersection(keys, a) : a;
        return keys !== undefined ? filter(obj, keys) : obj;
    });

    if (query.count == 1)
        return {
            results: objs,
            count: exec.countSync()
        };

    return objs;
};