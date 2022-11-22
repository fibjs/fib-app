import { expectType } from 'ts-expect';

import App from '../../';

expectType<App>(new App('test', {}));