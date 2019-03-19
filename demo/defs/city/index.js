const push = require('fib-push');

module.exports = db => {
    var City = db.define('city', {
        code: {
            type: 'text',
            required: true
        },
        name: String
    });
};
