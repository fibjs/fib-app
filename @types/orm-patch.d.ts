/// <reference types="fibjs" />
/// <reference types="@fxjs/orm" />

/// <reference path="../@types/index.d.ts" />


declare namespace FibApp {
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

    interface FibAppOrmInstance extends FxOrmNS.Instance {
        acl: FibAppACL.ACLDefinition
        oacl: FibAppACL.OACLDefinition
    }

    // keep compatible with definition in '@fxjs/orm'
    interface AppSpecialDateProperty extends FxOrmNS.OrigDetailedModelProperty {
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
        no_graphql?: boolean
    }
    interface FibAppORMModel extends FxOrmNS.Model {
        // globally unique class id
        cid: number
        model_name: string;
        ACL: FibAppACL.FibACLDef// FibAppACL.ACLDefinition
        OACL: FibAppACL.FibOACLDef// FibAppACL.OACLDefinition
        functions: FibAppOrmModelFunctionHash
        viewFunctions?: FibAppOrmModelViewFunctionHash
        no_graphql: boolean

        extends: { [extendModel: string]: FibAppFixedOrmExtendModelWrapper };
    }

    interface FibAppFixedOrmExtendModelWrapper extends FxOrmNS.ExtendModelWrapper {
        extraProperties: {
            [modelName: string]: FibAppORMModel
        }
    }

    interface FibAppOrmSettings {
        'app.orm.common_fields.createdBy': string
        'app.orm.common_fields.createdAt': string
        'app.orm.common_fields.updatedAt': string

        [extend_property: string]: any
    }
}
