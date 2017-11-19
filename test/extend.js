const test = require('test');
test.setup();

const http = require('http');
const util = require('util');

function clen_result(res) {
    if (util.isObject(res)) {
        if (Array.isArray(res))
            res.forEach(r => clen_result(r));
        else {
            delete res.createAt;
            delete res.updateAt;
            for (var k in res)
                clen_result(res[k]);
        }
    }
}

function check_result(res, data) {
    clen_result(res);
    assert.deepEqual(res, data);
}

describe("extend", () => {
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
            }]
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

        var rep = http.get(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}`, {
            query: {
                keys: 'wife_id'
            }
        });
        check_result(rep.json(), {
            wife_id: ids[1]
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

    it('get extend', () => {
        var rep = http.get(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/wife`, {
            query: {
                keys: 'name,age'
            }
        });
        check_result(rep.json(), {
            "name": "alice",
            "age": 32
        });

        var rep = http.get(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/wife/${ids[1]}`, {
            query: {
                keys: 'name,age'
            }
        });
        check_result(rep.json(), {
            "name": "alice",
            "age": 32
        });

        var rep = http.get(`http://127.0.0.1:8080/1.0/app/people/${ids[2]}/mother`, {
            query: {
                keys: 'name,age'
            }
        });
        check_result(rep.json(), {
            "name": "alice",
            "age": 32
        });

        var rep = http.get(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/childs`, {
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

        var rep = http.get(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/childs/${ids[3]}`, {
            query: {
                keys: 'name,age',
                order: 'age'
            }
        });
        check_result(rep.json(), {
            "name": "lily",
            "age": 4
        });

        var rep = http.get(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/childs/${ids[1]}`, {
            query: {
                keys: 'name,age',
                order: 'age'
            }
        });
        check_result(rep.json(), {
            "code": 4040402,
            "message": `Object '${ids[1]}' not found in class 'people.childs'.`
        });
    });

    it('delete extend', () => {
        var rep = http.del(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/wife/${ids[1]}`);
        assert.equal(rep.statusCode, 200);

        var rep = http.get(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/wife`, {
            query: {
                keys: 'name,age'
            }
        });
        assert.equal(rep.statusCode, 404);

        var rep = http.del(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/childs/${ids[2]}`);
        assert.equal(rep.statusCode, 200);

        var rep = http.get(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/childs`, {
            query: {
                keys: 'name,age'
            }
        });
        check_result(rep.json(), [{
            "name": "lily",
            "age": 4
        }]);

        var rep = http.put(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/childs`, {
            json: {
                id: ids[2]
            }
        });
        assert.equal(rep.statusCode, 200)
    });

    it('create extend object', () => {
        var rep = http.post(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/childs`, {
            json: {
                name: 'jack_li',
                sex: "male",
                age: 8
            }
        });
        assert.equal(rep.statusCode, 201);
        ids.push(rep.json().id);

        var rep = http.get(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/childs/${ids[4]}`, {
            query: {
                keys: 'name,age'
            }
        });
        assert.equal(rep.statusCode, 200);
        check_result(rep.json(), {
            "name": "jack_li",
            "age": 8
        });

        var rep = http.post(`http://127.0.0.1:8080/1.0/app/people/${ids[4]}/childs`, {
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

        var rep = http.get(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/childs/${ids[4]}`, {
            query: {
                keys: 'name,age'
            }
        });
        assert.equal(rep.statusCode, 200);
        check_result(rep.json(), {
            "name": "jack_li",
            "age": 8
        });

        var rep = http.post(`http://127.0.0.1:8080/1.0/app/people/${ids[4]}/wife`, {
            json: {
                name: 'ly_li',
                sex: "famale",
                age: 8
            }
        });
        assert.equal(rep.statusCode, 201);

        var rep = http.get(`http://127.0.0.1:8080/1.0/app/people/${ids[4]}/wife`, {
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
        var rep = http.put(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/childs/${ids[4]}`, {
            json: {
                name: 'jack_li',
                sex: "male",
                age: 18
            }
        });
        assert.equal(rep.statusCode, 200);

        var rep = http.get(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/childs/${ids[4]}`, {
            query: {
                keys: 'name,age'
            }
        });
        assert.equal(rep.statusCode, 200);
        check_result(rep.json(), {
            "name": "jack_li",
            "age": 18
        });

        rep = http.del(`http://127.0.0.1:8080/1.0/app/people/${ids[0]}/childs/${ids[4]}`);
        assert.equal(rep.statusCode, 200);
    });

    it("multi level create", () => {
        var rep = http.post('http://127.0.0.1:8080/1.0/app/people', {
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
});