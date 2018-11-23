/// <reference path="../../@types/index.d.ts" />

const assert = require('assert');
const http = require('http');

import { graphqlRequest } from './utils'

export default (options: FibAppTest.FibAppTestHttpClientOptions): FibAppTest.FibAppTestHttpClient => {
    const appUrlBase = options.appUrlBase || options.serverBase || ''
    const apiUrlBase = options.apiUrlBase || appUrlBase
    const graphQlUrlBase = options.graphQlUrlBase || appUrlBase
    const modelName = options.modelName

    return {
        create: (obj) => {
            let rep = http.post(`${apiUrlBase}/${modelName}`, {
                json: obj
            });
            assert.equal(rep.statusCode, 201);

            if (!Array.isArray(obj)) {
                assert.property(rep.json(), 'id');
                return rep.json().id;
            } else {
                assert.isArray(rep.json());
                assert.property(rep.json()[0], 'id');
                return rep.json();
            }
        },
        get: (id) => {
            let rep = http.get(`${apiUrlBase}/${modelName}/${id}`);
            assert.equal(rep.statusCode, 200);
            assert.property(rep.json(), "id");
            return rep.json();
        },
        getByGraphQL: (id, fields = []) => {
            if (Array.isArray(fields)) {
                fields = transformFieldsList2GraphQLInnerString(fields)
            }
            
            let rep = graphqlRequest(
                graphQlUrlBase,
                `{
                    ${modelName}(id:"${id}"){
                        id
                        ${fields}
                    }
                }`
            );
            assert.equal(rep.statusCode, 200);
            return rep.json().data[modelName];
        },
        find: (whereCondition = "{}", queryObject = {}) => {
            if (typeof whereCondition === 'object') {
                whereCondition = JSON.stringify(whereCondition)
            }
            
            let rep = http.get(`${apiUrlBase}/${modelName}`, {
                query: {
                    where: whereCondition,
                    ...queryObject
                }
            });
            assert.equal(rep.statusCode, 200);
            assert.property(rep.json()[0], "id");
            return rep.json();
        },
        findByGraphQL: (whereCondition = "{}", fields = [], queryObject = {}) => {
            if (typeof whereCondition === 'object') {
                whereCondition = whereConditionObject2GraphQLConditionString(whereCondition)
            }

            if (Array.isArray(fields)) {
                fields = transformFieldsList2GraphQLInnerString(fields)
            }

            let res = graphqlRequest(
                graphQlUrlBase,
                `{
                    find_${modelName}(
                        where: {${whereCondition}}
                        ${queryObject2GraphQLConditionString(queryObject)}
                    ){
                        id
                        ${fields}
                    }
                }`
            );
    
            assert.equal(res.statusCode, 200);
            return res.json().data[`find_${modelName}`];
        },
        update: (id, obj) => {
            let rep = http.put(`${apiUrlBase}/${modelName}/${id}`, {
                json: obj
            });
            assert.equal(rep.statusCode, 200);
            assert.property(rep.json(), "id");
            return rep.json();
        },
        delete: (id) => {
            let rep = http.del(`${apiUrlBase}/${modelName}/${id}`);
            assert.equal(rep.statusCode, 200);
            assert.property(rep.json(), "id");
            return rep.json();
        },
        link: (id, ext_name: string, ext_id) => {
            let rep = http.put(`${apiUrlBase}/${modelName}/${id}/${ext_name}`, {
                json: {
                    id: ext_id
                }
            });

            assert.equal(rep.statusCode, 200);
            assert.property(rep.json(), "id");
            
            return rep.json();
        },
        unlink: (id, ext_name: string, ext_id) => {
            let rep = http.del(`${apiUrlBase}/${modelName}/${id}/${ext_name}/${ext_id}`, {
                json: {
                }
            });

            assert.equal(rep.statusCode, 200);
            assert.property(rep.json(), "id");
            
            return rep.json();
        },
        findExt: (id, ext_name: string, whereCondition) => {
            if (typeof whereCondition === 'object') {
                whereCondition = JSON.stringify(whereCondition)
            }

            let rep = http.get(`${apiUrlBase}/${modelName}/${id}/${ext_name}`, {
                query: {
                    ...whereCondition && { where: whereCondition }
                }
            });
            
            assert.equal(rep.statusCode, 200);
            const res = rep.json()
            if (Array.isArray(res)) {
                assert.property(res[0], "id");
            } else {
                assert.property(res, "id");
            }
            return rep.json();
        },
        createExt: (id, ext_name: string, edata: object) => {
            let rep = http.post(`${apiUrlBase}/${modelName}/${id}/${ext_name}`, {
                json: edata
            });

            assert.equal(rep.statusCode, 201);

            const res = rep.json()
            if (Array.isArray(res)) {
                assert.property(res[0], "id");
            } else {
                assert.property(res, "id");
            }
            return rep.json();
        },
        updateExt: (id, ext_name: string, edata: any) => {
            let rep = http.put(`${apiUrlBase}/${modelName}/${id}/${ext_name}/${edata.id}`, {
                json: {
                    id: edata.id
                }
            });
            
            assert.equal(rep.statusCode, 200);
            
            const res = rep.json()
            if (Array.isArray(res)) {
                assert.property(res[0], "id");
            } else {
                assert.property(res, "id");
            }
            return rep.json();
        }
    };
}

export function whereConditionObject2GraphQLConditionString (whereCondition) {
    whereCondition = Object.keys(whereCondition).map(key => {
        let value = whereCondition[key]
        switch (typeof value) {
            case 'boolean':
            case 'number':
                break
            case 'string':
                value = `"${value}"`
                break
        }
        return `${key}: ${value}`
    }).join('\n')

    return whereCondition
}

export function queryObject2GraphQLConditionString (queryObject) {
    queryObject = Object.keys(queryObject).map(key => {
        let value = queryObject[key]
        switch (typeof value) {
            case 'boolean':
            case 'number':
                break
            case 'string':
                value = `"${value}"`
                break
        }
        return `${key}: ${value}`
    }).join('\n')

    return queryObject
}

export function transformFieldsList2GraphQLInnerString (arr: any[] = []) {
    const result = arr.map(item => {
        if (typeof item === 'string') {
            return item
        }

        if (typeof item === 'object') {
            let {name = '', fields = []} = item || {}

            if (!name) return

            return `${name}{ \n${transformFieldsList2GraphQLInnerString(fields)} }`
        }
    }).filter(x => x).join('\n')

    return result
}
