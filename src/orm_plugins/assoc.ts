export default function (
    orm: FxOrmNS.ORM,
    plugin_opts: {
    }
): FxOrmNS.Plugin {
	function beforeDefine (name: string, properties: FxOrmNS.ModelPropertyDefinitionHash, opts: FxOrmNS.ModelOptions) {
        if (opts.extension) {
            // add it to enable uuid for model created in `.extendsTo`
            opts.__webx_use_uuid = true;
        }
    }

    return {
        beforeDefine
    }
}