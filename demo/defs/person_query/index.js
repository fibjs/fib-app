const orm = require('@fxjs/orm');
const util = require('util')

const assert = require('assert')

module.exports = db => {
    db.define('person_query', {
        name: String,
        sex: ["male", "female"],
        age: Number
    }, {
        validations: {
            age: orm.enforce.ranges.number(10, 18, "teenage")
        },
        functions: {
            test: (req, data) => {
                return {
                    success: {
                        message: "test",
                        data: data
                    }
                }
            },

            getPersonByName: (req, data) => {
                const app = db.app
                const findRep = app.api.find({
                    ...req,
                    query: {
                        ...req.query,
                        where: {name: { eq: data.name }}
                    }
                }, db, db.models['person_query'])

                if (findRep.error) {
                    throw findRep.error
                }

                return {
                    success: {
                        message: 'ok',
                        data: findRep.success.map(x => util.pick(x, 'name'))
                    }
                };
            }
        },
        webx: {
            queryKeyWhiteList: {
                where: ['id'],
            }
        },
    });

    var PetQuery = db.define('pet_query', {
        name: String
    }, {
        webx: {
            queryKeyWhiteList: {
                findby: ['createdBy'],
            }
        },
    });

    PetQuery.hasOne('createdBy', db.models.person_query);
    PetQuery.hasOne('createdBy2', db.models.person_query);
};
