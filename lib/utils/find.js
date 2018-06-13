Object.defineProperty(exports, "__esModule", { value: true });
const convert_where_1 = require("./convert_where");
const check_acl_1 = require("./check_acl");
const filter_1 = require("./filter");
function default_1(req, exec, bobj, extend) {
    var query = req.query;
    var keys = query.keys;
    if (keys !== undefined)
        exec = exec.only(keys);
    var where = query.where;
    if (where !== undefined)
        where = convert_where_1.default(where);
    else
        where = {};
    var exec = exec.where(where);
    var skip = +query.skip;
    if (isNaN(skip) || skip < 0)
        skip = 0;
    exec = exec.offset(skip);
    var limit = +query.limit;
    if (isNaN(limit) || limit < 0 || limit > 1000)
        limit = 100;
    exec = exec.limit(limit);
    var order = query.order;
    if (order !== undefined)
        exec = exec.order(order);
    // avoid extra find action such as `exec.allSync()`
    var objs = [];
    if (limit > 0) {
        objs = exec.allSync();
    }
    objs = objs.map(obj => {
        var a;
        if (extend !== undefined)
            a = check_acl_1.check_robj_acl(req.session, 'read', bobj, obj, extend);
        else
            a = check_acl_1.check_obj_acl(req.session, 'read', obj);
        if (!a)
            return null;
        return filter_1.filter(filter_1.filter_ext(req.session, obj), keys, a);
    });
    if (query.count == 1)
        return {
            results: objs,
            count: exec.countSync()
        };
    return objs;
}
exports.default = default_1;
;
