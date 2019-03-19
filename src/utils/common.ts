import util = require('util')

export function filterInstanceAsItsOwnShape<T = any, T2 = T> (
    inst: T | T[],
    mapper: (inst: T, idx?: number, arr?: any) => T2
): T2 | T2[] {
    const orig_isarr = Array.isArray(inst)

    const to_map = Array.isArray(inst) ? inst : [inst]

    const mapped = to_map.map(mapper)

    return orig_isarr ? mapped : mapped[0]
}

function get_map_to_result(/* all_map: boolean = false */) {

    return function (ro: FxOrmInstance.Instance) {
        // if (all_map) return ro

        return {
            id: ro.id,
            createdAt: ro.createdAt
        };
    }
}

export const map_to_result = get_map_to_result()

export function shallowCopy (data: object) {
    return util.extend({}, data)
}