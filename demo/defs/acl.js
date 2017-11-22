const orm = require('fib-orm');

module.exports = db => {
    var ext = db.define('ext_acl', {
        name: String,
        age: Number
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
        ACL: {
            '*': {
                '*': false
            },
            'roles': {
                'admin': {
                    '*': true
                }
            }
        }
    });

    var ext1 = db.define('ext_acl1', {
        name: String,
        age: Number
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
                "9999": {
                    '*': false
                },
                'roles': {
                    'r1': {
                        '*': true
                    },
                    'r2': {
                        'create': true
                    },
                    'r3': {
                        'create': ['name'],
                        'read': ['name', 'age'],
                        'write': ['age'],
                        "find": true
                    },
                    'r4': {
                        'write': ['ext'],
                        'extends': {
                            'ext': {
                                'read': ['name']
                            }
                        }
                    },
                    'admin': {
                        '*': true
                    }
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