const json = require('json');
const convert_where = require('./convert_where');
const {
    check_obj_acl
} = require('./check_acl');
const filter = require('./filter');

module.exports = function (req, cls, exec, acl_name) {
    var query = req.query;

    var keys = query.keys;
    if (keys !== undefined)
        exec = exec.only(keys);

    var where = query.where;
    if (where !== undefined)
        where = convert_where(where);
    else where = {};

    var exec = exec.where(where);

    var skip = +query.skip;
    if (isNaN(skip) || skip < 0)
        skip = 0;
    exec = exec.offset(skip);

    var limit = +query.limit;
    if (isNaN(limit) || limit <= 0 || limit > 1000)
        limit = 100;
    exec = exec.limit(limit);

    var order = query.order;
    if (order !== undefined)
        exec = exec.order(order);

    var objs = exec.allSync();
    objs = objs.map(obj => {
        var a = check_obj_acl(req.session, acl_name, obj);
        if (!a)
            return null;

        return filter(obj, keys, a);
    });

    if (query.count == 1)
        return {
            results: objs,
            count: exec.countSync()
        };

    return objs;
};