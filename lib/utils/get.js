var util = require('util');
const err = require('./err');

module.exports = function (cls, id, keys) {
    var exec = cls.find({
        id: id
    });

    if (keys !== undefined)
        exec = exec.only(util.union(keys, ['id', 'ACL']));

    var obj;
    try {
        obj = exec.firstSync();
        if (obj === null)
            err.API(101);
    } catch (e) {
        err.API(101, e.message);
    }

    return obj;
};