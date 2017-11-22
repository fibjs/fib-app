const util = require('util');

module.exports = function (obj, keys, keys1) {
    if (Array.isArray(keys)) {
        if (Array.isArray(keys1))
            keys = util.intersection(keys, keys1)
    } else if (Array.isArray(keys1))
        keys = keys1

    if (!Array.isArray(keys))
        return obj;

    var obj1 = {};
    var v;

    keys.forEach(k => (v = obj[k]) !== undefined ? obj1[k] = v : undefined);
    return obj1;
};