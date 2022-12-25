/**
 * 
 * @param {import('../../../').FibApp.FibAppORM} db 
 */
module.exports = db => {
    var People = db.models.people;
    var City = db.models.city;

    People.hasOne("mother", People);
    People.hasOne("father", People);
    People.hasOne("husband", People);
    People.hasOne("wife", People, {reverse: 'husbands'});
    People.hasMany("childs", People);
    People.hasOne("doctor", People, {reverse: 'patients'});

    People.hasOne("city", City, {required: true});

    People.hasMany("friends", People, {
        hobby: String,
        meeting_time: {
            type: 'date',
            time: true
        }
    }, {
        /**
         * never write 'friends' here,
         * because `hasMany("friends", ...)` would make People 
         * has one property named of 'friends'
         */
        reverse: "my_friends",
        hooks: {
            /**
             * 1st argument is extra object;
             * 
             * 2st argument(optional) is **next callback** in hasMany association's hook
             * 
             * @param {*} extra 
             */
            beforeSave (extra, next) {
                const assert = require('assert')

                assert.equal(arguments[0], extra)
                assert.isFunction(arguments[1])

                // `this` refers to People to be saved via relationship 'friends'
                assert.property(this, 'id')
                assert.property(this, 'name')
                assert.property(this, 'sex')
                assert.property(this, 'createdAt')
                assert.property(this, 'updatedAt')

                assert.property(this, 'friends')
                assert.property(this, 'my_friends')

                if (this.extra) {
                    assert.deepEqual(extra, this.extra)

                    assert.property(this.extra, 'hobby')
                    assert.property(this.extra, 'meeting_time')
                }

                next()
            }
        }
    })

    var knex = db.driver.knex;
    db.define('people_relations_statics', {
        people_id: { type: People.allProperties.id.type },
        childs_count: { type: 'number' },
    }, {
        virtualView: knex.table(People.associations.childs.association.mergeTable).select(
            'people_id',
            knex.raw('count(childs_id) as ??', ['childs_count']),
        ).groupBy(['people_id'])
    })
};
