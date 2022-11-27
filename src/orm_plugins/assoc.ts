import { FxOrmNS, FxOrmModel } from "@fxjs/orm";

export default function (
    orm: FxOrmNS.ORM,
    plugin_opts: {
    }
): FxOrmNS.Plugin {
	function beforeDefine (name: string, properties: Record<string, FxOrmModel.ModelPropertyDefinition>, opts: FxOrmNS.ModelOptions) {
        if ((opts.extension || opts.__for_extension) && !properties.id) {
            opts.__webx_use_uuid = true;
        }
    }

    return {
        beforeDefine
    }
}