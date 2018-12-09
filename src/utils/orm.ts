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

/* field about :start */
export function getCreatedByField (settings: FxOrmNS.SettingInstance) {
    return settings.get('app.orm.common_fields.createdBy')
}

export function getCreatedAtField (settings: FxOrmNS.SettingInstance) {
    return settings.get('app.orm.common_fields.createdAt')
}

export function getUpdatedAtField (settings: FxOrmNS.SettingInstance) {
    return settings.get('app.orm.common_fields.updatedAt')
}
/* field about :end */

/* fib-app specified properties about :start */
interface InternalApiInfoSettingOptions {
    data,
    req_info?: FibApp.FibAppReq
}
export function createModelInstanceForInternalApi (cls: FxOrmNS.Model, options: InternalApiInfoSettingOptions): FxOrmNS.Instance {
    const o = new cls(options.data)
    attachInteralApiRequestInfoToInstnace(o, options)
    
    return o
}

export function attachInteralApiRequestInfoToInstnace (inst: FxOrmNS.Instance, options: InternalApiInfoSettingOptions): void {
    const model = inst.model()

    if (!model.settings.get('rest.model.inject_rest_request_info'))
        return 
    
    Object.defineProperty(inst, `$in_filtered_rest`, {
        value: true,
        enumerable: false,
        writable: false
    })
    
    if (options.req_info)
        Object.defineProperty(inst, `$rest_req_info`, {
            value: options.req_info,
            enumerable: false,
            writable: false
        })
}
/* fib-app specified properties about :end */


