import uuid = require('uuid')
import ORM = require('@fxjs/orm')
import { FxOrmNS } from '@fxjs/orm/typings/Typo/ORM';
const Helpers = ORM.Helpers;
const { prependHook } = Helpers;

export default function (
    orm: FxOrmNS.ORM,
    plugin_opts: {
        enable: boolean
    }
): FxOrmNS.Plugin {
    let { enable: use_uuid = false } = plugin_opts || {};
    
	function beforeDefine (name: string, properties: Record<string, FxOrmNS.ModelPropertyDefinition>, opts: FxOrmNS.ModelOptions) {
        use_uuid = use_uuid || opts.__webx_use_uuid
        
        if (!use_uuid)
            return ;

        properties['id'] = {
            type: 'text',
            size: 16,
            key: true,
            index: true
        }

        opts.hooks = opts.hooks || {};

        prependHook(opts.hooks, 'beforeCreate', function () {
            this.id = uuid.snowflake().hex();
        });
    }

    return {
        beforeDefine
    }
}