const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ejs = require('ejs');
const fpug = require('fib-pug')

module.exports = db => {
    var User = db.define('user', {
        name: {
            type: 'text',
            comment: '用户名'
        },
        sex: ["male", "female"],
        age: Number,
        password: {
            type: 'text',
            comment: '密码'
        },
        salt: String
    }, {
        hooks: {
            beforeSave: function () {
                const assert = require('assert')
                if (this.$rest_req_info) {
                    assert.isTrue(this.$in_filtered_rest)
                    assert.property(this.$rest_req_info, 'session')
                    assert.property(this.$rest_req_info, 'query')
                } else {
                    assert.notExist(this.$in_filtered_rest)
                    assert.notOk(this.$in_filtered_rest)
                }
            },
            beforeCreate: function () {
                var salt = crypto.pseudoRandomBytes(64);
                this.salt = salt.hex();
                this.password = crypto.pbkdf2(this.password, salt, 256, 64, 'sha1').hex();
            }
        },
        tableComment: "用户表",
    });

    User.settings.set('rest.model.inject_rest_request_info', Math.random(0, 1) > 0.5)
};
