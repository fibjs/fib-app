const orm = require('@fxjs/orm');

module.exports = db => {
    var ext = db.define('ext_acl', {
        name: String,
        age: Number
    }, {
        ACL: {
            '*': {
                '*': false
            },
            'roles': {
                'admin': {
                    '*': true
                }
            }
        },
        OACL: function (session) {
            if (session.id == '54321') {
                var acl = {};
                acl[session.id] = {
                    "*": true
                };
                return acl;
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
                        'read': ['name', 'age'],
                        'extends': {
                            'ext': {
                                'find': true,
                                'read': ['name'],
                                'write': ['age'],
                                'create': ['age'],
                                'delete': true
                            }
                        }
                    },
                    'admin': {
                        '*': true
                    }
                }
            };
        },
        OACL: function (session) {
            if (session.id == '54321') {
                var acl = {};
                acl[session.id] = {
                    "*": true,
                    "extends": {
                        "*": true
                    }
                };
                return acl;
            }

            if (process.env.FIBAPP_DEBUG) {
                nonExits
            }
        }
    });

    test.hasMany('ext', ext, {}, {
        autoFetch: true
    });

    test.hasOne('ext1', ext1, {
        autoFetch: true
    });
};
