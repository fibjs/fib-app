import { FibApp } from "../Typo/app";

export function is_graphql_request (request: FibApp.FibAppHttpRequest) {
    return (request.firstHeader('Content-Type') || '').split(';')[0].includes('application/graphql')
}

export function run_graphql (app: FibApp.FibAppClass, req: FibApp.FibAppHttpRequest) {
    app.dbPool((db: FibApp.FibAppORM) => {
        let data: FibApp.GraphQLQueryString = "";
        try {
            data = req.data.toString();
        } catch (e) {}

        req.response.json(db.graphql(data, req));
    });
}