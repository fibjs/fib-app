import uuid = require('uuid')
import { prependHook } from './_tools';

export default function (orm, use_uuid: boolean = false) {
	function beforeDefine (name: string, properties: FxOrmNS.ModelPropertyDefinitionHash, opts: FxOrmNS.ModelOptions) {
        if (use_uuid)
            properties['id'] = {
                type: 'text',
                key: true,
                index: true
            }

        
        if (use_uuid) {
            opts.hooks = opts.hooks || {};

            prependHook(opts.hooks, 'beforeCreate', function () {
                this.id = uuid.snowflake().hex();
            });
        }
    }

    return {
        beforeDefine
    }
}