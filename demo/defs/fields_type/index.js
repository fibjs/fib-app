module.exports = db => {
    db.define('test_fields_type', {
        name1: String,
        name2: {
            type: 'text'
        },
        profile: Object,
        binary1: Buffer,
        binary2: {
            type: 'binary'
        }
    });
};