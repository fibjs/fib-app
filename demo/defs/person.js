const orm = require('fib-orm');

module.exports = db => {
    var Person = db.define('person', {
        name: String,
        sex: ["male", "female"],
        age: Number,
        createAt: Date,
        updateAt: Date
    }, {
        validations: {
            age: orm.enforce.ranges.number(10, 18, "teenage")
        }
    });

    Person.methods = {
        test: (req, data) => {
            return {
                message: "test",
                data: data
            }
        },
        test1: (req, data) => {
            req.response.json({
                message: "current result"
            });
        }
    }
};