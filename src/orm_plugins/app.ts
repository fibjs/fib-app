const error_reasons = [
    '',
    '!name',
    '!orm_definition_hash[name]',
    'definition[name].name !== name'
]
function throw_invalid_definition (name: string, error_r_key: number) {
    const error_reason = error_reasons[error_r_key]

    if (error_reason)
        throw `error occured when finding pre-define orm model ${name}, reason: ${error_reason}`
}
function int (bool: boolean) {
    return bool ? 1 : 0
}


const slice = Array.prototype.slice;
export default function (ormInstance: FibApp.FibAppORM, opts) {
    ormInstance.app = opts.app;

    const orm_definition_hash: {[model_name: string]: {
        name: string
        properties: FxOrmNS.ModelPropertyDefinitionHash
        opts: FxOrmNS.ModelOptions
    }} = {};

    function beforeDefine (name: string, properties: FxOrmNS.ModelPropertyDefinitionHash, opts: FxOrmNS.ModelOptions) {
        opts.timestamp = true

        orm_definition_hash[name] = { name, properties, opts }
    }
    
    let cls_id = 1;
    function define (m: FibApp.FibAppORMModel/* , ormInstance: FibApp.FibAppORM */) {
        const name = Object.keys(ormInstance.models).find(model_name => ormInstance.models[model_name] === m)
        throw_invalid_definition(
            name,
            int(!name)  + int(!orm_definition_hash[name]) + int(orm_definition_hash[name].name !== name)
        )

        const definition = orm_definition_hash[name]
        
        m.cid = cls_id++;
        Object.defineProperty(m, 'model_name', { value: name });

        const orm_define_opts = definition.opts

        m.ACL = orm_define_opts.ACL;
        m.OACL = orm_define_opts.OACL;

        m.functions = orm_define_opts.functions || {};
        m.viewFunctions = orm_define_opts.viewFunctions || {};
        m.viewServices = orm_define_opts.viewServices || {};

        if (m.ACL === undefined)
            m.ACL = {
                "*": {
                    "*": true,
                    "extends": {
                        "*": {
                            "*": true
                        }
                    }
                }
            };
        
        var { no_graphql = false } = orm_define_opts || {};
        m.no_graphql = no_graphql;

        compatSetup(m);

        return m;
    }

    return {
        beforeDefine,
        define
    }
}

/**
 * @warning would deprecated in > 1.13, never use `m.extends`
 */
function compatSetup (
    m: FibApp.FibAppORMModel
) {
    m.extends = {} as FibApp.FibAppOrmModelExtendsInfoHash;

    var _hasOne = m.hasOne;
    m.hasOne = function (extend_name: string) {
        var model: FibApp.FibAppORMModel = arguments[1]
        var orm_hasOne_opts: FxOrmAssociation.AssociationDefinitionOptions_HasOne = arguments[2]
        
        if (arguments[1] && !arguments[1].table) {
            orm_hasOne_opts = arguments[1]
            model = arguments[1] = null
        }

        var assoc_model = null;
        m.extends[extend_name] = {
            type: 'hasOne',
            model: model,
            get assoc_model () {
                return assoc_model;
            },
            // it's pointless, just keep same format with `hasMany`
            model_associated_models: {}
        };

        if (orm_hasOne_opts !== undefined && orm_hasOne_opts.reversed)
            m.extends[extend_name].reversed = true;

        return ( assoc_model = _hasOne.apply(this, slice.call(arguments)) );
    }

    var _hasMany = m.hasMany;
    m.hasMany = function (extend_name: string, model: FibApp.FibAppORMModel) {
        var model_associated_models = {}, orm_hasMany_opts = {} as FxOrmAssociation.AssociationDefinitionOptions_HasMany;
        if (arguments.length >= 4) {
            model_associated_models = arguments[2]
            orm_hasMany_opts = arguments[3]
        } else {
            model_associated_models = {}
            orm_hasMany_opts = arguments[2]
        }

        var assoc_model = null;
        m.extends[extend_name] = {
            type: 'hasMany',
            model: model,
            get assoc_model () {
                return assoc_model;
            },
            model_associated_models: model_associated_models
        };

        if (orm_hasMany_opts && orm_hasMany_opts.reversed)
            m.extends[extend_name].reversed = true;

        return ( assoc_model = _hasMany.apply(this, slice.call(arguments)) );
    }

    var _extendsTo = m.extendsTo;
    m.extendsTo = function (extend_name: string, assoc_props: FxOrmModel.ModelPropertyDefinitionHash, orm_extendsTo_opts?: FxOrmAssociation.AssociationDefinitionOptions_HasMany) {
        orm_extendsTo_opts = orm_extendsTo_opts || {};
        orm_extendsTo_opts.hooks = orm_extendsTo_opts.hooks || {};

        var assoc_model = null;
        m.extends[extend_name] = {
            type: 'extendsTo',
            // it's pointless, just keep same format with `hasMany`
            model: null,
            get assoc_model () {
                return assoc_model;
            },
            model_associated_models: {}
        };

        return ( assoc_model = _extendsTo.apply(this, slice.call(arguments)) );
    }
}