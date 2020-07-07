const fetch = require('node-fetch');
const GraphQL = require('graphql-request');

const merge = require('lodash/merge');

const errorMiddleware = require('./utils/errorMiddleware');
const handleApiError = require('./utils/handleApiError');

const UnreachableError = require('./errors/UnreachableError')

function getProjects(config){

    return requestGraphQL(config, `
        query {
            viewer {
                allProjects {
                    items {
                        id
                        title
                        localizations {
                            items {
                                id
                                locale {
                                    id
                                    title
                                }
                            }
                        }
                    }
                }
            }
        }
    `).then(response => response.viewer.allProjects.items);
}

function importStrings(config, data){

    return requestGraphQL(config, `
        mutation ($projectId: ID!, $locale: String!, $create: [ImportStringCreateInput], $update: [ImportStringUpdateInput], $delete: [ImportStringDeleteInput]) {

            importStrings(projectId: $projectId, locale: $locale, create: $create, update: $update, delete: $delete)
        }
    `, data)
}

function exportStrings(config, projectId, locale, format){

    return requestApi(config, 'GET', `file/export/${projectId}/${locale}/${format}`).then(res => res.text());
}

function inspectStrings(config, projectId, locale, format, body){

    return requestApi(config, 'POST', `file/inspect/${projectId}/${locale}/${format}`, {
        body,
        headers: {
            'Content-Type': 'text/plain'
        }
    }).then(res => res.json());
}

function requestApi(config, method, path, options={}){

    const fullUrl = `${config.apiUrl}/${path}`;

    return fetch(fullUrl, merge({
        method,
        headers: {
            'Authorization': `Bearer ${config.token}`
        }
    }, options))
        .catch(() => {
            throw new UnreachableError();
        })
        .then(errorMiddleware);
}

function requestGraphQL(config, query, variables){

    const url = `${config.apiUrl}/graphql`;

    const client = new GraphQL.GraphQLClient(url, {
        headers: {
            Authorization: `Bearer ${config.token}`
        }
    });

    return client.request(query, variables).catch((e) => {

        if(e.response){
            handleApiError(e.response);
        }

        throw new UnreachableError();
    });
}

module.exports = {
    getProjects, exportStrings, inspectStrings, importStrings
};