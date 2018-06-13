/// <reference path="common.d.ts" />

// type ReqOperatorString = 'like' | 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'not_like' | 'not_in'
type ReqWhereOpInTypeType = string | number

type SimpleReqWhereOperation_eq = {
    [key: string]: any
}

type ReqWhereOperation_eq = SimpleReqWhereOperation_eq | {
    [key: string]: {
        "eq": any
    }
}
type ReqWhereOperation_ne = {
    [key: string]: {
        "ne": any
    }
}
type ReqWhereOperation_gt = {
    [key: string]: {
        "gt": number
    }
}
type ReqWhereOperation_gte = {
    [key: string]: {
        "gte": number
    }
}
type ReqWhereOperation_lt = {
    [key: string]: {
        "lt": number
    }
}
type ReqWhereOperation_lte = {
    [key: string]: {
        "lte": number
    }
}
type ReqWhereOperation_like = {
    [key: string]: {
        "like": string
    }
}
type ReqWhereOperation_not_like = {
    [key: string]: {
        "not_like": string
    }
}
type ReqWhereOperation_between = {
    [key: string]: {
        "between": [number, number]
    }
}
type ReqWhereOperation_not_between = {
    [key: string]: {
        "not_between": [number, number]
    }
}

type ReqWhereOperation_in = {
    [key: string]: {
        "in": ReqWhereOpInTypeType[]
    }
}
type ReqWhereOperation_not_in = {
    [key: string]: {
        "not_in": ReqWhereOpInTypeType[]
    }
}

type ReqWhereOperationAtomicType = 
    ReqWhereOperation_eq | 
    ReqWhereOperation_ne | 
    ReqWhereOperation_gt | 
    ReqWhereOperation_gte | 
    ReqWhereOperation_lt | 
    ReqWhereOperation_lte | 
    ReqWhereOperation_like | 
    ReqWhereOperation_not_like | 
    ReqWhereOperation_between | 
    ReqWhereOperation_not_between | 
    ReqWhereOperation_in | 
    ReqWhereOperation_not_in

interface ReqWhere {
    [key: string]: ReqWhereOperationAtomicType
    or?: ReqWhereOperationAtomicType[]
}