const orm = require('fib-orm');

module.exports = db => {
    var People = db.define('people', {
        name: String,
        sex: ["male", "female"],
        age: Number
    });
};