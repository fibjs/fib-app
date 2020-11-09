const test = require('test');
test.setup();

const { check_result, runServer } = require('../test/_utils');

const tappInfo = require('../test/support/spec_helper').getRandomSqliteBasedApp();
const tSrvInfo = require('../test/support/spec_helper').mountAppToSrv(tappInfo.app, {appPath: '/api'});
runServer(tSrvInfo.server, () => void 0)

const http = require('http');
const util = require('util');

var WaterCity = {
    code: 'ST',
    name: 'Tree City'
}

var dataMap = [
        {
            name: 'tom',
            sex: "male",
            age: 35,
            city: WaterCity,
            childs: [
                {
                    name: 'tomSon1',
                    sex: "male",
                    age: 5,
                    city: WaterCity
                }
            ],
            wife: {
                name: 'tomWife',
                sex: "female",
                age: 34,
                city: WaterCity
            }
        }, {
            name: 'jennifer',
            sex: "female",
            age: 37,
            city: WaterCity,
            childs: [
                {
                    name: 'jenniferDaughter1',
                    sex: "female",
                    age: 4,
                    city: WaterCity
                }
            ],
            patients: [
                {
                    name: 'jenniferPatient',
                    sex: "male",
                    age: 39,
                    city: WaterCity
                }
            ]
        }, {
            name: 'bruto',
            sex: "male",
            age: 36,
            city: WaterCity,
            childs: [
                {
                    name: 'bruto-son1',
                    sex: "male",
                    age: 3,
                    city: WaterCity
                }
            ]
        }
    ]

function setup_data (data = dataMap) {
    var rep = http.post(tSrvInfo.appUrlBase + '/people', {
        json: data
    });

    assert.equal(rep.statusCode, 201)

    assert.ok(Array.isArray(rep.json()))
    assert.property(rep.json()[0], 'id')
    assert.property(rep.json()[1], 'createdAt')
}

function set_session (id, roles) {
    http.post(tSrvInfo.serverBase + '/set_session', {
        json: {
            id: id,
            roles: roles
        }
    });
}

function find_query (query) {
    const rep = http.get(tSrvInfo.appUrlBase + '/people', {
        query: query
    });

    return rep.json()
}

var EXCLUDE_KEYS = [ 'id', 'createdAt', 'updatedAt', 'mother_id', 'father_id', 'husband_id', 'doctor_id', 'wife_id', 'city_id' ]
var KEYS_TO_OMIT_IN_POST = ['childs', 'wife', 'patients', 'husbands']

