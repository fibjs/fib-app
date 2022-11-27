import util = require('util')
import ORM = require('@fxjs/orm')
import { FxOrmNS, FxOrmModel, FxOrmProperty } from '@fxjs/orm';
const Helpers = ORM.Helpers;

interface PluginOptions__Timestamp {
	createdPropertyName?: string | false
	createdProperty?: FxOrmProperty.NormalizedProperty,
	updatedPropertyName?: string | false
	updatedProperty?: FxOrmProperty.NormalizedProperty,
	expiredPropertyName?: string | false
	expiredProperty?: FxOrmProperty.NormalizedProperty,
	type?: FxOrmProperty.NormalizedProperty
	now?: { (): Date }
	expire?: { (): Date }
}

const defaults_opts: PluginOptions__Timestamp = {
	createdPropertyName: 'created_at',
	updatedPropertyName: 'updated_at',
	expiredPropertyName: false,
	type: { type: 'date', time: true },
	now: function () { return new Date(); },
	expire: function () { var d = new Date(); d.setMinutes(d.getMinutes() + 60); return d; },
};

export default function (orm: FxOrmNS.ORM, plugin_opts: PluginOptions__Timestamp = {}) {
	plugin_opts = util.extend({}, defaults_opts, plugin_opts)

	function beforeDefine (name: string, properties: Record<string, FxOrmModel.ModelPropertyDefinition>, opts: FxOrmNS.ModelOptions) {
		if (!opts.timestamp) return;
		
		if (typeof opts.timestamp == 'object')
			plugin_opts = util.extend(plugin_opts, opts.timestamp);

		if (plugin_opts.createdPropertyName)
			properties[plugin_opts.createdPropertyName] = util.extend({}, plugin_opts.type, plugin_opts.createdProperty);
		if (plugin_opts.updatedPropertyName)
			properties[plugin_opts.updatedPropertyName] = util.extend({}, plugin_opts.type, plugin_opts.updatedProperty);
		if (plugin_opts.expiredPropertyName)
			properties[plugin_opts.expiredPropertyName] = util.extend({}, plugin_opts.type, plugin_opts.expiredProperty);

		opts.hooks = opts.hooks || {};
	}

	return {
		beforeDefine: beforeDefine,
		define (model: FxOrmModel.Model) {
			const {
				createdPropertyName = false,
				updatedPropertyName = false,
				expiredPropertyName = false,
				now = false,
				expire = false
			} = plugin_opts || {}

			if (now && createdPropertyName)	
				model.beforeCreate(function () {
					this[createdPropertyName] = now();

					if (updatedPropertyName)
						this[updatedPropertyName] = this[createdPropertyName];
				}, { oldhook: 'prepend' })

			if (now && updatedPropertyName)	
				model.beforeSave(function () {
					if (this.__opts.changes.length > 0) {
						this[updatedPropertyName] = now();
						
						if (createdPropertyName)
							delete this[createdPropertyName];
					}
				}, { oldhook: 'prepend' })

			if (expire && expiredPropertyName)	
				model.beforeSave(function () {
					this[expiredPropertyName] = expire();
				}, { oldhook: 'prepend' })
		}
	}
};