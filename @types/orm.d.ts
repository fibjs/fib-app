/// <reference types="@fibjs/types" />
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
        webx?: {
            ACL?: FibAppACL.FibACLDef
            OACL?: FibAppACL.FibOACLDef
            functions?: FibAppOrmModelFunctionHash
            viewFunctions?: FibAppOrmModelViewFunctionHash
            viewServices?: FibAppOrmModelViewServiceHash
            no_graphql?: boolean
        }
    }
    interface ExtendModelWrapper {
        type: 'hasOne' | 'hasMany' | 'extendsTo';
        reversed?: boolean;
        model: FibApp.FibAppORMModel;
        assoc_model: FibApp.FibAppORMModel;
    }
    /**
     * @deprecated
     */
    interface FibAppFixedOrmExtendModelWrapper extends ExtendModelWrapper {
        model_associated_models: {
            [modelName: string]: FibAppORMModel
        }
    }
    /**
     * @deprecated
     */
    interface FibAppOrmModelExtendsInfoHash {
        [ext_name: string]: FibAppFixedOrmExtendModelWrapper
    }
    // just for compability
    type FibAppOrmModelExtendsInfo = FibAppOrmModelExtendsInfoHash
    
    interface FibAppORMModel extends FxOrmNS.Model {

        $webx: {
            // globally unique class id
            cid: number
            model_name: string
            ACL: FibAppACL.FibACLDef
            OACL: FibAppACL.FibOACLDef
            functions: FibAppOrmModelFunctionHash
            viewFunctions: FibAppOrmModelViewFunctionHash
            viewServices: FibAppOrmModelViewServiceHash
            no_graphql: boolean
        }
        // @deprecated, use model $webx[xxx] instead
        readonly cid: FibAppORMModel['$webx']['cid']
        readonly model_name: FibAppORMModel['$webx']['model_name']
        readonly ACL: FibAppORMModel['$webx']['ACL']
        readonly OACL: FibAppORMModel['$webx']['OACL']
        readonly functions: FibAppORMModel['$webx']['functions']
        readonly viewFunctions: FibAppORMModel['$webx']['viewFunctions']
        readonly viewServices: FibAppORMModel['$webx']['viewServices']
        readonly no_graphql: FibAppORMModel['$webx']['no_graphql']
    }

    interface FibAppOrmSettings {
        'app.orm.common_fields.createdBy': string
        'app.orm.common_fields.createdAt': string
        'app.orm.common_fields.updatedAt': string

        [extend_property: string]: any
    }
}