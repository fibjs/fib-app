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
        },
        point: {
            type: 'point'
        },
        longInSafeNumber: {
            type: 'integer',
            big: true, // this field not supported by mysql
            size: 8,
        },
        // TODO: support value greater than Number.MAX_SAFE_INTEGER such as 1111222233334444555566
    });
};