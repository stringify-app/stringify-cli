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

function getLocalization(config, projectId, locale){

    const data = {
        projectId: projectId,
        locale: locale
    }

    return requestGraphQL(config, `
        query GetLocalization($projectId: ID!, $locale: String!) {
            viewer {
                findProjectLocalizationByLocale(projectId: $projectId, locale: $locale) {
                    id
                    version
                }
            }
        }
    `, data).then(response => response.viewer.findProjectLocalizationByLocale);
}

function importStrings(config, data){

    return requestGraphQL(config, `
        mutation ($projectId: ID!, $locale: String!, $save: [SaveStringInput], $delete: [DeleteStringInput]) {

            importStrings(projectId: $projectId, locale: $locale, save: $save, delete: $delete)
        }
    `, data)
}

function exportStrings(config, projectId, locale, format){

    return requestApi(config, 'GET', `file/export/${projectId}/${locale}/${format}`).then(res => {
        return res.text().catch(() => handleApiError(null))
    })
}

function inspectStrings(config, projectId, locale, format, body, referenceVersion=null){

    let url = `file/inspect/${projectId}/${locale}/${format}`;

    if(referenceVersion !== null){
        url += `/${referenceVersion}`
    }

    return requestApi(config, 'POST', url, {
        body,
        headers: {
            'Content-Type': 'text/plain'
        }
    }).then(res => {
        return res.json().catch(() => handleApiError(null))
    })
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
    getProjects, exportStrings, inspectStrings, importStrings, getLocalization
};