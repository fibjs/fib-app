/// <reference types="fibjs" />
/// <reference types="@fxjs/orm" />

/// <reference path="../@types/index.d.ts" />


declare namespace FibApp {
    interface FibAppOrmModelFunction {
        (req: FibAppReq, data: FibAppReqData): FibAppModelFunctionResponse
    }

    /* model view function :start */
    interface FibAppOrmModelViewFunctionRequestInfo {
        base: string
        id: AppIdType
        extend: string
        ext_id: AppIdType
    }
    interface FibAppOrmModelViewFunction {
        (result: null | FibAppApiFunctionResponse, req: FibAppReq, modelViewFunctionInfo: FibAppOrmModelViewFunctionRequestInfo): FibAppModelViewFunctionResponse
    }
    interface FibAppOrmModelFunctionHash {
        [fnName: string]: FibAppOrmModelFunction
    }

    interface FibAppOrmModelViewFunctionDefOptions {
        static?: boolean
        handler: FibAppOrmModelViewFunction
        response_headers?: object
    }
    type FibAppOrmModelViewFunctionDefinition = FibAppOrmModelViewFunction | FibAppOrmModelViewFunctionDefOptions
    interface FibAppOrmModelViewFunctionHash {
        get?: FibAppOrmModelViewFunctionDefinition
        find?: FibAppOrmModelViewFunctionDefinition
        eget?: FibAppOrmModelViewFunctionDefinition
        efind?: FibAppOrmModelViewFunctionDefinition

        [fnName: string]: FibAppOrmModelViewFunctionDefinition
    }
    /* model view function :end */

    /* model view service :start */
    interface FibAppOrmModelViewServiceCallback {
        (req: FibAppReq, data: FibAppReqData): FibAppModelFunctionResponse
    }
    interface FibAppOrmModelViewServiceHash {
        [fnName: string]: FibAppOrmModelViewServiceCallback
    }
    /* model view service :end */

    interface FibAppOrmInstance extends FxOrmNS.Instance {
        acl: FibAppACL.ACLDefinition
        oacl: FibAppACL.OACLDefinition
    }

    // keep compatible with definition in '@fxjs/orm'
    interface AppSpecialDateProperty extends FxOrmNS.ModelPropertyDefinition {
        type: 'date'
        time?: true
    }
    interface OrigORMDefProperties {
        createdAt?: AppSpecialDateProperty
        updatedAt?: AppSpecialDateProperty
        [key: string]: FxOrmNS.OrigModelPropertyDefinition
    }

    interface FibAppOrmModelDefOptions extends FxOrmNS.ModelOptions {
        ACL?: FibAppACL.FibACLDef
        OACL?: FibAppACL.FibOACLDef
        functions?: FibAppOrmModelFunctionHash
        viewFunctions?: FibAppOrmModelViewFunctionHash
        viewServices?: FibAppOrmModelViewServiceHash
        no_graphql?: boolean
    }
    interface ExtendModelWrapper {
        // 'hasOne', 'hasMany'
        type: string;
        reversed?: boolean;
        model: FibApp.FibAppORMModel;
    }
    interface FibAppFixedOrmExtendModelWrapper extends ExtendModelWrapper {
        extraProperties: {
            [modelName: string]: FibAppORMModel
        }
    }
    interface FibAppOrmModelExtendsInfoHash {
        [ext_name: string]: FibAppFixedOrmExtendModelWrapper
    }
    // just for compability
    type FibAppOrmModelExtendsInfo = FibAppOrmModelExtendsInfoHash
    
    interface FibAppORMModel extends FxOrmNS.Model {
        // globally unique class id
        cid: number
        model_name: string;
        ACL: FibAppACL.FibACLDef// FibAppACL.ACLDefinition
        OACL: FibAppACL.FibOACLDef// FibAppACL.OACLDefinition
        functions: FibAppOrmModelFunctionHash
        viewFunctions: FibAppOrmModelViewFunctionHash
        viewServices: FibAppOrmModelViewServiceHash
        no_graphql: boolean

        extends: FibAppOrmModelExtendsInfoHash;
    }

    interface FibAppOrmSettings {
        'app.orm.common_fields.createdBy': string
        'app.orm.common_fields.createdAt': string
        'app.orm.common_fields.updatedAt': string

        [extend_property: string]: any
    }
}
