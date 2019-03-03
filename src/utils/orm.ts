export function default_settings (): FibApp.FibAppOrmSettings {
    return {
        'app.orm.common_fields.createdBy': 'createdBy',
        'app.orm.common_fields.createdAt': 'createdAt',
        'app.orm.common_fields.updatedAt': 'updatedAt'
    }
}

export function set_orm_default_settings (orm: FibApp.FibAppORM) {
    let settings = default_settings()
    Object.keys(
        settings
    ).forEach(key => {
        orm.settings.set(key, settings[key])
    })
}

/* field about :start */
export function get_field_createdby (settings: FxOrmNS.SettingInstance) {
    return settings.get('app.orm.common_fields.createdBy')
}

export function get_field_createdat (settings: FxOrmNS.SettingInstance) {
    return settings.get('app.orm.common_fields.createdAt')
}

export function get_field_updatedat (settings: FxOrmNS.SettingInstance) {
    return settings.get('app.orm.common_fields.updatedAt')
}
/* field about :end */

/* fib-app specified properties about :start */
interface InternalApiInfoSettingOptions {
    data: any,
    req_info?: FibApp.FibAppReq
}
export function create_instance_for_internal_api (cls: FxOrmNS.Model, options: InternalApiInfoSettingOptions): FxOrmNS.Instance {
    const o = new cls(options.data)
    attach_internal_api_requestinfo_to_instance(o, options)
    
    return o
}

export function attach_internal_api_requestinfo_to_instance (inst: FxOrmNS.Instance, options: InternalApiInfoSettingOptions): void {
    // avoid repeative define
    if (inst.$in_filtered_rest)
        return

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


