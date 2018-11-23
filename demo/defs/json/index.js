module.exports = db => {
    db.define('json', {
        name: String,
        profile: Object
    });
};