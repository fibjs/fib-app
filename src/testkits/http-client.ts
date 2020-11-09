const assert = require('assert');
const http = require('http');

import { FibApp } from '../Typo/app';
import { FibAppTest } from '../Typo/test';
import { graphqlRequest } from './utils'

export default (options: FibAppTest.FibAppTestHttpClientOptions): FibAppTest.FibAppTestHttpClient => {
    const appUrlBase = options.appUrlBase || options.serverBase || ''
    const apiUrlBase = options.apiUrlBase || appUrlBase
    const graphQlUrlBase = options.graphQlUrlBase || appUrlBase
    const modelName = options.modelName

    return {
        create: (obj: object) => {
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
        get: (id: FibApp.AppIdType) => {
            let rep = http.get(`${apiUrlBase}/${modelName}/${id}`);
            assert.equal(rep.statusCode, 200);
            assert.property(rep.json(), "id");
            return rep.json();
        },
        getByGraphQL: (id: FibApp.AppIdType, fields: string[] = []) => {
            if (Array.isArray(fields)) {
                fields = transform_fieldslist_2_graphql_inner_string(fields)
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
        findByGraphQL: (whereCondition = "{}", fields: string[] = [], queryObject = {}) => {
            if (typeof whereCondition === 'object') {
                whereCondition = whereConditionObject2GraphQLConditionString(whereCondition)
            }

            if (Array.isArray(fields)) {
                fields = transform_fieldslist_2_graphql_inner_string(fields)
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
        update: (id: FibApp.AppIdType, obj: object) => {
            let rep = http.put(`${apiUrlBase}/${modelName}/${id}`, {
                json: obj
            });
            assert.equal(rep.statusCode, 200);
            assert.property(rep.json(), "id");
            return rep.json();
        },
        delete: (id: FibApp.AppIdType) => {
            let rep = http.del(`${apiUrlBase}/${modelName}/${id}`);
            assert.equal(rep.statusCode, 200);
            assert.property(rep.json(), "id");
            return rep.json();
        },
        link: (id: FibApp.AppIdType, ext_name: string, ext_id: FibApp.AppIdType) => {
            let rep = http.put(`${apiUrlBase}/${modelName}/${id}/${ext_name}`, {
                json: {
                    id: ext_id
                }
            });

            assert.equal(rep.statusCode, 200);
            assert.property(rep.json(), "id");
            
            return rep.json();
        },
        unlink: (id: FibApp.AppIdType, ext_name: string, ext_id: FibApp.AppIdType) => {
            let rep = http.del(`${apiUrlBase}/${modelName}/${id}/${ext_name}/${ext_id}`, {
                json: {
                }
            });

            assert.equal(rep.statusCode, 200);
            assert.property(rep.json(), "id");
            
            return rep.json();
        },
        findExt: (id: FibApp.AppIdType, ext_name: string, whereCondition: Record<string, any> | string) => {
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
        createExt: (id: FibApp.AppIdType, ext_name: string, edata: object) => {
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
        updateExt: (id: FibApp.AppIdType, ext_name: string, edata: any) => {
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

export function whereConditionObject2GraphQLConditionString (whereCondition: Record<string, any>) {
    return Object.keys(whereCondition).map(key => {
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
}

export function queryObject2GraphQLConditionString (queryObject: Record<string, any>) {
    return Object.keys(queryObject).map(key => {
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
}

export function transform_fieldslist_2_graphql_inner_string (arr: any[] = []): any {
    const result = arr.map(item => {
        if (typeof item === 'string') {
            return item
        }

        if (typeof item === 'object') {
            let {name = '', fields = []} = item || {}

            if (!name) return

            return `${name}{ \n${transform_fieldslist_2_graphql_inner_string(fields)} }`
        }
    }).filter(x => x).join('\n')

    return result
}
