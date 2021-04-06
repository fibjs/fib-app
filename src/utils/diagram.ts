import { FibApp } from "../Typo/app";

const NO_GRAPHQL_COLOR = 'lightgray'// '#ec8888'

export = function () {
    var nomnoml = require('nomnoml');

    const models: string[] = [];
    const exts: string[] = [];

    this.db((db: FibApp.FibAppORM) => {
        let m: FibApp.FibAppORMModel;
        let ks: string[];

        for (const name in db.models) {
            m = db.models[name];
            ks = [];
            for (const k in m.properties) {
                ks.push(`+ ${k} : ${m.properties[k].type}`);
            }

            const is_nographql = m.no_graphql
            models.push(`[${is_nographql? "<nographql>" : ""}${m.model_name}|${ks.join(';')}]`);
            for (const e in m.associations) {
                const assoc_info = m.associations[e];
                const one = assoc_info.type === "hasOne" && !assoc_info.association.reversed;
                exts.push(`[${m.model_name}] ${assoc_info.association.name.replace(/_/g, '%5f')}${one ? "->" : "--:>" } [${assoc_info.association.model.model_name}]`);
            }
        }
    });

    const dot = `#lineWidth: 1.5
#font: Helvetica,sans-Serif
#fontSize: 10
#leading: 1.6
#fill: white
#.nographql: fill=${NO_GRAPHQL_COLOR}

${models.join('\n')}
${exts.join('\n')}
`;
    return nomnoml.renderSvg(dot).replace(/%5f/g, '_');
}
