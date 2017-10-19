const test = require('test');
test.setup();

const http = require('http');

describe("graphql", () => {
    it('simple', () => {
        var rep = http.post(`http://127.0.0.1:8080/1.0/app`, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                people(id:1){
                    id,
                    name
                }
            }`
        });

        assert.equal(rep.statusCode, 200);
        assert.deepEqual(rep.json(), {
            "data": {
                "people": {
                    "id": "1",
                    "name": "tom"
                }
            }
        });
    });

    it('hasOne', () => {
        var rep = http.post(`http://127.0.0.1:8080/1.0/app`, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                people(id:3){
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
                    "id": "3",
                    "name": "jack",
                    "mother": {
                        "id": "2",
                        "name": "alice",
                        "husband": {
                            "id": "1",
                            "name": "tom"
                        }
                    }
                }
            }
        });
    });

    it('hasMany', () => {
        var rep = http.post(`http://127.0.0.1:8080/1.0/app`, {
            headers: {
                'Content-Type': 'application/graphql'
            },
            body: `{
                people(id:1){
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
                    "id": "1",
                    "name": "tom",
                    "childs": [{
                        "id": "4",
                        "name": "lily",
                        "mother": {
                            "id": "2",
                            "name": "alice"
                        }
                    }]
                }
            }
        });
    });
});