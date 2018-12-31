# grunt-angular-sitemap

> Grunt plugin to generate a sitemap from an Angular project

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-angular-sitemap --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-angular-sitemap');
```

## The "angular_sitemap" task

### Overview
In your project's Gruntfile, add a section named `angular_sitemap` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  angular_sitemap: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.rootUrl
Type: `String`
Default value: `https://test.com`

The root URL that will be used to start the URLs in the sitemap with.

#### options.dest
Type: `String`
Default value: `dist`

The destination folder in which the sitemaps will be generated.

#### options.ignore
Type: `Array`
Default value: `[]`

The list of paths that will be ignored from the final sitemap.
This can be used to make sure some private URLs don't get any public attention.

#### options.output
Type: `String`
Default value: `txt`

Choose the output format of the sitemap.
The supported formats are `txt` or `xml`.

#### options.ignore
Type: `Array`
Default value: `[]`

The list of paths that will be ignored from the final sitemap.
This can be used to make sure some private URLs don't get any public attention.

#### options.manual
Type: `Array`
Default value: `xml`

The list of paths that will be manually added to the final sitemap.
This is the best choice to add some URLs that are not actually in the Angular project,
but should be in the sitemap.


### Usage Examples

#### Default Options
The default options will generate an XML sitemap in the `dist` folder.
Don't forget to pass a list of route files to the plugin.

```js
grunt.initConfig({
  angular_sitemap: {
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
  },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.
Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
1.0 First version with some basic options
