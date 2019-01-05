import uuid = require('uuid')
import { prependHook } from './_tools';

export default function (orm, plugin_opts) {
	function beforeDefine (name: string, properties: FxOrmNS.ModelPropertyDefinitionHash, opts: FxOrmNS.ModelOptions) {
        properties['id'] = {
            type: 'text',
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