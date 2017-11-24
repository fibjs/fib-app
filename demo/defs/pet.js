const orm = require('fib-orm');

module.exports = db => {
    var person = db.models.person;

    var Pet = db.define('pet', {
        name: String
    });

    Pet.hasOne('createdBy', person);
};