import { FxOrmNS } from '@fxjs/orm';
export default function (orm: FxOrmNS.ORM, plugin_opts: {
    enable: boolean;
}): FxOrmNS.Plugin;
