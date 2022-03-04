/*
 * grunt-angular-sitemap
 * https://github.com/ndsmyter/grunt-angular-sitemap
 *
 * Copyright (c) 2018 Nicolas De Smyter
 * Licensed under the GNU, General, Public, License, v3.0 licenses.
 */

'use strict';

module.exports = function (grunt) {
    const stringSimilarity = require('string-similarity');
    const xmlbuilder = require('xmlbuilder');

    grunt.file.defaultEncoding = 'utf8';

    /**
     * Link files as good as possible. This is an experimental method and can sometimes show errors.
     * @param document The document that contains the current links and should be linked together
     */
    function linkFiles(document) {
        grunt.log.writeln('Link the files together...');
        const keys = Object.keys(document);
        const referenced = [];
        for (let j = 0; j < keys.length; j++) {
            const pathObjects = document[keys[j]];
            for (let k = 0; k < pathObjects.length; k++) {
                const pathObject = pathObjects[k];
                if (pathObject.hasOwnProperty('reference')) {
                    let bestMatchObject = stringSimilarity.findBestMatch(pathObject.reference, keys);
                    if (!pathObject.hasOwnProperty('children')) {
                        pathObject.children = [];
                    }
                    let bestMatch = bestMatchObject.bestMatch.target;
                    pathObject.children.push(document[bestMatch]);
                    // Mark the reference for deletion
                    referenced.push(bestMatch);
                }
            }
        }
        grunt.log.writeln('Removing obsolete objects...');
        for (let l = 0; l < referenced.length; l++) {
            delete document[referenced[l]];
        }
    }

    /**
     * Recursively convert all the objects of the document to 1 list of paths
     * @param rootPath the root path that is recursively passed through
     * @param objectArray the list of objects that is being converted
     * @param indexList the final list of paths
     */
    function toPaths(rootPath, objectArray, indexList) {
        Object
            .keys(objectArray)
            .map(key => objectArray[key])
            .map(object => {
                object.forEach(objectElement => {
                    let childPath = rootPath + '/' + objectElement.path;
                    indexList.push(childPath);
                    if (objectElement.hasOwnProperty('children')) {
                        toPaths(childPath, objectElement.children, indexList);
                    }
                });
            });
    }

    /**
     * Clean the paths using the given options. Cleaning means (among others): adding the manual paths, removing all trailing slashes, removing '/**',
     * removing all parameters, removing all ignored paths etc.
     * @param indexList the index list that needs to be cleaned
     * @param options the options that give more information on how to clean the paths
     * @return {*} the cleaned up list.
     */
    function cleanPaths(indexList, options) {
        grunt.log.writeln('Cleanup paths');
        const ignoredUrls = options.ignore.map(url => (url.substring(0, 1) !== '/' ? '/' : '') + url);
        return indexList
        // Add manual paths
            .concat(options.manual)
            .map(value => {
                const index = value.indexOf(':');
                return index >= 0 ? value.substring(0, index) : value;
            })
            .map(value => value.slice(-1) === '/' ? value.substring(0, value.length - 1) : value)
            .map(value => value.replace('/**', ''))
            .map(value => value.length === 0 ? '/' : value)
            // Make the list unique
            .sort()
            .filter((value, index, array) => index === 0 || value !== array[index - 1])
            // Remove ignored paths
            .filter((el) => !ignoredUrls.includes(el));
    }

    function fetchInformation(files, document) {
        grunt.log.writeln('Fetching all information from the files...');
        for (let i = 0; i < files.length; i++) {
            const filePath = files[i];
            grunt.log.writeln('\tParsing ' + filePath);
            const contents = grunt.file.read(filePath);

            // First parse the final components
            let pattern = /path\s*:\s*['"]([^'"]*)['"]\s*,\s*component\s*:/g;
            let match = pattern.exec(contents);
            while (match != null) {
                if (document[filePath] === undefined) {
                    document[filePath] = [];
                }
                document[filePath].push({path: match[1]});
                match = pattern.exec(contents);
            }

            // Second find the links between the route files
            pattern = /path\s*:\s*['"]([^'"]*)['"]\s*,\s*loadChildren.*import\(['"]([^'"]*)['"]/g;
            match = pattern.exec(contents);
            while (match != null) {
                if (document[filePath] === undefined) {
                    document[filePath] = [];
                }
                document[filePath].push({path: match[1], reference: match[2]});
                match = pattern.exec(contents);
            }
        }
    }

    function writeToTxt(indexList, destinationFolder, urls) {
        const filePath = destinationFolder + 'sitemap.txt';
        grunt.file.write(filePath, urls.join(grunt.util.linefeed));
        grunt.log.writeln('Sitemap written to ' + filePath);
    }

    function writeToXml(indexList, destinationFolder, urls) {
        const xml = xmlbuilder.create('urlset', {encoding: 'utf-8'});
        xml.att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');
        xml.att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
        xml.att('xsi:schemaLocation', 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd');
        xml.com('Automatically generated using angular_sitemap on ' + new Date().toISOString());
        xml.com('sitemap-generator-url="https://github.com/ndsmyter/grunt-angular-sitemap"');
        xml.com('generated-on="' + new Date().toISOString() + '"');
        urls.forEach(url => xml.ele('url').ele('loc', url));

        const filePath = destinationFolder + 'sitemap.xml';
        grunt.file.write(filePath, xml.end({pretty: true}));
        grunt.log.writeln('Sitemap written to ' + filePath);
    }

    grunt.registerMultiTask('angular_sitemap', 'Grunt plugin to generate a sitemap from an Angular project', function () {
        const options = this.options({
            rootUrl: 'https://test.com/',
            dest: 'dist',
            ignore: [],
            output: 'xml',
            manual: []
        });

        if (options.rootUrl.slice(-1) === '/') {
            // Make sure the url doesn't end in a slash
            options.rootUrl.substring(0, options.rootUrl.length - 1);
        }
        if (options.dest.slice(-1) !== '/') {
            // Make sure the dest ends in a slash
            options.dest += '/';
        }

        const document = {};

        const files = [].concat.apply([], this.files.map(file => file.src));
        fetchInformation(files, document);

        // Algorithm to combine the cross-references of the route files
        linkFiles(document);

        grunt.log.writeln('Converting objects to paths...');
        let indexList = [];
        toPaths('', document, indexList);

        indexList = cleanPaths(indexList, options);

        const urls = [''].concat(indexList).map(url => options.rootUrl + url);
        if (options.output === 'txt') {
            writeToTxt(indexList, options.dest, urls);
        } else if (options.output === 'xml') {
            writeToXml(indexList, options.dest, urls);
        } else {
            grunt.log.error('Output format is not supported: ' + options.output);
        }
        return urls;
    });
};
