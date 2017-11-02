var infos = {
    "4000001": "${method} request don't send any data.",
    "4000002": "The data uploaded in the request is not legal JSON data.",
    "4000003": "'where' in the query is not legal JSON data.",
    "4000004": "The data requested by 'batch' must be an array.",
    "4030001": "The operation isn’t allowed for clients due to class-level permissions.",
    "4040001": "Missing or invalid classname '${classname}'.",
    "4040002": "Object '${id}' not found in class '${classname}'.",
    "4040003": "'${relation}' in class '${classname}' does not support this operation",
    "4040004": "Function '${function}' not found in class '${classname}'.",
    "5000002": "Function '${function}' in class '${classname}' throws error, please contact the administrator."
};

module.exports = (no, data, clsid) => ({
    error: {
        code: no,
        cls: clsid,
        message: infos[no].replace(/\${(.+?)}/g, (s1, s2) => data[s2])
    }
});