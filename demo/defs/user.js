const orm = require('fib-orm');
const crypto = require('crypto');
const hash = require('hash');

module.exports = db => {
    var User = db.define('user', {
        name: String,
        sex: ["male", "female"],
        age: Number,
        password: String,
        salt: String
    }, {
        hooks: {
            beforeCreate: function () {
                var salt = crypto.pseudoRandomBytes(64);
                this.salt = salt.hex();
                this.password = crypto.pbkdf2(this.password, salt, 256, 64, 'sha1').hex();
            }
        },
        validations: {
            name: orm.enforce.security.username({
                length: 4
            }, "user name")
        }
    });
};