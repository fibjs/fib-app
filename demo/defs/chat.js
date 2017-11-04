const orm = require('fib-orm');
const push = require('../../').push;

module.exports = db => {
    var chatroom = db.define('chatroom', {
        name: String
    });

    var chatmessage = db.define('chatmessage', {
        name: String
    }, {
        hooks: {
            afterCreate: function () {
                if (this.room_id)
                    push.post(`channel_${this.room_id}`, this);
            },
            afterSave: function () {
                if (this.room_id)
                    push.post(`channel_${this.room_id}`, this);
            }
        }
    });

    chatmessage.hasOne("room", chatroom, {
        reverse: 'messages'
    });
};