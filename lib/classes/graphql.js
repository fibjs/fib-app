const graphql = require('fib-graphql');
const GraphQLJSON = require('graphql-type-json');
const convert_where = require('../utils/convert_where');
const {
    check_acl,
    check_obj_acl
} = require('../utils/check_acl');
const filter = require('../utils/filter');

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

module.exports = db => {
    var types = {};

    function get_resolve(m) {
        return function (parent, args, req) {
            var obj = m.getSync(args.id);

            var a = check_obj_acl(req.session, "read", obj);
            if (!a)
                return null;

            if (Array.isArray(a))
                obj = filter(obj, a);

            return obj;
        };
    }

    function get_resolve_one(m, f) {
        return function (parent, args, req) {
            var _association = parent.__opts.one_associations.find(a => a.name === f);
            var rid = parent[Object.keys(_association.field)[0]];
            var obj = m.getSync(rid);

            var a = check_obj_acl(req.session, "+read", obj);
            if (!a)
                return null;

            if (Array.isArray(a))
                obj = filter(obj, a);

            return obj;
        };
    }

    function get_resolve_many(m, f) {
        return function (parent, args, req) {
            var _association = parent.__opts.many_associations.find(a => a.name === f);
            if (!check_acl(req.session, "+find", m.ACL))
                return null;

            var exec = parent[_association.getAccessor].call(parent)

            var where;
            if (args.where)
                exec.where(convert_where(args.where));

            if (args.skip)
                exec.offset(args.skip);

            if (!args.limit || args.limit <= 0 || args.limit > 1000)
                args.limit = 100;
            exec.limit(args.limit);

            if (args.order)
                exec.order(args.order);

            var objs = exec.allSync();
            objs = objs.map(obj => {
                var a = check_obj_acl(req.session, "+read", obj);
                if (!a)
                    return null;

                if (Array.isArray(a))
                    obj = filter(obj, a);

                return obj;
            });

            return objs;
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
                if (rel_model.type === 'hasOne')
                    fields[f] = {
                        type: types[rel_model.model.model_name].type,
                        resolve: get_resolve_one(rel_model.model, f)
                    };
                else if (rel_model.type === 'hasMany')
                    fields[f] = {
                        type: new graphql.GraphQLList(types[rel_model.model.model_name].type),
                        args: hasManyArgs,
                        resolve: get_resolve_many(rel_model.model, f)
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