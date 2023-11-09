import App from './app';
export default App;
import type { FibApp } from './Typo/app';
export { FibApp };
export declare function defineAppModel<T = any>(definition: FibApp.FibAppOrmDefineFn<T>): FibApp.FibAppOrmDefineFn<T>;
export { makeCustomizeApiRoute } from './http/customize';