describe("save-operation", () => {
    after(() => tappInfo.utils.cleanLocalDB())

    afterEach(() => tappInfo.utils.dropModelsSync())

    before(() => {
        tappInfo.utils.dropModelsSync();
    });

    it('get extend', () => {
        setup_data();

        var tom = find_query({
            where: JSON.stringify({
                name: 'tom'
            })
        })[0]
        
        assert.equal(tom.name, 'tom');

        var rep = http.get(tSrvInfo.appUrlBase + `/people/${tom.id}/childs`);

        check_result(rep.json(), [
            {
                name: 'tomSon1',
                sex: "male",
                age: 5
            }
        ], EXCLUDE_KEYS);

        var tomSon1 = rep.json()[0];

        var rep = http.get(tSrvInfo.appUrlBase + `/people/${tomSon1.id}/city`);
        check_result(rep.json(), WaterCity, EXCLUDE_KEYS);
    });

    it('find nothing if no init', () => {
        var tom = find_query({
            where: JSON.stringify({
                name: 'tom'
            })
        })[0];

        assert.equal(tom, undefined);

        var jennifer = find_query({
            where: JSON.stringify({
                name: 'jennifer'
            })
        })[0];

        assert.equal(jennifer, undefined);
    });

    it('post/put/del has-many extend', () => {
        var tom, tomSon1, tomWife;
        
        ;(() => {
            setup_data(
                dataMap.map(
                    dataItem => util.omit(dataItem, KEYS_TO_OMIT_IN_POST)
                )
            );

            tom = find_query({
                where: JSON.stringify({
                    name: 'tom'
                })
            })[0];

            check_result(
                tom,
                util.pick(dataMap.find(x => x.name === 'tom'), Object.keys(tom)),
                EXCLUDE_KEYS
            );
        })();

        /* deal with tom's childs `tomSon1` */
        ;(() => {
            tomSon1 = find_query({
                where: JSON.stringify({
                    name: 'tomSon1'
                })
            })[0];

            assert.equal(tomSon1, undefined);

            var rep = http.post(tSrvInfo.appUrlBase + `/people/${tom.id}/childs`, {
                json: dataMap.find(x => x.name === 'tom').childs.find(x => x.name === 'tomSon1')
            });

            assert.equal(rep.statusCode, 201);
            assert.property(rep.json(), 'id');
            assert.property(rep.json(), 'createdAt');

            tomSon1 = rep.json();

            check_result(
                tomSon1,
                util.pick(
                    dataMap.find(x => x.name === 'tom').childs.find(x => x.name === 'tomSon1'),
                    Object.keys(tomSon1)
                ),
                EXCLUDE_KEYS
            );

            // time go by, tomSon1 turning a year older
            var rep = http.put(tSrvInfo.appUrlBase + `/people/${tom.id}/childs/${tomSon1.id}`, {
                json: {
                    age: dataMap.find(x => x.name === 'tom').childs.find(x => x.name === 'tomSon1').age + 1
                }
            });

            assert.equal(rep.statusCode, 200);
            assert.property(rep.json(), 'id');
            assert.property(rep.json(), 'updatedAt');

            tomSon1 = find_query({
                where: JSON.stringify({
                    name: 'tomSon1'
                })
            })[0];

            assert.equal(tomSon1.age, dataMap.find(x => x.name === 'tom').childs.find(x => x.name === 'tomSon1').age + 1)
        })();

        /* deal with tom's wife `tomWife` */
        ;(() => {
            tomWife = find_query({
                where: JSON.stringify({
                    name: 'tomWife'
                })
            })[0];

            assert.equal(tomWife, undefined);

            // yeah! they get married :(
            var rep = http.post(tSrvInfo.appUrlBase + `/people/${tom.id}/wife`, {
                json: dataMap.find(x => x.name === 'tom').wife
            });

            assert.equal(rep.statusCode, 201);
            assert.property(rep.json(), 'id');
            assert.property(rep.json(), 'createdAt');

            tomWife = rep.json();

            check_result(
                tomWife,
                util.pick(
                    dataMap.find(x => x.name === 'tom').wife,
                    Object.keys(tomWife)
                ),
                EXCLUDE_KEYS
            );

            // oops! they break down :(
            var rep = http.del(tSrvInfo.appUrlBase + `/people/${tom.id}/wife/${tomWife.id}`, {
            });

            assert.equal(rep.statusCode, 200);
            assert.property(rep.json(), 'id');
            assert.property(rep.json(), 'updatedAt');

            assert.equal(tom.id, rep.json().id);
        })();
    });

    it('post/put/del reversed has-many extend', () => {
        var jennifer, patients;
        
        ;(() => {
            setup_data(
                dataMap.map(
                    dataItem => util.omit(dataItem, KEYS_TO_OMIT_IN_POST)
                )
            );

            jennifer = find_query({
                where: JSON.stringify({
                    name: 'jennifer'
                })
            })[0];

            check_result(
                jennifer,
                util.pick(dataMap.find(x => x.name === 'jennifer'), Object.keys(jennifer)),
                EXCLUDE_KEYS
            );
        })();

        /* deal with jennifer's wife `patients` */
        ;(() => {
            // one patient moved to here, and get jennifer as his private doctor
            var rep = http.post(tSrvInfo.appUrlBase + `/people/${jennifer.id}/patients`, {
                json: dataMap.find(x => x.name === 'jennifer').patients
            });

            assert.equal(rep.statusCode, 201);
            assert.property(rep.json()[0], 'id');
            assert.property(rep.json()[0], 'createdAt');

            patients = rep.json();


            check_result(
                patients[0],
                util.pick(
                    dataMap.find(x => x.name === 'jennifer').patients,
                    Object.keys(patients[0])
                ),
                EXCLUDE_KEYS
            );

            // try to delete jennifer's one patient, but would failed.
            var rep = http.del(tSrvInfo.appUrlBase + `/people/${jennifer.id}/patients/${patients[0].id}`, {
            });

            /**
             * we cannot do this due to design of @fxjs/orm: 
             * 
             * it's RULE that reversed association cannot delete
             * its releated association in hasOne association,
             * that's resonable -- you cannot get the only 
             * `m` object for the `1` object in `m:1` relation,
             * you can just
             */
            assert.equal(rep.statusCode, 404);

            assert.equal(
                rep.json().message,
                "'patients' in class 'people' does not support this operation"
            );

            // the patient will move house, he would change his doctor.
            var rep = http.del(tSrvInfo.appUrlBase + `/people/${patients[0].id}/doctor/${jennifer.id}`, {
            });

            assert.equal(rep.statusCode, 200);

            assert.property(rep.json(), 'id');
            assert.property(rep.json(), 'updatedAt');

            assert.equal(patients[0].id, rep.json().id);

            // NOTICE: edel just end up one association between objects, NOT DEL any one of them.
            jennifer = find_query({
                where: JSON.stringify({
                    name: 'jennifer'
                })
            })[0];

            check_result(
                jennifer,
                util.pick(dataMap.find(x => x.name === 'jennifer'), Object.keys(jennifer)),
                EXCLUDE_KEYS
            );
        })();
    });

    xit('graphql query', () => {
        var rep = http.post(tSrvInfo.appUrlBase + ``, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                find_people{
                    id,
                    name
                }
            }`
        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}
