/// <reference lib="es2020" />

const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');

const MAX_LONG = Number.MAX_SAFE_INTEGER;
const MIN_LONG = Number.MIN_SAFE_INTEGER;

function coerceLong(value: any): number {
    if (value === '') {
        throw new TypeError(
            'Long cannot represent non 52-bit signed integer value: (empty string)',
        );
    }
    const num = Number(value);
    if (num === num && num <= MAX_LONG && num >= MIN_LONG) {
        return num < 0 ? Math.ceil(num) : Math.floor(num);
    }

    throw new TypeError(
        'Long cannot represent non 52-bit signed integer value: ' + String(value),
    );
}

function parseLiteral(ast: any): number | null {
    if (ast.kind === Kind.INT) {
        const num = parseInt(ast.value, 10);
        if (num <= MAX_LONG && num >= MIN_LONG) {
            return num;
        }
        return null;
    }
}

const GraphQLLong = new GraphQLScalarType({
    name: 'Long',
    description: 'The `Long` scalar type represents 52-bit integers',
    serialize: coerceLong,
    parseValue: coerceLong,
    parseLiteral: parseLiteral,
});

export default GraphQLLong;