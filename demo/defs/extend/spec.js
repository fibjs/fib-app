const test = require('test');
test.setup();

const http = require('http');

const { check_result } = require('../../test/_utils');

const testAppInfo = require('../..').getRandomSqliteBasedApp();
const testSrvInfo = require('../..').mountAppToSrv(testAppInfo.app, {appPath: '/api'});
testSrvInfo.server.run(() => void 0)

describe("extend", () => {
    var ids = [];

    after(() => testAppInfo.cleanSqliteDB())

    it('init data', () => {
        var rep = http.post(testSrvInfo.appUrlBase + '/people', {
            json: [{
                name: 'tom',
                sex: "male",
                age: 35
            }, {
                name: 'alice',
                sex: "famale",
                age: 32
            }, {
                name: 'jack',
                sex: "male",
                age: 8
            }, {
                name: 'lily',
                sex: "famale",
                age: 4
            }]
        });

        rep.json().forEach(r => ids.push(r.id));
    });

    it('init extend', () => {
        var rep = http.put(testSrvInfo.appUrlBase + `/people/${ids[0]}/wife`, {
            json: {
                id: ids[1]
            }
        });
        assert.equal(rep.statusCode, 200)

        var rep = http.get(testSrvInfo.appUrlBase + `/people/${ids[0]}`, {
            query: {
                keys: 'wife_id'
            }
        });
        check_result(rep.json(), {
            wife_id: ids[1]
        });

        var rep = http.put(testSrvInfo.appUrlBase + `/people/${ids[1]}/husband`, {
            json: {
                id: ids[0]
            }
        });
        assert.equal(rep.statusCode, 200)

        function set_parents(id) {
            var rep = http.put(testSrvInfo.appUrlBase + `/people/${id}/father`, {
                json: {
                    id: ids[0]
                }
            });
            assert.equal(rep.statusCode, 200)

            var rep = http.put(testSrvInfo.appUrlBase + `/people/${id}/mother`, {
                json: {
                    id: ids[1]
                }
            });
            assert.equal(rep.statusCode, 200)
        }

        set_parents(ids[2]);
        set_parents(ids[3]);

        function add_childs(id) {
            var rep = http.put(testSrvInfo.appUrlBase + `/people/${id}/childs`, {
                json: {
                    id: ids[2]
                }
            });
            assert.equal(rep.statusCode, 200)

            var rep = http.put(testSrvInfo.appUrlBase + `/people/${id}/childs`, {
                json: {
                    id: ids[3]
                }
            });
            assert.equal(rep.statusCode, 200)
        }

        add_childs(ids[0]);
        add_childs(ids[1]);
    });

    it('get extend', () => {
        var rep = http.get(testSrvInfo.appUrlBase + `/people/${ids[0]}/wife`, {
            query: {
                keys: 'name,age'
            }
        });
        check_result(rep.json(), {
            "name": "alice",
            "age": 32
        });

        var rep = http.get(testSrvInfo.appUrlBase + `/people/${ids[0]}/wife/${ids[1]}`, {
            query: {
                keys: 'name,age'
            }
        });
        check_result(rep.json(), {
            "name": "alice",
            "age": 32
        });

        var rep = http.get(testSrvInfo.appUrlBase + `/people/${ids[2]}/mother`, {
            query: {
                keys: 'name,age'
            }
        });
        check_result(rep.json(), {
            "name": "alice",
            "age": 32
        });

        var rep = http.get(testSrvInfo.appUrlBase + `/people/${ids[0]}/childs`, {
            query: {
                keys: 'name,age',
                order: 'age'
            }
        });
        check_result(rep.json(), [{
            "name": "lily",
            "age": 4
        }, {
            "name": "jack",
            "age": 8
        }]);

        var rep = http.get(testSrvInfo.appUrlBase + `/people/${ids[0]}/childs/${ids[3]}`, {
            query: {
                keys: 'name,age',
                order: 'age'
            }
        });
        check_result(rep.json(), {
            "name": "lily",
            "age": 4
        });

        var rep = http.get(testSrvInfo.appUrlBase + `/people/${ids[0]}/childs/${ids[1]}`, {
            query: {
                keys: 'name,age',
                order: 'age'
            }
        });
        check_result(rep.json(), {
            "code": 4040602,
            "message": `Object '${ids[1]}' not found in class 'people.childs'.`
        });
    });

    it('delete extend', () => {
        var rep = null

        // you can not do unlink-operation(edel) from on reversed model to its orignal model
        rep = http.del(testSrvInfo.appUrlBase + `/people/${ids[1]}/husbands/${ids[0]}`)
        assert.equal(rep.statusCode, 404);
        check_result(rep.json(), {
            "code": 4040603,
            "message": `'husbands' in class 'people' does not support this operation`
        })

        rep = http.del(testSrvInfo.appUrlBase + `/people/${ids[0]}/wife/${ids[1]}`);
        assert.equal(rep.statusCode, 200);

        var rep = http.get(testSrvInfo.appUrlBase + `/people/${ids[0]}/wife`, {
            query: {
                keys: 'name,age'
            }
        });
        assert.equal(rep.statusCode, 404);

        var rep = http.del(testSrvInfo.appUrlBase + `/people/${ids[0]}/childs/${ids[2]}`);
        assert.equal(rep.statusCode, 200);

        var rep = http.get(testSrvInfo.appUrlBase + `/people/${ids[0]}/childs`, {
            query: {
                keys: 'name,age'
            }
        });
        check_result(rep.json(), [{
            "name": "lily",
            "age": 4
        }]);

        var rep = http.put(testSrvInfo.appUrlBase + `/people/${ids[0]}/childs`, {
            json: {
                id: ids[2]
            }
        });
        assert.equal(rep.statusCode, 200)
    });

    it('create extend object', () => {
        var rep = http.post(testSrvInfo.appUrlBase + `/people/${ids[0]}/childs`, {
            json: {
                name: 'jack_li',
                sex: "male",
                age: 8
            }
        });
        assert.equal(rep.statusCode, 201);
        ids.push(rep.json().id);

        var rep = http.get(testSrvInfo.appUrlBase + `/people/${ids[0]}/childs/${ids[4]}`, {
            query: {
                keys: 'name,age'
            }
        });
        assert.equal(rep.statusCode, 200);
        check_result(rep.json(), {
            "name": "jack_li",
            "age": 8
        });

        var rep = http.post(testSrvInfo.appUrlBase + `/people/${ids[4]}/childs`, {
            json: [{
                name: 'jack_li_0',
                sex: "male",
                age: 8
            }, {
                name: 'jack_li_1',
                sex: "male",
                age: 9
            }]
        });
        assert.equal(rep.statusCode, 201);
        rep.json().forEach(r => ids.push(r.id));

        var rep = http.get(testSrvInfo.appUrlBase + `/people/${ids[0]}/childs/${ids[4]}`, {
            query: {
                keys: 'name,age'
            }
        });
        assert.equal(rep.statusCode, 200);
        check_result(rep.json(), {
            "name": "jack_li",
            "age": 8
        });

        var rep = http.post(testSrvInfo.appUrlBase + `/people/${ids[4]}/wife`, {
            json: {
                name: 'ly_li',
                sex: "famale",
                age: 8
            }
        });
        assert.equal(rep.statusCode, 201);

        var rep = http.get(testSrvInfo.appUrlBase + `/people/${ids[4]}/wife`, {
            query: {
                keys: 'name,age'
            }
        });
        assert.equal(rep.statusCode, 200);
        check_result(rep.json(), {
            name: 'ly_li',
            age: 8
        });
    });

    it('change extend object', () => {
        var rep = http.put(testSrvInfo.appUrlBase + `/people/${ids[0]}/childs/${ids[4]}`, {
            json: {
                name: 'jack_li',
                sex: "male",
                age: 18
            }
        });
        assert.equal(rep.statusCode, 200);

        var rep = http.get(testSrvInfo.appUrlBase + `/people/${ids[0]}/childs/${ids[4]}`, {
            query: {
                keys: 'name,age'
            }
        });
        assert.equal(rep.statusCode, 200);
        check_result(rep.json(), {
            "name": "jack_li",
            "age": 18
        });

        rep = http.del(testSrvInfo.appUrlBase + `/people/${ids[0]}/childs/${ids[4]}`);
        assert.equal(rep.statusCode, 200);
    });

    it("multi level create", () => {
        var rep = http.post(testSrvInfo.appUrlBase + '/people', {
            json: [{
                name: 'tom',
                sex: "male",
                age: 35,
                wife: {
                    name: 'lily',
                    sex: "famale",
                    age: 35,
                    childs: [{
                        name: 'coco',
                        sex: "famale",
                        age: 12,
                    }]
                }
            }]
        });
    })

    it("graphql query hasMany-extend with extra", () => {
        function assertInstance(people) {
            assert.property(people, 'id')
            assert.property(people, 'name')
            assert.property(people, 'sex')
            assert.property(people, 'age')
            assert.property(people, 'createdAt')
        }

        var rep = null;
        var base_obj = null, ext_obj = null;

        var getTestData = function () {
            return {
                name: 'tom_with_friend',
                sex: "male",
                age: 35,
                friends: [
                    {
                        name: 'friend_of_tom',
                        sex: "famale",
                        age: 35,
                        extra: {
                            hobby: 'train',
                            meeting_time: Date.now()
                        },
                        childs: [
                            {
                                name: 'coco_of_friend_of_tom',
                                sex: "famale",
                                age: 12,
                            }
                        ]
                    }
                ]
            }
        }

        var doPost = function (testdata) {
            return http.post(testSrvInfo.appUrlBase + '/people', {
                json: [testdata]
            });
        }

        var doPut = function (testdata) {
            testdata.friends[0].id = ext_obj.id
            testdata.friends[0].age = 36
            testdata.friends[0].extra.hobby = 'train2'

            return http.put(testSrvInfo.appUrlBase + `/people/${base_obj.id}/friends/${ext_obj.id}`, {
                json: testdata.friends[0]
            });
        }

        var doGraphQlCheck = function (testdata) {
            rep = http.post(testSrvInfo.appUrlBase + '', {
                json: {
                    requests: [
                        {
                            method: 'POST',
                            path: '/',
                            headers: {
                                'Content-Type': 'application/graphql'
                            },
                            body: `{
                                find_people(
                                    where: {
                                        name: "tom_with_friend"
                                    }
                                ){
                                    id
                                    name
                                    sex
                                    age
                                    createdAt
                                    friends(
                                        where: {
                                            name: "friend_of_tom"
                                        }
                                    ){
                                        id
                                        name
                                        sex
                                        age
                                        createdAt
                                        my_friends{
                                            id
                                            name
                                            sex
                                            age
                                            createdAt
                                        }
                                        extra{
                                            hobby
                                            meeting_time
                                        }
                                    }
                                    friends__extra{
                                        id
                                        name
                                        sex
                                        age
                                        createdAt
                                    }
                                }
                            }`
                        }
                    ]
                }
            });

            var response = rep.json();
            assert.property(response[0], 'success');

            var queriedPeople = response[0].success.data.find_people[0];

            base_obj = base_obj || queriedPeople
            assertInstance(queriedPeople)
            assert.property(queriedPeople, 'friends')

            var cur_ext_obj = queriedPeople.friends[0]
            ext_obj = ext_obj || cur_ext_obj
            assertInstance(cur_ext_obj)
            assert.property(cur_ext_obj, 'my_friends')

            /* compare original instance's data with data from reversed instance's reverse accessor */
            assertInstance(cur_ext_obj.my_friends[0])
            Object.keys(cur_ext_obj.my_friends[0]).forEach(key => {
                if (queriedPeople.hasOwnProperty(key))
                    assert.equal(
                        queriedPeople[key],
                        cur_ext_obj.my_friends[0][key]
                    )
            })

            /* check extra data */
            assert.property(cur_ext_obj, 'extra')
            assert.property(cur_ext_obj.extra, 'hobby')
            assert.deepEqual(
                cur_ext_obj.extra.hobby,
                testdata.friends.find(x => x.name === 'friend_of_tom').extra.hobby
            )
            assert.property(cur_ext_obj.extra, 'meeting_time')
            assert.deepEqual(
                gettime(cur_ext_obj.extra.meeting_time),
                gettime(testdata.friends.find(x => x.name === 'friend_of_tom').extra.meeting_time)
            )
            
            assert.property(queriedPeople, 'friends__extra')
            assert.property(cur_ext_obj, 'extra')
        }

        var td1 = getTestData()
        doPost(td1)
        doGraphQlCheck(td1)

        var td2 = getTestData()
        doPut(td2)
        doGraphQlCheck(td2)
    })
});

if (require.main === module) {
    test.run(console.DEBUG);
    process.exit();
}

function gettime(m) {
    return (new Date(m)).getTime()
}