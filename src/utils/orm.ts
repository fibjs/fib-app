export function defaultSettings (): FibApp.FibAppOrmSettings {
    return {
        'app.orm.common_fields.createdBy': 'createdBy',
        'app.orm.common_fields.createdAt': 'createdAt',
        'app.orm.common_fields.updatedAt': 'updatedAt'
    }
}

export function setOrmDefaultSettings (orm: FibApp.FibAppORM) {
    let settings = defaultSettings()
    Object.keys(
        settings
    ).forEach(key => {
        orm.settings.set(key, settings[key])
    })
}

export function getCreatedByField (settings: FxOrmNS.SettingInstance) {
    return settings.get('app.orm.common_fields.createdBy')
}

export function getCreatedAtField (settings: FxOrmNS.SettingInstance) {
    return settings.get('app.orm.common_fields.createdAt')

}

export function getUpdatedAtField (settings: FxOrmNS.SettingInstance) {
    return settings.get('app.orm.common_fields.updatedAt')

}

