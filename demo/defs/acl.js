const orm = require('fib-orm');

module.exports = db => {
    db.define('test_acl', {
        name: String,
        age: Number,
        sex: String
    }, {
        ACL: {
            '*': {
                '*': false
            },
            "role:r1": {
                '*': true
            },
            "role:r2": {
                'create': true
            },
            "9999": {
                '*': false
            },
            "role:r3": {
                'read': ['name', 'age'],
                'write': ['age']
            },
            ":owner": {
                "*": true
            }
        }
    });
};