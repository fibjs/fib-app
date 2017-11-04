var ws = require('ws');
var Link = require('./utils/link');

var chs = {};
var idles = new Link();
var idle_limit = 100;
var msg_limit = 100;

function channel(name) {
    var conns = new Link();
    var msgs = new Link();
    var idle_node;
    var start_timestamp = new Date();

    this.name = name;
    this.on = (ws, timestamp) => {
        if (idle_node) {
            idles.remove(idle_node);
            idle_node = undefined;
        }

        var m = msgs.head();
        if (m != undefined) {
            if (m.data.timestamp > timestamp)
                ws.send(JSON.stringify({
                    "timestamp": m.data.timestamp
                }));

            while (m !== undefined && m.data.timestamp < timestamp)
                m = m.next;

            while (m !== undefined) {
                ws.send(m.data.data);
                m = m.next;
            }
        } else {
            if (start_timestamp > timestamp)
                ws.send(JSON.stringify({
                    "timestamp": start_timestamp
                }));
        }

        return conns.addTail(ws);
    };

    this.off = node => {
        if (conns.remove(node) === 0) {
            idle_node = idles.addTail(this);
            if (idles.count() > idle_limit) {
                var head = idles.head();
                delete chs[head.data.name];
                idles.remove(head);
            }
        }
    };

    function post(data) {
        if (Array.isArray(data))
            return data.forEach(d => post(d));

        var timestamp = new Date();
        var json = JSON.stringify({
            timestamp: timestamp,
            ch: name,
            data: data
        });

        msgs.addTail({
            timestamp: timestamp,
            data: json
        });

        if (msgs.count() > msg_limit)
            msgs.remove(msgs.head());

        var node = conns.head();
        while (node !== undefined) {
            node.data.send(json);
            node = node.next;
        }
    };

    this.post = post;

    this.status = () => {
        return conns.toJSON();
    }
}

exports.on = (ch, ws, timestamp) => {
    if (Array.isArray(ch))
        return ch.forEach(c => exports.on(c, ws, timestamp));

    var ons = ws._ons;
    if (ons === undefined) {
        ws._ons = ons = {};
        ws.onclose = ev => {
            for (var ch in ons)
                exports.off(ch, ws);
        }
    }

    var cho = chs[ch];
    if (cho === undefined)
        chs[ch] = cho = new channel(ch);
    ons[ch] = cho.on(ws, timestamp);
};

exports.off = (ch, ws) => {
    if (Array.isArray(ch))
        return ch.forEach(c => exports.off(c, ws));

    var ons = ws._ons;
    if (ons !== undefined && ons[ch] !== undefined) {
        chs[ch].off(ons[ch]);
        delete ons[ch];
    }
};

exports.post = (ch, data) => {
    var cho = chs[ch];
    if (cho !== undefined)
        cho.post(data);
};

exports.status = () => {
    var r = {};
    for (ch in chs)
        r[ch] = chs[ch].status();
    return r;
};

exports.config = opts => {
    idle_limit = opts.idle_limit || idle_limit;
    msg_limit = opts.msg_limit || msg_limit;
}