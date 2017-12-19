var infos = {
    "4000001": "${method} request don't send any data.",
    "4000002": "The data uploaded in the request is not legal JSON data.",
    "4000003": "'where' in the query is not legal JSON data.",
    "4000004": "The data requested by 'batch' must be an array.",
    "4030001": "The operation isn’t allowed for clients due to class-level permissions.",
    "4040001": "Missing or invalid classname '${classname}'.",
    "4040002": "Object '${id}' not found in class '${classname}'.",
    "4040003": "'${extend}' in class '${classname}' does not support this operation",
    "4040004": "Function '${function}' not found in class '${classname}'.",
    "5000002": "Function '${function}' in class '${classname}' throws error '${message}', please contact the administrator."
};

function APPError(code, message, cls) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);

    this.message = message;
    this.code = code;
    this.cls = cls;
}

APPError.prototype = Object.create(Error.prototype);
APPError.prototype.constructor = APPError;
APPError.prototype.name = 'APPError';
APPError.prototype.toString = function () {
    return this.code + ': ' + this.message;
}

module.exports = (code, data, cls) => ({
    error: new APPError(code, infos[code].replace(/\${(.+?)}/g, (s1, s2) => data[s2]), cls)
});