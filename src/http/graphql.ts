import util = require('util')

import { debugFunctionWrapper } from '../utils/debug';
import { check_hasmanyassoc_with_extraprops } from '../utils/orm-assoc';

const graphql = require('fib-graphql');
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
    join_where: {
        type: GraphQLJSON
    },
    findby: {
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

export = function (app: FibApp.FibAppClass, ormInstance: FibApp.FibAppORM) {
    var types = {};
    var graphqlTypeMap: FibApp.FibAppGraphQLTypeMap = app.__opts.graphqlTypeMap = util.extend(TypeMap, app.__opts.graphqlTypeMap)

    function get_resolve(m: FibApp.FibAppORMModel) {
        return (
            function (parent, args, req) {
                var res = debugFunctionWrapper(app.api.get)({
                    session: req.session,
                    query: {} as FibApp.FibAppReqQuery
                }, ormInstance, m, args.id);

                if (res.error) {
                    req.error = res.error;
                    throw res.error;
                }

                return res.success;
            }
        );
    }

    function find_resolve(m: FibApp.FibAppORMModel, count_mode: 'count_only' | 'find_only' | 'paging' = 'find_only') {
        return (
            function (parent, args, req) {
                let selector = null

                switch (count_mode) {
                    default:
                    case 'find_only':
                        args.count_required = false
                        break
                    case 'count_only':
                        args.count_required = true
                        args.limit = 0
                        selector = (success: FibApp.FibAppIneternalApiFindResult) => success.count
                        break
                    case 'paging':
                        args.count_required = true
                        break
                }
                
                var res = debugFunctionWrapper(app.api.find)({
                    session: req.session,
                    query: args
                }, ormInstance, m);

                if (res.error) {
                    req.error = res.error;
                    throw res.error;
                }

                return selector ? selector(res.success) : res.success;
            }
        );
    }

    function eget_resolve(m: FibApp.FibAppORMModel, f: FibApp.FibAppModelExtendORMFuncName) {
        return (
            function (parent: FibApp.ObjectWithIdField, args: FibApp.FibAppReqQuery, req: FibApp.FibAppReq) {
                var res = debugFunctionWrapper(app.api.eget)({
                    session: req.session,
                    query: {} as FibApp.FibAppReqQuery
                }, ormInstance, m, parent, f);

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

    function efind_many_resolve(m: FibApp.FibAppORMModel, f: FibApp.FibAppModelExtendORMFuncName, mode: 'paging' | '' = '') {
        const is_paging_mode = mode === 'paging'
        return (
            function (parent: FibApp.ObjectWithIdField, args: FibApp.FibAppReqQuery, req: FibApp.FibAppReq) {
                if (is_paging_mode) {
                    args.count = 1
                    args.count_required = true
                } else {
                    args.count = 0
                    args.count_required = false
                }

                var res = debugFunctionWrapper(app.api.efind)({
                    session: req.session,
                    query: args
                }, ormInstance, m, parent, f);

                if (res.error) {
                    req.error = res.error;
                    throw res.error;
                }

                return res.success;
            }
        );
    }

    function paging_fields (list_item_type: any) {
        return {
            results: {
                type: list_item_type,
            },
            count: {
                type: graphql.GraphQLInt
            }
        }
    }

    function get_fields_hasmanyextra_alone(m: FibApp.FibAppORMModel, extend: string, many_association: FxOrmNS.InstanceAssociationItem_HasMany, getter: Function) {
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
                    resolve: function (parent: FibApp.ObjectWithIdField, args: FibApp.FibAppReqQuery, req: FibApp.FibAppReq) {
                        return parent.extra
                    }
                }

                return basic_fields;
            }
        )
    }

    function get_fields_hasmanyextra_mixins(m: FibApp.FibAppORMModel, many_association: FxOrmNS.InstanceAssociationItem_HasMany, getter: Function) {
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

    var extend_paging_types = {}
    function get_fields(m: FibApp.FibAppORMModel, no_extra_fields: boolean = false) {
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
                var _associations = m.associations;

                for (var f in _associations) {
                    var rel_assoc_info = _associations[f];
                    if (rel_assoc_info.type !== 'extendsTo' && !rel_assoc_info.association.model) {
                        throw `association ${f} defined for model ${m.model_name} but no valid related model, detailed information: \n ${JSON.stringify(rel_assoc_info, null, '\t')}`
                    }

                    const assoc_model = rel_assoc_info.association.model;

                    switch (rel_assoc_info.type) {
                        default:
                            break
                        case 'extendsTo':
                            fields[f] = {
                                type: types[assoc_model.model_name].type,
                                resolve: eget_resolve(m, f)
                            };
                            break
                        case 'hasOne':
                            if (!rel_assoc_info.association.reversed) {
                                fields[f] = {
                                    type: types[assoc_model.model_name].type,
                                    resolve: eget_resolve(m, f)
                                };
                                break
                            }
                        case 'hasMany': {
                            let type_has_many = new graphql.GraphQLList(types[assoc_model.model_name].type)
                            let type_has_many_mixin_extra = null

                            let has_many_association = null
                            
                            if (!no_extra_fields) {
                                has_many_association = check_hasmanyassoc_with_extraprops((new m()), f)
                                if (has_many_association) {
                                    // hasMany-assoc-style result: alone mode(recommendation)
                                    type_has_many = new graphql.GraphQLList(
                                        new graphql.GraphQLObjectType({
                                            name: `${m.model_name}__${f}__aloneExtraWrapper`,
                                            fields: get_fields_hasmanyextra_alone(m, f, has_many_association, get_fields(assoc_model as FibApp.FibAppORMModel, true)),
                                        })
                                    )

                                    // hasMany-assoc-style result: mixin mode
                                    type_has_many_mixin_extra = new graphql.GraphQLList(
                                        new graphql.GraphQLObjectType({
                                            name: `${m.model_name}__${f}__mixinExtraWrapper`,
                                            fields: get_fields_hasmanyextra_mixins(m, has_many_association, get_fields(assoc_model as FibApp.FibAppORMModel, true)),
                                        })
                                    )
                                }
                            }

                            fields[f] = {
                                type: type_has_many,
                                args: hasManyArgs,
                                resolve: efind_many_resolve(m, f)
                            };

                            var extend_paging_uname = get_extend_paging_unique_name(m, rel_assoc_info, f) 
                            fields[`paging_${f}`] = {
                                type: (
                                    /**
                                     * there maybe repeative call to `get_fields`, and the name of this type should always keep unique
                                     */
                                    extend_paging_types[extend_paging_uname] = extend_paging_types[extend_paging_uname] 
                                    || new graphql.GraphQLObjectType({
                                        name: extend_paging_uname,
                                        args: hasManyArgs,
                                        fields: paging_fields(fields[f].type)
                                    })
                                ),
                                args: hasManyArgs,
                                resolve: efind_many_resolve(m, f, 'paging')
                            };

                            if (type_has_many_mixin_extra) {
                                fields[`${f}__extra`] = {
                                    type: type_has_many_mixin_extra,
                                    args: hasManyArgs,
                                    resolve: efind_many_resolve(m, f)
                                }
                            }
                        }
                            break
                    }
                }

                return fields;
            }
        );
    }

    for (var k in ormInstance.models) {
        var m = ormInstance.models[k];

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
                fields: paging_fields(
                    new graphql.GraphQLList(types[m.model_name].type)
                )
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

    ormInstance.graphql = (query: FibApp.GraphQLQueryString, req: FibApp.FibAppHttpRequest) => {
        var res = graphql.graphqlSync(Schema, query, {}, req);

        if (req.error) {
            var code = req.error.code;
            delete req.error;

            req.response.statusCode = code / 10000;
            res.errors[0].code = code;
        }

        return res;
    };

    return ormInstance;
};

function get_extend_paging_unique_name (
    m: FibApp.FibAppORMModel,
    rel_assoc_info: FxOrmModel.Model['associations'][string],
    extend: string
) {
    if (rel_assoc_info.type === 'hasOne' && rel_assoc_info.association.reversed)
        return `extend_paging__reverse_${rel_assoc_info.association.model.model_name}_${rel_assoc_info.type}_${extend}_${m.model_name}`
    
    return `extend_paging__${m.model_name}_${rel_assoc_info.type}_${extend}_${rel_assoc_info.association.model.model_name}`
}