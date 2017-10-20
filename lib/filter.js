module.exports = function (obj, keys) {
    var obj1 = {};
    var v;

    keys.forEach(k => (v = obj[k]) !== undefined ? obj1[k] = v : undefined);
    return obj1;
};