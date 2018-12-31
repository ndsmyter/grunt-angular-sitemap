/*
 * grunt-angular-sitemap
 * https://github.com/ndsmyter/grunt-angular-sitemap
 *
 * Copyright (c) 2018 Nicolas De Smyter
 * Licensed under the GNU, General, Public, License, v3.0 licenses.
 */

'use strict';

module.exports = function (grunt) {

    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/*.js'
            ],
            options: {
                jshintrc: '.jshintrc',
                reporterOutput: 'out.txt'
            }
        },

        // Configuration to be run
        angular_sitemap: {
            default_options: {
                options: {
                    rootUrl: 'https://test.com/',
                    dest: 'dist',
                    ignore: [],
                    output: 'xml',
                    manual: []
                },
                expand: true,
                cwd: 'src',
                src: ['**/*.routes.ts']
            }
        }

    });

    grunt.loadTasks('tasks');

    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('default', ['jshint', 'angular_sitemap']);

};
