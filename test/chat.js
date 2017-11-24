const test = require('test');
test.setup();

const http = require('http');
const ws = require('ws');
const coroutine = require('coroutine');
const util = require('util');

function clen_result(res) {
    if (util.isObject(res)) {
        if (Array.isArray(res))
            res.forEach(r => clen_result(r));
        else {
            delete res.createdAt;
            delete res.updatedAt;
            for (var k in res)
                clen_result(res[k]);
        }
    }
}

function check_result(res, data) {
    clen_result(res);
    assert.deepEqual(res, data);
}

describe("chat", () => {
    var cid;
    var uid;

    before(() => {
        var rep = http.post('http://127.0.0.1:8080/1.0/app/user', {
            json: {
                name: 'lion'
            }
        });

        uid = rep.json().id;

        http.post('http://127.0.0.1:8080/set_session', {
            json: {
                id: uid
            }
        });
    });

    it('create room', () => {
        var rep = http.post('http://127.0.0.1:8080/1.0/app/chatroom', {
            json: {
                name: 'room1'
            }
        });

        cid = rep.json().id;
    });

    it('post message', () => {
        var rep = http.post(`http://127.0.0.1:8080/1.0/app/chatroom/${cid}/messages`, {
            json: {
                msg: 'hellow, world.'
            }
        });
        var mid = rep.json().id;

        rep = http.get(`http://127.0.0.1:8080/1.0/app/chatroom/${cid}/messages`);
        check_result(rep.json(), [{
            "msg": "hellow, world.",
            "id": mid,
            "createdby_id": uid,
            "room_id": cid
        }]);
    });

    it('push', () => {
        var conn = new ws.Socket('ws://127.0.0.1:8080/push');
        conn.onopen = () => {
            conn.send(JSON.stringify({
                act: "on",
                ch: `channel_${cid}`,
                timestamp: 0
            }));
        }

        var r = [];

        conn.onmessage = m => {
            r.push(m.json());
        };

        coroutine.sleep(100);

        var rep = http.post(`http://127.0.0.1:8080/1.0/app/chatroom/${cid}/messages`, {
            json: {
                msg: 'hellow, world. again'
            }
        });

        coroutine.sleep(100);

        conn.send(JSON.stringify({
            act: "off",
            ch: `channel_${cid}`
        }));


        assert.equal(r.length, 2);

        assert.property(r[0], "timestamp");
        assert.notProperty(r[0], "data");

        assert.property(r[1], "timestamp");
        assert.equal(r[1].data.msg, "hellow, world. again");
    });


    /*
         0: 1370ms
        10: 1730ms
       100: 4200ms
       200: 4200ms
      1000: 10800ms
    */
    it('performance', () => {
        var conns = [];

        for (var i = 0; i < 200; i++) {
            var conn = new ws.Socket('ws://127.0.0.1:8080/push');
            conn.onopen = function () {
                this.send(JSON.stringify({
                    act: "on",
                    ch: `channel_${cid}`,
                    timestamp: 0
                }));
            }

            conns.push(conn);
        }

        coroutine.sleep(1000);

        console.time('chat performance');
        coroutine.parallel(() => {
            for (var i = 0; i < 100; i++) {
                http.post(`http://127.0.0.1:8080/1.0/app/chatroom/${cid}/messages`, {
                    json: {
                        msg: 'hellow, world. ' + i
                    }
                });
            }
        }, 10);
        console.timeEnd('chat performance');

        conns.forEach(conn => conn.close());
    });
});