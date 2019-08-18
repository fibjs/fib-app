import util = require('util')
import ORM = require('@fxjs/orm')
const Helpers = ORM.Helpers;
const { prependHook } = Helpers;

interface PluginOptions__Timestamp {
	createdProperty?: string | false
	createdPropertyType?: FxOrmNS.OrigDetailedModelProperty,
	updatedProperty?: string | false
	updatedPropertyType?: FxOrmNS.OrigDetailedModelProperty,
	expiredProperty?: string | false
	expiredPropertyType?: FxOrmNS.OrigDetailedModelProperty,
	type?: FxOrmNS.OrigDetailedModelProperty
	now?: { (): Date }
	expire?: { (): Date }
}

const defaults_opts: PluginOptions__Timestamp = {
	createdProperty: 'created_at',
	updatedProperty: 'updated_at',
	expiredProperty: false,
	type: { type: 'date', time: true },
	now: function () { return new Date(); },
	expire: function () { var d = new Date(); d.setMinutes(d.getMinutes() + 60); return d; },
};

export default function (orm: FxOrmNS.ORM, plugin_opts: PluginOptions__Timestamp = {}) {
	plugin_opts = util.extend({}, defaults_opts, plugin_opts)

	function beforeDefine (name: string, properties: FxOrmNS.ModelPropertyDefinitionHash, opts: FxOrmNS.ModelOptions) {
		if (!opts.timestamp) return;
		
		if (typeof opts.timestamp == 'object')
			plugin_opts = util.extend(plugin_opts, opts.timestamp);

		if (plugin_opts.createdProperty)
			properties[plugin_opts.createdProperty] = util.extend({}, plugin_opts.type, plugin_opts.createdPropertyType);
		if (plugin_opts.updatedProperty)
			properties[plugin_opts.updatedProperty] = util.extend({}, plugin_opts.type, plugin_opts.updatedPropertyType);
		if (plugin_opts.expiredProperty)
			properties[plugin_opts.expiredProperty] = util.extend({}, plugin_opts.type, plugin_opts.expiredPropertyType);

		opts.hooks = opts.hooks || {};
	}

	return {
		beforeDefine: beforeDefine,
		define (model: FxOrmModel.Model) {
			const {
				createdProperty = false,
				updatedProperty = false,
				expiredProperty = false,
				now = false,
				expire = false
			} = plugin_opts || {}

			if (now && createdProperty)	
				model.beforeCreate(function () {
					this[createdProperty] = now();

					if (updatedProperty)
						this[updatedProperty] = this[createdProperty];
				}, { oldhook: 'prepend' })

			if (now && updatedProperty)	
				model.beforeSave(function () {
					if (this.__opts.changes.length > 0) {
						this[updatedProperty] = now();
						
						if (createdProperty)
							delete this[createdProperty];
					}
				}, { oldhook: 'prepend' })

			if (expire && expiredProperty)	
				model.beforeSave(function () {
					this[expiredProperty] = expire();
				}, { oldhook: 'prepend' })
		}
	}
};