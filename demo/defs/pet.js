const orm = require('fib-orm');

module.exports = db => {
    db.define('pet', {
        name: String
    });
};