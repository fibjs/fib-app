const graphql = require('fib-graphql');

const TypeMap = {
    "serial": graphql.GraphQLID,
    "number": graphql.GraphQLFloat,
    "integer": graphql.GraphQLInt,
    "boolean": graphql.GraphQLBoolean,
    "text": graphql.GraphQLString,
    "date": graphql.GraphQLString,
    "enum": graphql.GraphQLString,
    "object": graphql.GraphQLString
};

module.exports = db => {
    var types = {};

    function get_resolve(m) {
        return function (parent, args) {
            return m.getSync(args.id);
        };
    }

    function get_fields(m) {
        return function () {
            var fields = {}

            var properties = m.properties;
            for (var f in properties)
                fields[f] = {
                    type: TypeMap[properties[f].type]
                };

            return fields;
        };
    }

    for (var k in db.models) {
        var m = db.models[k];

        types[k] = {
            type: new graphql.GraphQLObjectType({
                name: k,
                fields: get_fields(m)
            }),
            args: {
                id: {
                    type: new graphql.GraphQLNonNull(graphql.GraphQLID),
                }
            },
            resolve: get_resolve(m)
        };
    }

    var Schema = new graphql.GraphQLSchema({
        query: new graphql.GraphQLObjectType({
            name: 'Query',
            fields: types
        })
    });

    db.graphql = (query) => {
        return graphql.graphqlSync(Schema, query);
    };

    return db;
};