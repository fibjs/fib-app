import { FxOrmModel } from '@fxjs/orm/typings/Typo/model';
import { FxOrmNS } from '@fxjs/orm/typings/Typo/ORM';
interface PluginOptions__Timestamp {
    createdProperty?: string | false;
    createdPropertyType?: FxOrmNS.OrigDetailedModelProperty;
    updatedProperty?: string | false;
    updatedPropertyType?: FxOrmNS.OrigDetailedModelProperty;
    expiredProperty?: string | false;
    expiredPropertyType?: FxOrmNS.OrigDetailedModelProperty;
    type?: FxOrmNS.OrigDetailedModelProperty;
    now?: {
        (): Date;
    };
    expire?: {
        (): Date;
    };
}
export default function (orm: FxOrmNS.ORM, plugin_opts?: PluginOptions__Timestamp): {
    beforeDefine: (name: string, properties: FxOrmNS.ModelPropertyDefinitionHash, opts: FxOrmNS.ModelOptions) => void;
    define(model: FxOrmModel.Model): void;
};
export {};
