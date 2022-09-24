import { FxOrmModel } from '@fxjs/orm/typings/Typo/model';
import { FxOrmNS } from '@fxjs/orm/typings/Typo/ORM';
interface PluginOptions__Timestamp {
    createdPropertyName?: string | false;
    createdProperty?: FxOrmNS.OrigDetailedModelProperty;
    updatedPropertyName?: string | false;
    updatedProperty?: FxOrmNS.OrigDetailedModelProperty;
    expiredPropertyName?: string | false;
    expiredProperty?: FxOrmNS.OrigDetailedModelProperty;
    type?: FxOrmNS.OrigDetailedModelProperty;
    now?: {
        (): Date;
    };
    expire?: {
        (): Date;
    };
}
export default function (orm: FxOrmNS.ORM, plugin_opts?: PluginOptions__Timestamp): {
    beforeDefine: (name: string, properties: Record<string, FxOrmNS.ModelPropertyDefinition>, opts: FxOrmNS.ModelOptions) => void;
    define(model: FxOrmModel.Model): void;
};
export {};
