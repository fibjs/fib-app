export function addHiddenProperty<T = any>(obj: Fibjs.AnyObject, p: string, v: T) {
	Object.defineProperty(obj, p, {
		value: v,
		writable: true,
		enumerable: false
	});
}
export function addReadonlyHiddenProperty<T = any>(obj: Fibjs.AnyObject, p: string, getter: (...args: any) => T) {
	Object.defineProperty(obj, p, {
		get: getter,
		enumerable: false
	});
}

/**
 * @description for point from sqlite, which stored as text actually
 */
export function unwrapQuote(stringVal: string) {
	return stringVal.replace(/(?:^\'|\'$)/g, '')
}

export function safeParseJson<T extends object>(input: string | T, fallbackValue: any = {}): T {
	if (typeof input !== 'string') {
		return input;
	}

	try {
		input = unwrapQuote(input);
		return JSON.parse(input);
	} catch (e) {
		return fallbackValue;
	}
}