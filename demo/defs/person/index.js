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
                const app = db.app
                const findRep = app.api.find({
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
        webx: {
            rpc: {
                _getPersonByName ({ name, $session }) {
                    assert.property($session, 'id')
                    assert.isArray($session.roles)
                    
                    const app = db.app
                    const findRep = app.api.find({
                        session: $session,
                        query: {
                            where: {name: { eq: name }}
                        }
                    }, db, db.models['person'])

                    if (findRep.error)
                        throw findRep.error

                    return findRep.success.map(x => util.pick(x, 'name'))
                }
            }
        },
    });
};
