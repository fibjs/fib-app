import util = require('util')

import App from "../app";
import { debugFunctionWrapper } from '../utils/debug';
import { check_hasmany_extend_extraprops } from '../utils/orm-assoc';
import graphql = require('../patch/graphql')

const GraphQLJSON = require('graphql-type-json');
const GraphQLDATE = require('graphql-iso-date');

const TypeMap = {
    "serial": graphql.GraphQLInt,
    "number": graphql.GraphQLFloat,
    "integer": graphql.GraphQLInt,
    "boolean": graphql.GraphQLBoolean,
    "text": graphql.GraphQLString,
    "date": GraphQLDATE.GraphQLDateTime,
    "enum": graphql.GraphQLString,
    "object": GraphQLJSON,
    "binary": graphql.GraphQLString
};

const hasManyArgs: FibApp.FibAppApiCommnPayload_hasManyArgs = {
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

export = function (app: App, db: FibApp.FibAppDb) {
    var types = {};
    var graphqlTypeMap: FibApp.FibAppGraphQLTypeMap = app.__opts.graphqlTypeMap = util.extend(TypeMap, app.__opts.graphqlTypeMap)

    function get_resolve(m: FxOrmNS.Model) {
        return (
            function (parent, args, req) {
                var res = debugFunctionWrapper(app.api.get)({
                    session: req.session,
                    query: {} as FibApp.FibAppReqQuery
                }, db, m, args.id);

                if (res.error) {
                    req.error = res.error;
                    throw res.error;
                }

                return res.success;
            }
        );
    }

    function find_resolve(m: FxOrmNS.Model, count_mode: 'count_only' | 'find_only' | 'paging' = 'find_only') {
        return (
            function (parent, args, req) {
                let selector = null

                switch (count_mode) {
                    default:
                    case 'find_only':
                        args.count = 0
                        break
                    case 'count_only':
                        args.count = 1
                        args.limit = 0
                        selector = success => success.count
                        break
                    case 'paging':
                        args.count = 1
                        break
                }
                
                var res = debugFunctionWrapper(app.api.find)({
                    session: req.session,
                    query: args
                }, db, m);

                if (res.error) {
                    req.error = res.error;
                    throw res.error;
                }

                return selector ? selector(res.success) : res.success;
            }
        );
    }

    function paging_resolve (m: FxOrmNS.Model) {
        return {
            results: {
                type: new graphql.GraphQLList(types[m.model_name].type),
            },
            count: {
                type: graphql.GraphQLInt
            }
        }
    }

    function get_resolve_one(m: FxOrmNS.Model, f: FibApp.FibAppModelExtendORMFuncName) {
        return (
            function (parent: FibApp.ObjectWithIdField, args: FibApp.FibAppReqQuery, req: FibApp.FibAppReq) {
                var res = debugFunctionWrapper(app.api.eget)({
                    session: req.session,
                    query: {} as FibApp.FibAppReqQuery
                }, db, m, parent, f);

                if (res.error) {
                    if(res.error.code === 4040002)
                        return null;

                    req.error = res.error;
                    throw res.error;
                }

                return res.success;
            }
        );
    }

    function get_resolve_many(m: FxOrmNS.Model, f: FibApp.FibAppModelExtendORMFuncName) {
        return (
            function (parent: FibApp.ObjectWithIdField, args: FibApp.FibAppReqQuery, req: FibApp.FibAppReq) {
                var res = debugFunctionWrapper(app.api.efind)({
                    session: req.session,
                    query: args
                }, db, m, parent, f);

                if (res.error) {
                    req.error = res.error;
                    throw res.error;
                }

                return res.success;
            }
        );
    }

    function get_resolve_extra_in_many (m: FxOrmNS.Model, f: FibApp.FibAppModelExtendORMFuncName) {
        return (
            function (parent: FibApp.ObjectWithIdField, args: FibApp.FibAppReqQuery, req: FibApp.FibAppReq) {
                return parent.extra
            }
        )
    }

    function get_fields_hasmanyextra_alone(m: FxOrmNS.Model, extend: string, many_association: FxOrmNS.InstanceAssociationItem_HasMany, getter: Function) {
        var basic_fields = getter();

        return (
            function () {
                var extra_fields = {};
                for (var extraf in many_association.props) {
                    var orig_type = many_association.props[extraf].type
                    
                    if (!graphqlTypeMap[orig_type]) {
                        throw `valid type required for model ${m.model_name}'s extended extra field ${extraf}`
                    }

                    extra_fields[extraf] = {
                        type: graphqlTypeMap[orig_type]
                    };
                }

                basic_fields['extra'] = {
                    type: new graphql.GraphQLObjectType({
                        name: `${m.model_name}_${extend}_aloneextra`,
                        fields: extra_fields
                    }),
                    resolve: get_resolve_extra_in_many(m, extend)
                }

                return basic_fields;
            }
        )
    }

    function get_fields_hasmanyextra_mixins(m: FxOrmNS.Model, many_association: FxOrmNS.InstanceAssociationItem_HasMany, getter: Function) {
        var basic_fields = getter();

        return (
            function () {
                for (var extraf in many_association.props) {
                    var orig_type = many_association.props[extraf].type
                    
                    if (!graphqlTypeMap[orig_type]) {
                        throw `valid type required for model ${m.model_name}'s extended extra field ${extraf}`
                    }

                    basic_fields[extraf] = {
                        type: graphqlTypeMap[orig_type]
                    };
                }

                return basic_fields;
            }
        )
    }

    function get_fields(m: FxOrmNS.Model, no_extra_fields: boolean = false) {
        return (
            function () {
                var fields = {}

                var properties = m.properties;
                for (var p in properties) {
                    var type = graphqlTypeMap[properties[p].type]

                    if (!type) {
                        throw `valid type required for model ${m.model_name}'s field ${p}`
                    }

                    fields[p] = {
                        type: type
                    };
                }
                var _extends = m.extends;

                for (var f in _extends) {
                    var rel_model: FxOrmNS.ExtendModelWrapper = _extends[f];
                    if (!rel_model.model) {
                        throw `association ${f} defined for model ${m.model_name} but no valid related model, detailed information: \n ${JSON.stringify(rel_model, null, '\t')}`
                    }

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

                    if (no_extra_fields)
                        continue 

                    var has_many_association = check_hasmany_extend_extraprops((new m()), f)
                    if (has_many_association) {
                        fields[`${f}`] = {
                            type: new graphql.GraphQLList(
                                new graphql.GraphQLObjectType({
                                    name: `${m.model_name}__${f}__aloneExtraWrapper`,
                                    fields: get_fields_hasmanyextra_alone(m, f, has_many_association, get_fields(rel_model.model, true)),
                                })
                            ),
                            args: hasManyArgs,
                            resolve: get_resolve_many(m, f)
                        }

                        fields[`${f}__extra`] = {
                            type: new graphql.GraphQLList(
                                new graphql.GraphQLObjectType({
                                    name: `${m.model_name}__${f}__mixinExtraWrapper`,
                                    fields: get_fields_hasmanyextra_mixins(m, has_many_association, get_fields(rel_model.model, true)),
                                })
                            ),
                            args: hasManyArgs,
                            resolve: get_resolve_many(m, f)
                        }
                    }
                }

                return fields;
            }
        );
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

        types[`find_${k}`] = {
            type: new graphql.GraphQLList(types[k].type),
            args: hasManyArgs,
            resolve: find_resolve(m, 'find_only')
        };

        types[`count_${k}`] = {
            type: graphql.GraphQLInt,
            args: hasManyArgs,
            resolve: find_resolve(m, 'count_only')
        };

        types[`paging_${k}`] = {
            type: new graphql.GraphQLObjectType({
                name: `paging_${k}`,
                fields: paging_resolve(m)
            }),
            args: hasManyArgs,
            resolve: find_resolve(m, 'paging')
        };
    }

    var Schema = new graphql.GraphQLSchema({
        query: new graphql.GraphQLObjectType({
            name: 'Query',
            fields: types
        })
    });

    db.graphql = (query: FibApp.GraphQLQueryString, req: FibApp.FibAppHttpRequest) => {
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