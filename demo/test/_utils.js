const util = require('util')

function getDefaultFilterKeys () {
    return [
        'createdAt',
        'updatedAt'
    ]
}
exports.clean_result = function (res, filters = getDefaultFilterKeys()) {
    if (!util.isObject(res))
        return res
    
    if (Array.isArray(res))
        return res.map(r => exports.clean_result(r, filters));
    else {
        res = util.omit(res, filters)

        for (var k in res)
            res[k] = exports.clean_result(res[k], filters);
    }
    return res
}

exports.check_result = function (res, data, filters = getDefaultFilterKeys()) {
    res = exports.clean_result(res, filters);
    data = exports.clean_result(data, filters);

    assert.deepEqual(res, data);
}

exports.cutOffMilliSeconds = function (date) {
    date = new Date(date)

    return date.getTime() - date.getMilliseconds()
}

exports.cutOffSeconds = function (date) {
    date = new Date(date)

    return date.getTime() - date.getSeconds()
}

exports.runServer = (svr, cb) => {
    // fibjs >= 0.28
    if (typeof svr.start === 'function') {
        svr.start();
        cb();
    } else {
        svr.run(cb);
    }
}