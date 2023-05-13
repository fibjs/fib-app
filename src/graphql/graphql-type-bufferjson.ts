/// <reference lib="es2020" />

import { safeParseJson } from "../utils/obj";

const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');

function parseValue(entry: string, value: any) {
  if (typeof value === 'object' && value.type === 'Buffer') {
    return value.data.toArray();
  } else if (Buffer.isBuffer(value)) {
    const maybeJsonText = value.toString('utf8');
    let bufObj: any;

    if (maybeJsonText?.includes("`type` = 'Buffer'")) { // mysql without transform from @fxjs/orm <= 1.16.4
      const [, values] = maybeJsonText.match(/`data` = \((.*)\)/);
      const buf = Buffer.from(values.split(', ') as any);
      return buf;
    } else if (
      (bufObj = safeParseJson<any>(maybeJsonText))
      && bufObj?.type === 'Buffer'
      && Array.isArray(bufObj.data)
    ) { // sqlite, postgres
      return Buffer.from(bufObj.data);
    } else {
      return value;
    }
  }

  return value;
}

// parse like json
function parseLiteral(ast: any): any {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT: {
        const value = Object.create(null);
        ast.fields.forEach(function (field: any) {
          value[field.name.value] = parseLiteral(field.value);
        });

        return value;
      }
    case Kind.LIST:
      return ast.values.map(parseLiteral);
    default:
      return null;
  }
}

const GraphQLBufferJson = new GraphQLScalarType({
  name: 'BufferJson',
  description:
    'The `BufferJson` type represents a buffer containing binary data, it can be a Buffer/ArrayBuffer or an Array/TypedArray containing binary data',
  serialize: parseValue.bind(null, 'serialize'),
  parseValue: parseValue.bind(null, 'parseValue'),
  parseLiteral: parseLiteral,
});

export default GraphQLBufferJson;