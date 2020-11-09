import util = require('util')
import { FibAppACL } from '../Typo/acl';
import { FibApp } from '../Typo/app';

function mergeResponseHeaders (req: FibApp.FibAppReq, headers: any = null) {
    if (headers && typeof headers === 'object') {
        req.response_headers = util.extend({}, headers, req.response_headers)
    }
}

export function setup (app: FibApp.FibAppClass) {
    app.viewApi = app.viewApi || {} as FibApp.FibAppInternalViewApis

    app.viewApi.get = function (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType): FibApp.FibAppModelViewFunctionResponse {
        const { handler = null, static: _static = false, response_headers = null } = parseFibAppOrmModelViewFunctionDefinition(cls.viewFunctions[id] || cls.viewFunctions.get) || {};
        mergeResponseHeaders(req, response_headers)

        let result = _static ? null : app.api.get.apply(app.api, Array.prototype.slice.call(arguments))

        return handler && handler(result, req, buildModelViewFunctionInfo(cls.model_name, id)) || result
    }

    app.viewApi.find = function (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel): FibApp.FibAppModelViewFunctionResponse {
        const { handler = null, static: _static = false, response_headers = null } = parseFibAppOrmModelViewFunctionDefinition(cls.viewFunctions.find) || {};
        mergeResponseHeaders(req, response_headers)

        let result = _static ? null : app.api.find.apply(app.api, Array.prototype.slice.call(arguments))

        return handler && handler(result, req, buildModelViewFunctionInfo(cls.model_name)) || result
    }

    app.viewApi.eget = function (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType, rid?: FibApp.AppIdType) {
        const { handler = null, static: _static = false, response_headers = null } = parseFibAppOrmModelViewFunctionDefinition(cls.viewFunctions.eget) || {};
        mergeResponseHeaders(req, response_headers)

        let result = _static ? null : app.api.eget.apply(app.api, Array.prototype.slice.call(arguments))

        return handler && handler(result, req, buildModelViewFunctionInfo(cls.model_name, id, extend, rid)) || result
    }

    app.viewApi.efind = function (req: FibApp.FibAppReq, orm: FibApp.FibAppORM, cls: FibApp.FibAppORMModel, id: FibApp.AppIdType, extend: FibAppACL.ACLExtendModelNameType) {
        const { handler = null, static: _static = false, response_headers = null } = parseFibAppOrmModelViewFunctionDefinition(cls.viewFunctions.efind) || {};
        mergeResponseHeaders(req, response_headers)

        let result = _static ? null : app.api.efind.apply(app.api, Array.prototype.slice.call(arguments))

        return handler && handler(result, req, buildModelViewFunctionInfo(cls.model_name, id, extend)) || result
    }
}

function buildModelViewFunctionInfo (base: string, id?: FibApp.AppIdType, extend?: string, ext_id?: FibApp.AppIdType): FibApp.FibAppOrmModelViewFunctionRequestInfo {
    return {
        base,
        id,
        extend,
        ext_id
    }
}

function defaultViewFunctionHandler () {
    return {
        success: 'This is default handler of viewFunction'
    }
}
function parseFibAppOrmModelViewFunctionDefinition (def: FibApp.FibAppOrmModelViewFunctionDefinition): FibApp.FibAppOrmModelViewFunctionDefOptions {
    switch (typeof def) {
        case 'function':
            def = {
                static: false,
                handler: def,
                response_headers: null
            } as FibApp.FibAppOrmModelViewFunctionDefOptions
            break
        case 'object':
            def.static = !!def.static
            def.handler = typeof def.handler === 'function' ? def.handler : defaultViewFunctionHandler
            def.response_headers = def.response_headers
            break
    }

    return def
}
