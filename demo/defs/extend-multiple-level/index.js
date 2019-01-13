module.exports = orm => {
    var Level = orm.define('level', {
        name: String,
	});
	
	Level.hasOne('one_l2', Level, {})
	Level.hasOne('one_l3', Level, {})

    var SubLevel = orm.define('sub_level', {
        name: String,
	});
	SubLevel.hasOne('one_subl', SubLevel, {})
	
	Level.hasOne('one_sl', SubLevel, {})

	Level.hasMany('many_sublevels', SubLevel, {}, {})
};
