const util = require('util')

function getDefaultFilterKeys () {
    return [
        'createdAt',
        'updatedAt'
    ]
}
exports.clean_result = function (res, filters = getDefaultFilterKeys()) {
    if (!util.isObject(res))
        return 
        
    if (Array.isArray(res))
        res.forEach(r => exports.clean_result(r));
    else {
        filters.forEach(key => {
            delete res[key]
        })
        for (var k in res)
            exports.clean_result(res[k]);
    }
}

exports.check_result = function (res, data, filters = getDefaultFilterKeys()) {
    exports.clean_result(res, filters);
    assert.deepEqual(res, data);
}
