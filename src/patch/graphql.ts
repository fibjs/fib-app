import util = require('util')
import graphql = require('graphql')

graphql.graphqlSync = util.sync(graphql.graphql, true);
export = graphql
