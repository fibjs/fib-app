var infos = {
    "4000001": "${method} request don't send any data.",
    "4000002": "The data uploaded in the request is not legal JSON data.",
    "4000003": "'where' in the query is not legal JSON data.",
    "4000004": "The data requested by 'batch' must be an array.",
    "4030001": "The operation isn’t allowed to '${classname}' for clients due to class-level permissions.",
    "4040001": "Missing or invalid classname '${classname}'.",
    "4040002": "Object '${id}' not found in class '${classname}'.",
    "4040003": "'${extend}' in class '${classname}' does not support this operation",
    "4040004": "Function '${function}' not found in class '${classname}'.",
    "4040005": "'${extend}' in class '${classname}' expected with extra props, but no valid extra data provided.",
    "5000002": "Function '${function}' in class '${classname}' throws error '${message}', please contact the administrator."
};


export class APPError extends Error implements FibApp.FibAppFinalError {
    name: string = 'APPError';
    
    code: number;
    message: string;
    cls?: FibApp.FibModelCountTypeMACRO;
    
    constructor (code: number, message: string, cls?: FibApp.FibModelCountTypeMACRO) {
        super();
        Error.call(this);
        (Error as any).captureStackTrace(this, this.constructor);

        this.message = message;
        this.code = code;
        this.cls = cls;
    }

    toString () {
        return this.code + ': ' + this.message;
    }
}

APPError.prototype = Object.create(Error.prototype);
APPError.prototype.constructor = APPError;
APPError.prototype.name = 'APPError';
APPError.prototype.toString = function () {
    return this.code + ': ' + this.message;
}

export function err_info(code: number, data?: object, cls?: FibApp.FibModelCountTypeMACRO): FibApp.FibAppResponse {
    return {
        error: new APPError(code, infos[code].replace(/\${(.+?)}/g, (s1, s2) => data[s2]), cls)
    }
};

export function fill_error(req: FibApp.FibAppHttpRequest, e: FibApp.FibAppResponse): void {
    var code = e.error.code;

    req.response.statusCode = code / 10000;
    req.response.json({
        code: e.error.cls ? code + e.error.cls * 100 : code,
        message: e.error.message
    });
}

export function render_error(req: FibApp.FibAppHttpRequest, e: FibApp.FibAppResponse, renderFunction?: any): void {
    var code = e.error.code;

    req.response.statusCode = code / 10000;
    const errInfo = {
        code: e.error.cls ? code + e.error.cls * 100 : code,
        message: e.error.message
    }
    if (typeof renderFunction !== 'function') {
        renderFunction = x => JSON.stringify(errInfo)
    }
    
    req.response.write(renderFunction(errInfo));
}
