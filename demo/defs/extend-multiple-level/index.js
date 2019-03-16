module.exports = orm => {
    var Level = orm.define('level', {
        name: String,
	});
	
	Level.hasOne('one_l2', Level, {})
	Level.hasOne('one_l3', Level, {})

    var SubLevel = orm.define('sub_level', {
        name: String,
	});
	SubLevel.hasOne('subl_one_subl', SubLevel, {})
	
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
