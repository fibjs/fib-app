const orm = require('fib-orm');

module.exports = db => {
    db.define('person', {
        name: String,
        sex: ["male", "female"],
        age: Number
    }, {
        validations: {
            age: orm.enforce.ranges.number(10, 18, "teenage")
        }
    });
};