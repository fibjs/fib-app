const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ejs = require('ejs');
const fpug = require('fib-pug')

module.exports = db => {
    var User = db.define('user', {
        name: String,
        sex: ["male", "female"],
        age: Number,
        password: String,
        salt: String
    }, {
        hooks: {
            beforeSave: function () {
                const assert = require('assert')
                if (this.$req_info) {
                    assert.property(this.$req_info, 'session')
                    assert.property(this.$req_info, 'query')
                }
            },
            beforeCreate: function () {
                var salt = crypto.pseudoRandomBytes(64);
                this.salt = salt.hex();
                this.password = crypto.pbkdf2(this.password, salt, 256, 64, 'sha1').hex();
            }
        },
        viewFunctions: {
            get (result) {
                let tpl = fpug.compile(
                        fs.readTextFile(path.resolve(__dirname, './tpl.get.pug'))
                    )
                return {
                    success: tpl(result && {user: result.success} || {})
                }
            },
            find (result) {
                let tpl = ejs.compile(
                        fs.readTextFile(path.resolve(__dirname, './tpl.find.ejs'))
                    )
                return {
                    success: tpl(result && {users: result.success} || {})
                }
            },
            /**
             * it's recommended to make static property true when defining custom viewFunction
             */
            profile: {
                static: true,
                /** _ is null */
                handler (_) {
                    let tpl = ejs.compile(
                            fs.readTextFile(path.resolve(__dirname, './tpl.profile.ejs'))
                        )
                    return {
                        success: tpl()
                    }
                }
            },

            css1: {
                static: true,
                handler (_, fib_app_req) {
                    fib_app_req.response_headers = {
                        'Content-Type': 'text/css; charset=utf16'
                    }

                    return {
                        success: 'div {color: red;}'
                    }
                }
            },

            css2: {
                static: true,
                handler (_, fib_app_req) {
                    fib_app_req.response_headers = {
                        'Content-Type': 'text/css; charset=gbk'
                    }

                    return {
                        success: 'div {color: red;}'
                    }
                }
            },

            javascript1: {
                static: true,
                handler (_) {
                    return {
                        success: 'function foo() { return "bar"; }'
                    }
                }
            },

            javascript2: {
                static: true,
                response_headers: {
                    'Content-Type': 'application/javascript; charset=gbk'
                },
                handler (_) {
                    return {
                        success: 'function foo() { return "bar2"; }'
                    }
                }
            }
        }
    });
};
