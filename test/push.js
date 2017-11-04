const test = require('test');
test.setup();

const push = require('../lib/push');

push.config({
    idle_limit: 10,
    msg_limit: 10
});

describe("push", () => {
    it("on/off", () => {
        var ws = {
            value: 1024
        };

        var ws1 = {
            value: 1025
        };

        var ws2 = {
            value: 1025
        };

        push.on("aaa", ws);
        assert.deepEqual(push.status().aaa, [ws]);

        push.on("aaa", ws1);
        assert.deepEqual(push.status().aaa, [ws, ws1]);

        push.on("aaa", ws2);
        assert.deepEqual(push.status().aaa, [ws, ws1, ws2]);

        push.off("aaa", ws1);
        assert.deepEqual(push.status().aaa, [ws, ws2]);

        push.off("aaa", ws2);
        assert.deepEqual(push.status().aaa, [ws]);

        ws.onclose();
        assert.deepEqual(push.status().aaa, []);
    });

    it("post", () => {
        var r = [];
        var ws = {
            send: m => r.push(m)
        };

        push.on("aaa", ws);
        push.post("aaa", {
            a: 100,
            b: 200
        });

        assert.deepEqual(JSON.parse(r[0]).data, {
            a: 100,
            b: 200
        });

        push.post("aaa", {
            a: 200
        });

        assert.deepEqual(JSON.parse(r[1]).data, {
            a: 200
        });
    });

    it("not post empty channel", () => {
        push.post("aaa1", {
            a: 100,
            b: 200
        });

        var r = [];
        var ws = {
            send: m => r.push(m)
        };

        push.on("aaa1", ws, 0);
        assert.equal(r.length, 1);
        assert.strictEqual(JSON.parse(r[0]).data, undefined);
        assert.property(JSON.parse(r[0]), "timestamp");
    });

    it("post limit", () => {
        var ws = {
            send: m => {}
        };

        push.on("aaa2", ws, 0);
        for (var i = 0; i < 100; i++)
            push.post("aaa2", {
                a: i
            });

        var r = [];
        var ws1 = {
            send: m => r.push(m)
        };

        push.on("aaa2", ws1, 0);

        assert.equal(r.length, 11);
        assert.strictEqual(JSON.parse(r[0]).data, undefined);
        assert.property(JSON.parse(r[0]), "timestamp");

        for (var i = 1; i < 11; i++)
            assert.strictEqual(JSON.parse(r[i]).data.a, i + 89);
    });

    it("idle limit", () => {
        var ws = {
            send: m => {}
        };

        var chs = Object.keys(push.status());
        for (var i = 0; i < 100; i++)
            push.on(`idle_${i}`, ws);
        ws.onclose();
        var chs1 = Object.keys(push.status());

        assert.deepEqual(chs1.slice(chs.length), [
            "idle_90",
            "idle_91",
            "idle_92",
            "idle_93",
            "idle_94",
            "idle_95",
            "idle_96",
            "idle_97",
            "idle_98",
            "idle_99"
        ]);
    });
});