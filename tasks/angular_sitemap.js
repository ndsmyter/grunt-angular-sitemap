/*
 * grunt-angular-sitemap
 * https://github.com/ndsmyter/grunt-angular-sitemap
 *
 * Copyright (c) 2018 Nicolas De Smyter
 * Licensed under the GNU, General, Public, License, v3.0 licenses.
 */

'use strict';

module.exports = function (grunt) {
    const fs = require('fs');
    const stringSimilarity = require('string-similarity');

    grunt.file.defaultEncoding = 'utf8';

    grunt.registerMultiTask('angular_sitemap', 'Grunt plugin to generate a sitemap from an Angular project', function () {

        const options = this.options({
            ignore: []
        });

        const parsingDocument = {};

        const files = [].concat.apply([], this.files.map(file => file.src));
        grunt.log.writeln('Fetching all information from the files...');
        for (let i = 0; i < files.length; i++) {
            const filePath = files[i];
            grunt.log.writeln('\tParsing ' + filePath);
            const contents = fs.readFileSync(filePath, 'utf8');

            // First parse the final components
            let pattern = /path\s*:\s*['"]([^'"]*)['"]\s*,\s*component\s*:/g;
            let match = pattern.exec(contents);
            while (match != null) {
                if (parsingDocument[filePath] === undefined) {
                    parsingDocument[filePath] = [];
                }
                parsingDocument[filePath].push({path: match[1]});
                match = pattern.exec(contents);
            }

            // Second find the links between the route files
            pattern = /path\s*:\s*['"]([^'"]*)['"]\s*,\s*loadChildren\s*:\s*['"]([^'"]*)['"]/g;
            match = pattern.exec(contents);
            while (match != null) {
                if (parsingDocument[filePath] === undefined) {
                    parsingDocument[filePath] = [];
                }
                parsingDocument[filePath].push({path: match[1], reference: match[2]});
                match = pattern.exec(contents);
            }
        }

        // Algorithm to combine the cross references of the route files
        grunt.log.writeln('Link the files together...');
        const keys = Object.keys(parsingDocument);
        const referenced = [];
        for (let j = 0; j < keys.length; j++) {
            const pathObjects = parsingDocument[keys[j]];
            for (let k = 0; k < pathObjects.length; k++) {
                const pathObject = pathObjects[k];
                if (pathObject.hasOwnProperty('reference')) {
                    let bestMatchObject = stringSimilarity.findBestMatch(pathObject.reference, keys);
                    if (!pathObject.hasOwnProperty('children')) {
                        pathObject.children = [];
                    }
                    let bestMatch = bestMatchObject.bestMatch.target;
                    pathObject.children.push(parsingDocument[bestMatch]);
                    // Mark the reference for deletion
                    referenced.push(bestMatch);
                }
            }
        }
        grunt.log.writeln('Removing obsolete objects...');
        for (let l = 0; l < referenced.length; l++) {
            delete parsingDocument[referenced[l]];
        }

        grunt.log.writeln('Converting objects to paths');

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

        let indexList = [];
        toPaths('', parsingDocument, indexList);

        grunt.log.writeln('Cleanup paths');
        indexList = indexList
            .map(value => {
                const index = value.indexOf(':');
                return index >= 0 ? value.substr(0, index) : value;
            })
            .map(value => value.substr(-1) === '/' ? value.substring(0, value.length - 1) : value)
            .map(value => value.replace('/**', ''))
            .map(value => value.length === 0 ? '/' : value)
            // Make the list unique
            .sort()
            .filter((value, index, array) => index === 0 || value !== array[index - 1])
            .filter((el) => !options.ignore.includes(el));

        grunt.log.writeln('Paths: ' + indexList.join(', '));
    });

};

if (process.argv.length >= 2 && process.argv[2] === 'dev') {
    console.log('---- DEBUG MODE ENABLED ---');
    const grunt = {
        file: {},
        log: {writeln: console.log, error: console.error},
        registerMultiTask: function (name, description, func) {
            this[name] = func;
        }
    };
    module.exports(grunt);

    grunt.angular_sitemap();
}
