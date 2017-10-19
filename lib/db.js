const Pool = require('fib-pool');
const orm = require('fib-orm');
const util = require('util');
const graphql = require('fib-graphql');

var slice = Array.prototype.slice;

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

module.exports = (url, opts) => {
    var defs = [];
    opts = opts || {};

    var db = Pool({
        create: () => {
            const db = orm.connectSync(url);
            var _define = db.define;

            db.define = function (name, properties, opts) {
                properties = util.clone(properties);

                properties.createAt = Date;
                properties.updateAt = Date;
                properties.ACL = Object;

                var m = _define.call(this, name, properties, opts);

                var _beforeCreate;
                var _beforeSave;

                if (opts !== undefined) {
                    if (opts.hooks !== undefined) {
                        _beforeCreate = opts.hooks.beforeCreate;
                        _beforeSave = opts.hooks.beforeSave;
                    }

                    m.functions = opts.functions;
                    m.ACL = opts.ACL;
                }

                if (m.ACL === undefined)
                    m.ACL = {
                        "*": {
                            "*": true
                        }
                    };

                m.beforeCreate(function (next) {
                    this.createAt = new Date();

                    if (_beforeCreate) {
                        if (_beforeCreate.length > 0)
                            return _beforeCreate(next);
                        _beforeCreate();
                    }

                    next();
                });

                m.beforeSave(function (next) {
                    delete this.createAt;
                    this.updateAt = new Date();

                    if (_beforeSave) {
                        if (_beforeSave.length > 0)
                            return _beforeSave(next);
                        _beforeSave();
                    }

                    next();
                });

                m.relations = {};

                var _hasOne = m.hasOne;
                m.hasOne = function () {
                    var name;
                    for (var i = 0; i < arguments.length; i++)
                        if (typeof arguments[i] == "string")
                            name = arguments[i];

                    m.relations[name] = 'hasOne';

                    return _hasOne.apply(this, slice.call(arguments));
                }

                var _hasMany = m.hasMany;
                m.hasMany = function () {
                    var name;
                    for (var i = 0; i < arguments.length; i++)
                        if (typeof arguments[i] == "string")
                            name = arguments[i];

                    m.relations[name] = 'hasMany';

                    return _hasMany.apply(this, slice.call(arguments));
                }

                return m;
            }

            defs.forEach(def => def(db));
            db.syncSync();

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
        },
        maxsize: opts.maxsize,
        timeout: opts.timeout,
        retry: opts.retry
    });

    db.use = def => defs = defs.concat(def);

    return db;
};