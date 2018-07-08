import FibOrmNS from 'orm'
import App from "../app";
import { FibAppDb, FibModelExtendORMFuncName, FibAppApiCommnPayload_hasManyArgs, FibAppReq, FibAppReqQuery, FibAppHttpRequest, GraphQLString } from "../../@types/app";

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

const hasManyArgs: FibAppApiCommnPayload_hasManyArgs = {
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

export default (app: App, db: FibAppDb) => {
    var types = {};

    function get_resolve(m: FibOrmNS.FibOrmFixedModel) {
        return function (parent, args, req) {
            var res = app.api.get({
                session: req.session,
                query: {} as FibAppReqQuery
            }, db, m, args.id);

            if (res.error) {
                req.error = res.error;
                throw res.error;
            }

            return res.success;
        };
    }

    function find_resolve(m: FibOrmNS.FibOrmFixedModel) {
        return function (parent, args, req) {
            var res = app.api.find({
                session: req.session,
                query: args
            }, db, m);

            if (res.error) {
                req.error = res.error;
                throw res.error;
            }

            return res.success;
        };
    }

    function count_resolve (m: FibOrmNS.FibOrmFixedModel) {
        return function (parent, args, req) {
            args.count = 1
            args.limit = 0
            var res = app.api.find({
                session: req.session,
                query: args
            }, db, m);

            if (res.error) {
                req.error = res.error;
                throw res.error;
            }

            return res.success.count;
        };
    }

    function get_resolve_one(m: FibOrmNS.FibOrmFixedModel, f: FibModelExtendORMFuncName) {
        return function (parent: AppIdType, args: FibAppReqQuery, req: FibAppReq) {
            var res = app.api.eget({
                session: req.session,
                query: {} as FibAppReqQuery
            }, db, m, parent, f);

            if (res.error) {
                if(res.error.code === 4040002)
                    return null;

                req.error = res.error;
                throw res.error;
            }

            return res.success;
        };
    }

    function get_resolve_many(m: FibOrmNS.FibOrmFixedModel, f: FibModelExtendORMFuncName) {
        return function (parent: AppIdType, args: FibAppReqQuery, req: FibAppReq) {
            var res = app.api.efind({
                session: req.session,
                query: args
            }, db, m, parent, f);

            if (res.error) {
                req.error = res.error;
                throw res.error;
            }

            return res.success;
        };
    }

    function get_fields(m: FibOrmNS.FibOrmFixedModel) {
        return function () {
            var fields = {}

            var properties = m.properties;
            for (var f in properties)
                fields[f] = {
                    type: TypeMap[properties[f].type]
                };

            var _extends = m.extends;
            for (var f in _extends) {
                var rel_model: FibOrmNS.ExtendModelWrapper = _extends[f];
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

        if (m.no_graphql) {
            continue ;
        }

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

        types['count_' + k] = {
            type: graphql.GraphQLInt,
            args: hasManyArgs,
            resolve: count_resolve(m)
        };
    }

    var Schema = new graphql.GraphQLSchema({
        query: new graphql.GraphQLObjectType({
            name: 'Query',
            fields: types
        })
    });

    db.graphql = (query: GraphQLString, req: FibAppHttpRequest) => {
        var res = graphql.graphqlSync(Schema, query, {}, req);

        if (req.error) {
            var code = req.error.code;
            delete req.error;

            req.response.statusCode = code / 10000;
            res.errors[0].code = code;
        }

        return res;
    };

    return db;
};
