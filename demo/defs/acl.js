const orm = require('fib-orm');

module.exports = db => {
    var ext = db.define('ext_acl', {
        name: String
    });

    var ext1 = db.define('ext_acl1', {
        name: String
    });

    var test = db.define('test_acl', {
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
                },
                "role:r4": {
                    'write': ['ext']
                }
            };
        }
    });

    test.hasMany('ext', ext, {}, {
        autoFetch: true
    });
    test.hasOne('ext1', ext1, {
        autoFetch: true
    });
};