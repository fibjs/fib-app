export default function (
    orm: FxOrmNS.ORM,
    plugin_opts: {
    }
): FxOrmNS.Plugin {
	function beforeDefine (name: string, properties: FxOrmNS.ModelPropertyDefinitionHash, opts: FxOrmNS.ModelOptions) {
        if (opts.extension && !properties.id) {
            opts.__webx_use_uuid = true;
        }
    }

    return {
        beforeDefine
    }
}