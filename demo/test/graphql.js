const test = require('test');
test.setup();

const http = require('http');

describe("graphql", () => {
    var ids = [];

    it('init data', () => {
        var rep = http.post('http://127.0.0.1:8080/1.0/app/people', {
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
            },
            {
                name: 'mike',
                sex: "male",
                age: 65
            }
        ]
        });

        rep.json().forEach(r => ids.push(r.id));
    });

    it('init extend', () => {
        var rep = http.put(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/wife`, {
            json: {
                id: ids[1]
            }
        });
        assert.equal(rep.statusCode, 200)

        var rep = http.put(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/father`, {
            json: {
                id: ids[4]
            }
        });
        assert.equal(rep.statusCode, 200)

        var rep = http.get(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}`, {
            query: {
                keys: 'wife_id'
            }
        });

        var rep = http.put(`http://127.0.0.1:8080/1.0/app/people/${ids[1]}/husband`, {
            json: {
                id: ids[0]
            }
        });
        assert.equal(rep.statusCode, 200)

        function set_parents(id) {
            var rep = http.put(`http://127.0.0.1:8080/1.0/app/people/${id}/father`, {
                json: {
                    id: ids[0]
                }
            });
            assert.equal(rep.statusCode, 200)

            var rep = http.put(`http://127.0.0.1:8080/1.0/app/people/${id}/mother`, {
                json: {
                    id: ids[1]
                }
            });
            assert.equal(rep.statusCode, 200)
        }

        set_parents(ids[2]);
        set_parents(ids[3]);

        function add_childs(id) {
            var rep = http.put(`http://127.0.0.1:8080/1.0/app/people/${id}/childs`, {
                json: {
                    id: ids[2]
                }
            });
            assert.equal(rep.statusCode, 200)

            var rep = http.put(`http://127.0.0.1:8080/1.0/app/people/${id}/childs`, {
                json: {
                    id: ids[3]
                }
            });
            assert.equal(rep.statusCode, 200)
        }

        add_childs(ids[0]);
        add_childs(ids[1]);
    });

    it('simple', () => {
        var rep = http.post(`http://127.0.0.1:8080/1.0/app`, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                people(id:"${ids[0]}"){
                    id,
                    name
                }
            }`
        });

        assert.equal(rep.statusCode, 200);
        assert.deepEqual(rep.json(), {
            "data": {
                "people": {
                    "id": ids[0],
                    "name": "tom"
                }
            }
        });
    });

    it('find', () => {
        var rep = http.post(`http://127.0.0.1:8080/1.0/app`, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                find_people(
                    where:{
                        id: {
                            eq: "${ids[0]}"
                        }
                    }
                ){
                    id,
                    name
                }
            }`
        });

        assert.equal(rep.statusCode, 200);
        assert.deepEqual(rep.json(), {
            "data": {
                "find_people": [{
                    "id": ids[0],
                    "name": "tom"
                }]
            }
        });
    });

    it('hasOne', () => {
        var rep = http.post(`http://127.0.0.1:8080/1.0/app`, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                people(id:"${ids[2]}"){
                    id,
                    name,
                    mother{
                        id,
                        name,
                        husband{
                            id,
                            name
                        }
                    }
                }
            }`
        });

        assert.equal(rep.statusCode, 200);
        assert.deepEqual(rep.json(), {
            "data": {
                "people": {
                    "id": ids[2],
                    "name": "jack",
                    "mother": {
                        "id": ids[1],
                        "name": "alice",
                        "husband": {
                            "id": ids[0],
                            "name": "tom"
                        }
                    }
                }
            }
        });
    });

    it('hasOne with null', () => {
        var rep = http.post(`http://127.0.0.1:8080/1.0/app`, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                people(id:"${ids[0]}"){
                    id,
                    name,
                    father{
                        id,
                        name
                    },
                    mother{
                        id,
                        name
                    }
                }
            }`
        });

        assert.equal(rep.statusCode, 200);
        assert.deepEqual(rep.json(), {
            "data": {
              "people": {
                "id": ids[0],
                "name": "tom",
                "father": {
                  "id": ids[4],
                  "name": "mike"
                },
                "mother": null
              }
            }
          });
    });

    describe('hasMany', () => {
        it('simple', () => {
            var rep = http.post(`http://127.0.0.1:8080/1.0/app`, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[0]}"){
                        id,
                        name,
                        childs{
                            id,
                            name,
                            mother{
                                id,
                                name
                            }
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people": {
                        "id": ids[0],
                        "name": "tom",
                        "childs": [{
                                "id": ids[2],
                                "name": "jack",
                                "mother": {
                                    "id": ids[1],
                                    "name": "alice"
                                }
                            },
                            {
                                "id": ids[3],
                                "name": "lily",
                                "mother": {
                                    "id": ids[1],
                                    "name": "alice"
                                }
                            }
                        ]
                    }
                }
            });
        });


        it('where', () => {
            var rep = http.post(`http://127.0.0.1:8080/1.0/app`, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[0]}"){
                        id,
                        name,
                        childs(
                            where:{
                                name: {
                                    eq: "lily"
                                }
                            }
                        ){
                            id,
                            name
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people": {
                        "id": ids[0],
                        "name": "tom",
                        "childs": [{
                            "id": ids[3],
                            "name": "lily"
                        }]
                    }
                }
            });
        });

        it('skip', () => {
            var rep = http.post(`http://127.0.0.1:8080/1.0/app`, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[0]}"){
                        id,
                        name,
                        childs(skip:1){
                            id,
                            name
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people": {
                        "id": ids[0],
                        "name": "tom",
                        "childs": [{
                            "id": ids[3],
                            "name": "lily"
                        }]
                    }
                }
            });
        });

        it('limit', () => {
            var rep = http.post(`http://127.0.0.1:8080/1.0/app`, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[0]}"){
                        id,
                        name,
                        childs(limit:1){
                            id,
                            name
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people": {
                        "id": ids[0],
                        "name": "tom",
                        "childs": [{
                            "id": ids[2],
                            "name": "jack"
                        }]
                    }
                }
            });
        });

        it('order', () => {
            var rep = http.post(`http://127.0.0.1:8080/1.0/app`, {
                headers: {
                    'Content-Type': 'application/graphql'
                },
                body: `{
                    people(id:"${ids[0]}"){
                        id,
                        name,
                        childs(order:"name"){
                            id,
                            name
                        }
                    }
                }`
            });

            assert.equal(rep.statusCode, 200);
            assert.deepEqual(rep.json(), {
                "data": {
                    "people": {
                        "id": ids[0],
                        "name": "tom",
                        "childs": [{
                                "id": ids[2],
                                "name": "jack"
                            },
                            {
                                "id": ids[3],
                                "name": "lily"
                            }
                        ]
                    }
                }
            });
        });
    });

    it("error", () => {
        http.post('http://127.0.0.1:8080/set_session', {
            json: {
                id: 12345
            }
        });

        var rep = http.post(`http://127.0.0.1:8080/1.0/app`, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                test_acl(id:"${ids[0]}"){
                    id,
                    name,
                    ext{
                        id,
                        name
                    }
                }
            }`
        });

        assert.equal(rep.statusCode, 404);
        assert.equal(rep.json().errors[0].code, 4040002);
        assert.equal(rep.json().errors[0].message, `Object '${ids[0]}' not found in class 'test_acl'.`);
    });

    it('acl field error', () => {
        http.post('http://127.0.0.1:8080/set_session', {
            json: {
                id: 123457,
                roles: ['test']
            }
        });

        var rep = http.post(`http://127.0.0.1:8080/1.0/app`, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                people(id:"${ids[2]}"){
                    name,
                    mother{
                        name
                    }
                }
            }`
        });

        assert.equal(rep.statusCode, 200);
        assert.deepEqual(rep.json(), {
            "data": {
                "people": {
                    "name": "jack",
                    "mother": {
                        "name": "alice"
                    }
                }
            }
        });
    });

    it('json data', () => {
        var rep = http.post('http://127.0.0.1:8080/1.0/app/json', {
            json: {
                name: 'tom',
                profile: {
                    a: 100,
                    b: 200
                }
            }
        });

        var id = rep.json().id;

        var rep = http.post(`http://127.0.0.1:8080/1.0/app`, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                json(id:"${id}"){
                    name,
                    profile,
                    createdAt
                }
            }`
        });

        let r = rep.json();
        assert.equal(r.data.json.createdAt.toString().slice(-1), "Z");
        assert.notEqual(new Date(r.data.json.createdAt).getTime() % 1000, 0);
        delete r.data.json.createdAt;
        assert.deepEqual(r, {
            "data": {
                "json": {
                    "name": "tom",
                    "profile": {
                        "a": 100,
                        "b": 200
                    }
                }
            }
        });
    });
});