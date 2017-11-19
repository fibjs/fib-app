const orm = require('fib-orm');

module.exports = db => {
    var People = db.models.people;

    People.hasOne("mother", People);
    People.hasOne("father", People);
    People.hasOne("husband", People);
    People.hasOne("wife", People);
    People.hasMany("childs", People);
};