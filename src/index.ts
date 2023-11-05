import App from './app';

// for compability
exports = module.exports = App;

export default App;

import type { FibApp } from './Typo/app';

export { FibApp };

export function defineAppModel<T = any>(definition: FibApp.FibAppOrmDefineFn<T>) {
    return definition;
};

export { makeCustomizeApiRoute } from './http/customize';