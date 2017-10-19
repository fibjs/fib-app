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
});