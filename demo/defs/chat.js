const orm = require('fib-orm');
const push = require('../../').push;

module.exports = db => {
    var user = db.models.user;
    var chatroom = db.define('chatroom', {
        name: String
    });

    var chatmessage = db.define('chatmessage', {
        msg: String
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

    chatmessage.hasOne('createBy', user);

    // 1:n 双向
    chatmessage.hasOne("room", chatroom, {
        reverse: 'messages'
    });

    // m:n 双向
    chatroom.hasMany('mambers', user, {}, {
        reverse: 'rooms'
    })
};