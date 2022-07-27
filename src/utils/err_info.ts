import { FibApp } from "../Typo/app";

const infos = {
    "4000001": "${method} request don't send any data.",
    "4000002": "The data uploaded in the request is not legal JSON data.",
    "4000003": "'where' in the query is not legal JSON data.",
    "4000004": "The data requested by 'batch' must be an array.",
    "4000005": "The Content-Type header in the request must include application/graphql.",
    "4000006": "'${key}' is forbidden in the query.where",
    "4000007": "'findby' in the query is not legal JSON data.",
    "4000008": "'${extend}' is forbidden for query.findby.extend",
    "4000009": "'${key}' is forbidden in the query[${extend}].where",
    "4030001": "The operation isn’t allowed to '${classname}' for clients due to class-level permissions.",
    "4030002": "The operation isn’t allowed to '${base_classname}.${ext_classname}' for clients due to class-level permissions.",
    "4040001": "Missing or invalid classname '${classname}'.",
    "4040002": "Object '${id}' not found in class '${classname}'.",
    "4040003": "'${extend}' in class '${classname}' does not support this operation",
    "4040004": "Function '${function}' not found in class '${classname}'.",
    "4040005": "'${extend}' in class '${classname}' expected with extra props, but no valid extra data provided.",
    "5000002": "Function '${function}' in class '${classname}' throws error '${message}', please contact the administrator.",
    "5000003": "viewFunction in class '${classname}' return invalid reponse with success or error, please contact the administrator.",
};

type TInfos = typeof infos;

export class APPError extends Error implements FibApp.FibAppFinalError {
    name: string = 'APPError';
    
    code: FibApp.FibAppFinalError['code'];
    message: string;
    cls?: FibApp.FibModelCountTypeMACRO;
    
    constructor (
        code: FibApp.FibAppFinalError['code'],
        message: string,
        cls?: FibApp.FibModelCountTypeMACRO
    ) {
        super(message);
        (Error as any).captureStackTrace(this, this.constructor);

        this.message = message;
        this.code = code;
        this.cls = cls;
    }

    toString () {
        return this.code + ': ' + this.message;
    }
}

export function err_info(
    code: keyof TInfos | number,
    data?: Fibjs.AnyObject,
    cls?: FibApp.FibModelCountTypeMACRO
): FibApp.FibAppErrorResponse {
    return {
        error: new APPError(
            code,
            make_err_message(code as any, data),
            cls
        )
    }
};

export function make_err_message (code: keyof TInfos, data: Record<string, any>) {
    return (infos[code as keyof TInfos] || '').replace(/\${(.+?)}/g, (_: any, s2: string) => data[s2]);
}

export function err_info_msg(
    code: keyof TInfos | number,
    msg?: string,
    cls?: FibApp.FibModelCountTypeMACRO
): FibApp.FibAppErrorResponse {
    return {
        error: new APPError(
            code,
            msg,
            cls
        )
    }
};

export function fill_error(
    req: FibApp.FibAppHttpRequest,
    e: FibApp.FibAppResponse
): void {
    var code = e.error.code;

    req.response.statusCode = (code as number) / 10000;
    req.response.json({
        code: e.error.cls ? (code as number) + e.error.cls * 100 : code,
        message: e.error.message
    });
}

export function render_error(req: FibApp.FibAppHttpRequest, e: FibApp.FibAppResponse, renderFunction?: any): void {
    var code = e.error.code;

    req.response.statusCode = (code as number) / 10000;
    const errInfo = {
        code: e.error.cls ? (code as number) + e.error.cls * 100 : code,
        message: e.error.message
    }
    if (typeof renderFunction !== 'function') {
        renderFunction = () => JSON.stringify(errInfo)
    }
    
    req.response.write(renderFunction(errInfo));
}
