const orm = require('fib-orm');

module.exports = db => {
    db.define('test_acl', {
        name: String,
        age: Number,
        sex: String
    }, {
        methods: {
            ACL: function (session) {
                if (session.id == '54321') {
                    var acl = {};
                    acl[session.id] = {
                        "*": true
                    };
                    return acl;
                }
            }
        },
        ACL: function (session) {
            return {
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
                    'create': ['name'],
                    'read': ['name', 'age'],
                    'write': ['age'],
                    "find": true
                }
            };
        }
    });
};