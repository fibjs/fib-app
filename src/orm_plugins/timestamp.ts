import util = require('util')
import ORM = require('@fxjs/orm')
const Helpers = ORM.Helpers;
const { prependHook } = Helpers;

interface PluginOptions__Timestamp {
	createdProperty?: string | false
	updatedProperty?: string | false
	expireProperty?: string | false
	type?: FxOrmNS.OrigDetailedModelProperty
	now?: {
		(): Date
	}
	expire?: {
		(): Date
	}
}

const defaults_opts: PluginOptions__Timestamp = {
	createdProperty: 'created_at',
	updatedProperty: 'updated_at',
	expireProperty: false,
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
			properties[plugin_opts.createdProperty] = plugin_opts.type;
		if (plugin_opts.updatedProperty)
			properties[plugin_opts.updatedProperty] = plugin_opts.type;
		if (plugin_opts.expireProperty)
			properties[plugin_opts.expireProperty] = plugin_opts.type;

		opts.hooks = opts.hooks || {};
	}

	return {
		beforeDefine: beforeDefine,
		define (model: FxOrmModel.Model) {
			if (plugin_opts.createdProperty)	
				model.beforeCreate(function () {
					const createdProperty = plugin_opts.createdProperty as string
					const updatedProperty = plugin_opts.updatedProperty as string

					this[createdProperty] = this[updatedProperty] = new Date();
				}, { oldhook: 'prepend' })

			if (plugin_opts.updatedProperty)	
				model.beforeSave(function () {
					const createdProperty = plugin_opts.createdProperty as string
					const updatedProperty = plugin_opts.updatedProperty as string

					if (this.__opts.changes.length > 0) {
						delete this[createdProperty];
						this[updatedProperty] = new Date();
					}
				}, { oldhook: 'prepend' })

			if (plugin_opts.expireProperty)	
				model.beforeSave(function () {
					this[plugin_opts.expireProperty as string] = plugin_opts.expire();
				}, { oldhook: 'prepend' })
		}
	}
};