const orm = require('@fxjs/orm');
const util = require('util')

const assert = require('assert')

module.exports = db => {
    db.define('person', {
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
                var app = db.app
                var findRep = app.api.find({
                    ...req,
                    query: {
                        ...req.query,
                        where: {name: { eq: data.name }}
                    }
                }, db, db.models['person'])

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
        viewServices: {
            staticUndefined: undefined,

            staticNull: null,
            staticNumber: 123,
            staticNaN: NaN,
            staticString: 'static person',
            staticBoolean: true,
            staticObject: {a: 1, b: function() {}},
            staticSymbol: Symbol('symbol-string'),

            test () {
                return {
                    success: null
                }
            },
            testReqSession (req) {
                return {
                    success: req.session
                }
            },
            testReqQuery (req) {
                return {
                    success: req.query
                }
            },
            testCtxOrm (req) {
                assert.isObject(db)

                return {
                    success: Object.keys(db.models)
                }
            }
        }
    });
};
