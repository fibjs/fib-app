import { FxOrmNS, FxOrmModel, FxOrmProperty } from '@fxjs/orm';
interface PluginOptions__Timestamp {
    createdPropertyName?: string | false;
    createdProperty?: FxOrmProperty.NormalizedProperty;
    updatedPropertyName?: string | false;
    updatedProperty?: FxOrmProperty.NormalizedProperty;
    expiredPropertyName?: string | false;
    expiredProperty?: FxOrmProperty.NormalizedProperty;
    type?: FxOrmProperty.NormalizedProperty;
    now?: {
        (): Date;
    };
    expire?: {
        (): Date;
    };
}
export default function (orm: FxOrmNS.ORM, plugin_opts?: PluginOptions__Timestamp): {
    beforeDefine: (name: string, properties: Record<string, FxOrmModel.ModelPropertyDefinition>, opts: FxOrmNS.ModelOptions) => void;
    define(model: FxOrmModel.Model): void;
};
export {};
