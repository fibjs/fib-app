const orm = require('fib-orm');

module.exports = db => {
    var People = db.define('people', {
        name: String,
        sex: ["male", "female"],
        age: Number
    }, {
        ACL: {
            '*': {
                '*': true,
                'extends': {
                    '*': true
                }
            },
            'roles': {
                'test': {
                    'read': ['name', 'sex', 'mother_id']
                }
            }
        }
    });
};