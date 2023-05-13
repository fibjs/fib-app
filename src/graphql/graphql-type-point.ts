/// <reference lib="es2020" />

const {
    GraphQLScalarType,
} = require('graphql');
const { Kind } = require('graphql/language');

type PointValue = { x: number; y: number };

function unwrapQuote(stringVal: string) {
    return stringVal.replace(/(?:^\'|\'$)/g, '')
}

function safeParsePoint(entry: string, input: any) {
    if (!input) return null;

    let result = null as null | PointValue;
    let pointObj = null as null | PointValue;

    if (typeof input === 'string') {
        // trim `'` at start and end
        input = unwrapQuote(input);
        pointObj = JSON.parse(input);
    } else if (typeof input === 'object') {
        pointObj = { x: input.x, y: input.y };
    }
    
    if (pointObj) {
        result = <PointValue>{};
        result.x = Number(pointObj.x);
        result.y = Number(pointObj.y);
    }

    return result;
}

function parseLiteral(ast: any): PointValue | null {
    if (ast.kind === Kind.STRING) {
        return safeParsePoint('parseLiteral', ast.value);
    } else if (ast.kind === Kind.OBJECT) {
        return {
            x: ast.value.x,
            y: ast.value.y
        }
    }
}

const GraphQLPoint = new GraphQLScalarType({
    name: 'Point',
    description: 'The `Point` type represents object with shape { x: number; y: number }',
    serialize: safeParsePoint.bind(null, 'serialize'),
    parseValue: safeParsePoint.bind(null, 'parseValue'),
    parseLiteral: parseLiteral,
});

export default GraphQLPoint;