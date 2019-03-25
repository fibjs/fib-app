module.exports = [
    require('./user'),
    require('./person'),
    require('./acl'),
    require('./city'),
    require('./people'),
    require('./extend'),
    require('./extend-multiple-level'),
    require('./pet'),
    require('./chat'),
    require('./fields_type'),
    require('./json'),
    require('./nographql'),
    require('./hooks'),
    (db) => {
        db.settings.set('rest.model.disable_access_composite_table', true)
    }
];
