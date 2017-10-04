const http = require('http');
const api = require('../');
const orm = require('fib-orm');

function define(db) {
    db.define('pet', {
        name: String,
        sex: ["male", "female"],
        age: Number
    }, {
        methods: {
            get_name: function () {
                return this.name;
            }
        },
        validations: {
            age: orm.enforce.ranges.number(10, 18, "teenage")
        }
    });

    db.syncSync();
}

var root_server = {
    '/1.0': api.server('sqlite:test.db', define)
};

var svr = new http.Server(8080, root_server);
svr.run(() => {});