/// <reference lib="es2016" />

/// <reference path="../../@types/index.d.ts" />

export function is_internal_base_api_fn (app: FibApp.FibAppClass, func: any | Function) {
    return [ app.api.get, app.api.post, app.api.put, app.api.del, app.api.find ].includes(func)
}

export function is_internal_ext_api_fn (app: FibApp.FibAppClass, func: any | Function) {
    return [ app.api.eget, app.api.epost, app.api.eput, app.api.edel, app.api.efind ].includes(func)
}

export function parse_req_resource_and_hdlr_type (req: Class_HttpRequest): {
    requestedResultType: FibApp.FibAppReqResourceType,
    requestedPayloadType: FibApp.FibAppReqResourceHandlerType
} {
    const reqAcceptString = (req.firstHeader('Accept') || '').split(';')[0] || ''
    const reqContentTypeString = (req.firstHeader('Content-Type') || '').split(';')[0] || ''

    const contentTypeString = reqAcceptString.split(',')[0] || reqContentTypeString || '';
    
    let requestedResultType: FibApp.FibAppReqResourceType = 'json'
    let requestedPayloadType: FibApp.FibAppReqResourceHandlerType = 'unknown'

    switch (contentTypeString) {
        case 'application/graphql':
            requestedResultType = 'json'
            requestedPayloadType = 'graphql'
            break
        case 'application/json':
            requestedResultType = 'json'
            break
        case 'application/javascript':
        case 'text/javascript':
            requestedResultType = 'js'
            break
        case 'text/html':
        case 'text/xhtml':
            requestedResultType = 'html'
            break
        case 'text/css':
            requestedResultType = 'css'
            break
        default:
            requestedResultType = 'json'
            requestedPayloadType = requestedPayloadType || 'unknown'
            break
    }

    return {
        requestedResultType,
        requestedPayloadType
    }
}
