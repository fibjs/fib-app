import { FxOrmNS, FxOrmModel } from "@fxjs/orm";

// TODO: allow developer customize what is `id` on fib-app's rest model
export default function (
    orm: FxOrmNS.ORM,
    plugin_opts: {
    }
): FxOrmNS.Plugin {
	function beforeDefine (
        name: string,
        properties: Record<string, FxOrmModel.ModelPropertyDefinition>,
        opts: FxOrmModel.ModelDefineOptions
    ) {
        if (typeof opts.__webx_use_uuid === 'boolean') return ;

        if (opts.extension || opts.__for_extension) {
            // for those extension models, we should enforce add id property to it
            if (!properties.id) {
                opts.__webx_use_uuid = true;
            }
        }
    }

    return {
        beforeDefine
    }
}