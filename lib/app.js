const classes = require('./classes');
const Db = require('./db');

module.exports = (url, opts) => {
    var defs = [];
    const db = Db(url, opts);

    return {
        db: db,
        handler: {
            '/classes': classes(db)
        }
    };
};