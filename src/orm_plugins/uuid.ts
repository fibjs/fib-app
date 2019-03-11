import uuid = require('uuid')
import { prependHook } from './_tools';

export default function (orm, plugin_opts): FxOrmNS.Plugin {
	function beforeDefine (name: string, properties: FxOrmNS.ModelPropertyDefinitionHash, opts: FxOrmNS.ModelOptions) {
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

    // const beforeAddAssociatedProperty: FxOrmNS.Plugin['beforeAddAssociatedProperty'] = function (
    //     params, assoc_opts, status
    // ) {
    //     if (params.association_name !== 'createdBy')
    //         return ;
    // }

    return {
        beforeDefine,
        // beforeAddAssociatedProperty
    }
}