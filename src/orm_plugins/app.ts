import type { FxOrmNS, FxOrmModel } from '@fxjs/orm';
import type { FibApp } from '../Typo/app';

import util = require('util')
import { addReadonlyHiddenProperty } from "../utils/obj";

import ORM = require('@fxjs/orm');
const Helpers = ORM.Helpers;

const error_reasons = [
    '',
    '!name',
    '!orm_definition_hash[name]',
    'definition[name].name !== name'
]
function throw_invalid_definition (name: string, error_r_key: number) {
    const error_reason = error_reasons[error_r_key]

    if (error_reason)
        throw new Error(`error occured when finding pre-define orm model ${name}, reason: ${error_reason}`)
}

function int (bool: boolean) {
    return bool ? 1 : 0
}

/**
 * @description first initial plugin before all other plugins
 */
export default function (ormInstance: FibApp.FibAppORM, opts: FxOrmNS.ModelOptions) {
    ormInstance.app = opts.app;

    const orm_definition_hash: {[model_name: string]: {
        name: string
        properties: Record<string, FxOrmModel.ModelPropertyDefinition>
        opts: FibApp.FibAppOrmModelDefOptions
    }} = {};

    const compatibleKeys = [
        'ACL',
        'OACL',
        'functions',
        'viewFunctions',
        'viewServices',
        'no_graphql',
    ]
    function beforeDefine (name: string, properties: Record<string, FxOrmModel.ModelPropertyDefinition>, opts: FxOrmNS.ModelOptions) {
        opts.timestamp = true

        orm_definition_hash[name] = { name, properties, opts }

        opts.webx = <FibApp.FibAppOrmModelDefOptions['webx']>util.extend(
            util.pick(opts, compatibleKeys),
            opts.webx
        );
    }
    
    let cls_id = 1;
    function define (m: FibApp.FibAppORMModel/* , ormInstance: FibApp.FibAppORM */) {
        const name = Object.keys(ormInstance.models).find(model_name => ormInstance.models[model_name] === m)
        throw_invalid_definition(
            name,
            int(!name)  + int(!orm_definition_hash[name]) + int(orm_definition_hash[name].name !== name)
        )

        const definition = orm_definition_hash[name];

        const orm_define_opts = definition.opts || {};
        /**
         * @compatibility
         *  allow webx config option from top-level definition,
         *  as those options from `opts.webx[xxx]` recommended
         */
        const webx_config_opts = orm_define_opts.webx;

        m.$webx = m.$webx || <typeof m.$webx>{
            ACL: webx_config_opts.ACL,
            OACL: webx_config_opts.OACL,
            functions: webx_config_opts.functions || {},
            viewFunctions: webx_config_opts.viewFunctions || {},
            viewServices: webx_config_opts.viewServices || {},
            no_graphql: !(webx_config_opts.no_graphql === undefined || webx_config_opts.no_graphql === false),
            queryKeyWhiteList: webx_config_opts.queryKeyWhiteList || {},
            
            rpc: {...webx_config_opts.rpc},
        };

        Object.defineProperty(m.$webx, 'cid', { value: cls_id++, writable: false});
        Object.defineProperty(m.$webx, 'model_name', { value: name, writable: false});

        const __selfPropertiesOnDefined = Helpers.pickProperties(m, (p, k) => {
            return !m.associations[k];
        })
        Object.defineProperty(m.$webx, '__selfPropertiesOnDefined', { value: __selfPropertiesOnDefined, writable: false});
        const whereWhiteList = Array.isArray(m.$webx.queryKeyWhiteList?.where) ? new Set(m.$webx.queryKeyWhiteList?.where) : null;
        Object.defineProperty(m.$webx, '__whereBlackProperties', {
            get () {
                const whereBlacklist = !whereWhiteList ? [] : Object.keys(m.$webx.__selfPropertiesOnDefined).filter(k => !whereWhiteList.has(k));
                return new Set(whereBlacklist);
            }
        });

        const findByWhiteList = Array.isArray(m.$webx.queryKeyWhiteList?.findby) ? new Set(m.$webx.queryKeyWhiteList?.findby) : null;
        
        Object.defineProperty(m.$webx, '__findByExtendBlackProperties', {
            get () {
                const findByBlacklist = !findByWhiteList ? [] : Object.keys(m.associations).filter(k => !findByWhiteList.has(k));
                return new Set(findByBlacklist);
            }
        });

        if (m.$webx.ACL === undefined)
            m.$webx.ACL = {
                "*": {
                    "*": true,
                    "extends": {
                        "*": {
                            "*": true
                        }
                    }
                }
            };

        compatSetup(m);

        return m;
    }

    return {
        beforeDefine,
        define
    }
}

/**
 * @warning would deprecated in > 1.13, use `m.$webx.extends` rather than `m.extends`
 */
function compatSetup (m: FibApp.FibAppORMModel) {
    addReadonlyHiddenProperty(m, 'cid', () => m.$webx.cid)
    addReadonlyHiddenProperty(m, 'model_name', () => m.$webx.model_name)
    addReadonlyHiddenProperty(m, 'ACL', () => m.$webx.ACL)
    addReadonlyHiddenProperty(m, 'OACL', () => m.$webx.OACL)
    addReadonlyHiddenProperty(m, 'functions', () => m.$webx.functions)
    addReadonlyHiddenProperty(m, 'viewFunctions', () => m.$webx.viewFunctions)
    addReadonlyHiddenProperty(m, 'viewServices', () => m.$webx.viewServices)
    addReadonlyHiddenProperty(m, 'no_graphql', () => m.$webx.no_graphql)
}