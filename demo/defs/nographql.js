module.exports = db => {
    db.define('nographql', {
        foo: 'text',
        bin: {
            type: 'binary'
        }
    }, {
        no_graphql: true
    });
};
