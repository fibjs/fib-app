module.exports = db => {
    var People = db.models.people;

    People.hasOne("mother", People);
    People.hasOne("father", People);
    People.hasOne("husband", People);
    People.hasOne("wife", People, {reverse: 'husbands'});
    People.hasMany("childs", People);

    People.hasMany("friends", People, {
        hobby: String,
        meeting_time: Date
    }, {
        /**
         * never write 'friends' here,
         * because `hasMany("friends", ...)` would make People 
         * has one property named of 'friends'
         */
        reverse: "my_friends",
        beforeSave () {
            console.log('beforeSave', this)
        }
    })
};
