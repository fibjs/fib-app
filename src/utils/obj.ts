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