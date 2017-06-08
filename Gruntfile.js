var path = require('path');
var fs = require("fs");
var exists = fs.existsSync || path.existsSync;
var async = require("async");
var through = require('through');

module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');
  grunt.initConfig({
    pkg: pkg,
    meta: {},
    jshint: {
      all: ['src/**/*.js'],
      options: {
        curly: true,
        eqeqeq: true,
        eqnull: true,
        sub: true,
        loopfunc: true
      }
    },
    concat: {
      lawnchair: {
        src: [
          "libs/lawnchair/lawnchair.js",
          "libs/lawnchair/lawnchairWindowNameStorageAdapter.js",
          "libs/lawnchair/lawnchairLocalStorageAdapter.js",
          "libs/lawnchair/lawnchairWebkitSqlAdapter.js",
          "libs/lawnchair/lawnchairIndexDbAdapter.js",
          "libs/lawnchair/lawnchairHtml5FileSystem.js",
          "libs/lawnchair/lawnchairMemoryAdapter.js"
        ],
        dest: "libs/generated/lawnchair.js"
      },
      crypto: {
        src:[
          "libs/cryptojs/cryptojs-core.js",
          "libs/cryptojs/cryptojs-enc-base64.js",
          "libs/cryptojs/cryptojs-cipher-core.js",
          "libs/cryptojs/cryptojs-aes.js",
          "libs/cryptojs/cryptojs-md5.js",
          "libs/cryptojs/cryptojs-sha1.js",
          "libs/cryptojs/cryptojs-x64-core.js",
          "libs/cryptojs/cryptojs-sha256.js",
          "libs/cryptojs/cryptojs-sha512.js",
          "libs/cryptojs/cryptojs-sha3.js"
        ],
        dest: "libs/generated/crypto.js"
      }
    },
    'mocha_phantomjs': {
      test: {
        options: {
          urls: [
            "http://127.0.0.1:8200/test/browser/index.html?url=http://localhost:9999",
          ]
        }
      },
      test_coverage: {
        options:{
          reporter: "json-cov",
          file: 'rep/coverage.json',
          urls: [
            "http://127.0.0.1:8200/test/browser/index.html?url=http://localhost:9999&coverage=1"
          ]
        }
      }
    },
    connect: {
      server: {
        options: {
          hostname: "*",
          port: 8200,
          base: '.'
        }
      }
    },
    browserify: {
      // This browserify build be used by users of the module. It contains a
      // UMD (universal module definition) and can be used via an AMD module
      // loader like RequireJS or by simply placing a script tag in the page,
      // which registers fhsync as a global var (the module itself registers as $fh.sync as well).
      dist:{
        //shim is defined inside package.json
        src:['src/index.js'],
        dest: 'dist/fh-sync.js',
        options: {
          standalone: 'fhsync'
        }
      },
      // This browserify build can be required by other browserify  that
      // have been created with an --external parameter.
      require: {
        src:['src/index.js'],
        dest: 'test/browser/fh-sync-latest-require.js',
        options: {
          alias:['./src/sync-client.js']
        }
      },
      // These are the browserified tests. We need to browserify the tests to be
      // able to run the mocha tests while writing the tests as clean, simple
      // CommonJS mocha tests (that is, without cross-platform boilerplate
      // code). This build will also include the testing libs chai, sinon and
      // sinon-chai but must not include the module under test.
      test: {
        src: [ './test/browser/suite.js' ],
        dest: './test/browser/browserified_tests.js',
        options: {
          external: [ './src/index.js' ],
          // Embed source map for tests
          debug: true
        }
      },
    },
    watch: {
      browserify: {
        files: ['src/**/*.js', 'test/tests/*.js'],
        tasks: ['browserify'],
        options: {
          spawn: false
        }
      }
    },
    uglify: {
      dist: {
        "files": {
          'dist/fh-sync.min.js': ['dist/fh-sync.js'],
        }
      }
    },
  });

  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-text-replace');

  //run tests in phatomjs
  grunt.registerTask('test', ['jshint:all', 'browserify:dist', 'browserify:require', 'browserify:test', 'connect:server', 'mocha_phantomjs:test']);

    grunt.registerTask('concat-core-sdk', ['jshint',  'concat:lawnchair', 'concat:crypto', 'browserify:dist']);


  grunt.registerTask('default', ['jshint', 'concat-core-sdk', 'test','uglify:dist']);
};
