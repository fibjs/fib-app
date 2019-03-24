module.exports = orm => {
    var Level = orm.define('level', {
        name: String,
		level_f: String
	});

    var SubLevel = orm.define('sub_level', {
        name: String,
		sublevel_f: String
	});

    var Descendant = orm.define('descendant_level', {
        name: String,
		descendant_level_f: String
	});
	
	Level.hasOne('one_l2', Level, {})
	Level.hasOne('one_l3', Level, {})
	SubLevel.hasOne('subl_one_subl', SubLevel, {})
	SubLevel.hasOne('subl_one_descendant_level', Descendant, {})
	
	Level.hasOne('one_sl', SubLevel, {})

	Level.hasMany('many_sublevels', SubLevel, {
		since: {
			type: 'date',
			time: true
		}
	}, {
		// hooks: {
		// 	beforeSave (extra, next) {
		// 		console.log('extra', extra, next)
		// 		next()
		// 	}
		// }
	})

	Level.extendsTo('lproperty', {
		name: String,
		weight: {
			type: 'integer',
			size: 4
		}
	})
};
