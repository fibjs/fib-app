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

describe("reverse", () => {
    describe("1:n", () => {
        var msg_id;
        var room_id;
        var user_id;

        before(() => {
            var rep = http.post('http://127.0.0.1:8080/1.0/app/chatroom', {
                json: {
                    name: "room1"
                }
            });

            room_id = rep.json().id;

            var rep = http.post('http://127.0.0.1:8080/1.0/app/user', {
                json: {
                    name: 'lion',
                    sex: "male",
                    age: 16,
                    password: '123456'
                }
            });

            user_id = rep.json().id;

            http.post('http://127.0.0.1:8080/set_session', {
                json: {
                    id: user_id
                }
            });
        });

        it("create message", () => {
            var rep = http.post(`http://127.0.0.1:8080/1.0/app/chatroom/${room_id}/messages`, {
                json: {
                    msg: "hello"
                }
            });

            msg_id = rep.json().id;
        });

        it("get", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/app/chatroom/${room_id}/messages/${msg_id}`);
            check_result(rep.json(), {
                id: msg_id,
                msg: "hello",
                createby_id: user_id,
                room_id: room_id
            });
        });

        it("get reserve", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/app/chatmessage/${msg_id}/room/${room_id}`);
            check_result(rep.json(), {
                id: room_id,
                name: "room1"
            });
        });

        it("list", () => {
            var rep = http.get(`http://127.0.0.1:8080/1.0/app/chatroom/${room_id}/messages`);
            check_result(rep.json(), [{
                id: msg_id,
                msg: "hello",
                createby_id: user_id,
                room_id: room_id
            }]);
        });

        it("update", () => {
            var rep = http.put(`http://127.0.0.1:8080/1.0/app/chatroom/${room_id}/messages/${msg_id}`, {
                json: {
                    msg: 'hello 2'
                }
            });
            assert.equal(rep.statusCode, 200);

            var rep = http.get(`http://127.0.0.1:8080/1.0/app/chatroom/${room_id}/messages/${msg_id}`);
            check_result(rep.json(), {
                id: msg_id,
                msg: "hello 2",
                createby_id: user_id,
                room_id: room_id
            });
        });

        xit("delete", () => {
            var rep = http.del(`http://127.0.0.1:8080/1.0/app/chatroom/${room_id}/messages/${msg_id}`);
            assert.equal(rep.statusCode, 200);

            var rep = http.get(`http://127.0.0.1:8080/1.0/app/chatroom/${room_id}/messages/${msg_id}`);
            check_result(rep.json(), {
                id: msg_id,
                msg: "hello 2",
                createby_id: user_id,
                room_id: room_id
            });
        });

        it("link reserve", () => {
            var rep = http.post(`http://127.0.0.1:8080/1.0/app/chatmessage`, {
                json: {
                    msg: "hello 1"
                }
            });

            var msg_id = rep.json().id;

            var rep = http.put(`http://127.0.0.1:8080/1.0/app/chatmessage/${msg_id}/room`, {
                json: {
                    id: room_id
                }
            });
            assert.equal(rep.statusCode, 200);

            var rep = http.get(`http://127.0.0.1:8080/1.0/app/chatroom/${room_id}/messages/${msg_id}`);
            check_result(rep.json(), {
                id: msg_id,
                msg: "hello 1",
                createby_id: user_id,
                room_id: room_id
            });
        });
    });

    describe("m:n", () => {
        var room1_id;
        var room2_id;
        var user1_id;
        var user2_id;

        before(() => {
            var rep = http.post('http://127.0.0.1:8080/1.0/app/chatroom', {
                json: [{
                    name: "room1"
                }, {
                    name: "room2"
                }]
            });

            var data = rep.json();
            room1_id = data[0].id;
            room2_id = data[1].id;

            var rep = http.post('http://127.0.0.1:8080/1.0/app/user', {
                json: [{
                    name: 'lion 1',
                    sex: "male",
                    age: 16,
                    password: '123456'
                }, {
                    name: 'lion 2',
                    sex: "male",
                    age: 16,
                    password: '123456'
                }]
            });

            var data = rep.json();
            user1_id = data[0].id;
            user2_id = data[1].id;
        });

        it("put relations", () => {
            var rep = http.put(`http://127.0.0.1:8080/1.0/app/chatroom/${room1_id}/mambers`, {
                json: {
                    id: user1_id
                }
            });
            assert.equal(rep.statusCode, 200);

            var rep = http.put(`http://127.0.0.1:8080/1.0/app/user/${user2_id}/rooms`, {
                json: {
                    id: room2_id
                }
            });
            assert.equal(rep.statusCode, 200);
        });

        it("del", () => {
            var rep = http.del(`http://127.0.0.1:8080/1.0/app/chatroom/${room1_id}/mambers/${user1_id}`);
            assert.equal(rep.statusCode, 200);

            var rep = http.del(`http://127.0.0.1:8080/1.0/app/user/${user2_id}/rooms/${room2_id}`);
            assert.equal(rep.statusCode, 200);
        });

        it("create", () => {
            var rep = http.post(`http://127.0.0.1:8080/1.0/app/chatroom/${room1_id}/mambers`, {
                json: {
                    name: 'lion 3',
                    sex: "male",
                    age: 16,
                    password: '123456'
                }
            });
            assert.equal(rep.statusCode, 201);

            var rep = http.post(`http://127.0.0.1:8080/1.0/app/user/${user2_id}/rooms`, {
                json: {
                    name: "room3"
                }
            });
            assert.equal(rep.statusCode, 201);
        });
    });
});