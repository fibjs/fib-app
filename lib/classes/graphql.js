const graphql = require('fib-graphql');
const GraphQLJSON = require('graphql-type-json');
const GraphQLDATE = require('graphql-iso-date');
const convert_where = require('../utils/convert_where');
const {
    check_acl,
    check_obj_acl
} = require('../utils/check_acl');
const {
    filter
} = require('../utils/filter');

const TypeMap = {
    "serial": graphql.GraphQLInt,
    "number": graphql.GraphQLFloat,
    "integer": graphql.GraphQLInt,
    "boolean": graphql.GraphQLBoolean,
    "text": graphql.GraphQLString,
    "date": GraphQLDATE.GraphQLDateTime,
    "enum": graphql.GraphQLString,
    "object": GraphQLJSON
};

const hasManyArgs = {
    where: {
        type: GraphQLJSON
    },
    skip: {
        type: graphql.GraphQLInt
    },
    limit: {
        type: graphql.GraphQLInt
    },
    order: {
        type: graphql.GraphQLString
    }
};

module.exports = (app, db) => {
    var types = {};

    function get_resolve(m) {
        return function (parent, args, req) {
            var res = app.api.get({
                session: req.session,
                query: {}
            }, db, m, args.id);

            if (res.error)
                throw res.error;

            return res.success;
        };
    }

    function find_resolve(m) {
        return function (parent, args, req) {
            var res = app.api.find({
                session: req.session,
                query: args
            }, db, m);

            if (res.error)
                throw res.error;

            return res.success;
        };
    }

    function get_resolve_one(m, f) {
        return function (parent, args, req) {
            var res = app.api.eget({
                session: req.session,
                query: {}
            }, db, m, parent, f);

            if (res.error)
                throw res.error;

            return res.success;
        };
    }

    function get_resolve_many(m, f) {
        return function (parent, args, req) {
            var res = app.api.efind({
                session: req.session,
                query: args
            }, db, m, parent, f);

            if (res.error)
                throw res.error;

            return res.success;
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

            var _extends = m.extends;
            for (var f in _extends) {
                rel_model = _extends[f];
                if (rel_model.type === 'hasOne' && !rel_model.reversed)
                    fields[f] = {
                        type: types[rel_model.model.model_name].type,
                        resolve: get_resolve_one(m, f)
                    };
                else
                    fields[f] = {
                        type: new graphql.GraphQLList(types[rel_model.model.model_name].type),
                        args: hasManyArgs,
                        resolve: get_resolve_many(m, f)
                    };
            }

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

        types['find_' + k] = {
            type: new graphql.GraphQLList(types[k].type),
            args: hasManyArgs,
            resolve: find_resolve(m)
        };
    }

    var Schema = new graphql.GraphQLSchema({
        query: new graphql.GraphQLObjectType({
            name: 'Query',
            fields: types
        })
    });

    db.graphql = (query, req) => {
        return graphql.graphqlSync(Schema, query, {}, req);
    };

    return db;
};