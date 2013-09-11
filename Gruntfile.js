module.exports = function(grunt) {

    // usual suspects
    grunt.loadNpmTasks('grunt-contrib-uglify'); // todo : use the if(debug){} and deadcode removal
    grunt.loadNpmTasks('grunt-contrib-jshint'); // promises...
    grunt.loadNpmTasks('grunt-contrib-qunit'); // todo: separate gl dependant test and pure js tests, add visual diff, have a mock gl context ?
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.loadNpmTasks('grunt-contrib-compress'); // get idea of compressed server size in gz
    grunt.loadNpmTasks('grunt-contrib-copy'); // copy file builds
    grunt.loadNpmTasks('grunt-strip'); // remove console.log, etc

    // benchmarks
    //grunt.loadNpmTasks('grunt-benchmark');
    //
    //
    grunt.loadTasks('tasks');
    /********* using patched version from tasks folder
     // convert to amd (requirejs like) module
     //grunt.loadNpmTasks('grunt-wrap');
     //grunt.loadNpmTasks('grunt-jsvalidate');
     */

    // non patched
    // faster build using parallel task
    //grunt.loadNpmTasks('grunt-glslvalidator'); // GL shader validator sublime plugin ?
    //grunt.loadNpmTasks('grunt-glsloptimizer'); // @aras_p  glsl optimizer
    //grunt.loadNpmTasks('grunt-glslmin'); // just min


    // docs
    grunt.loadNpmTasks('grunt-plato'); // bug prediction
    grunt.loadNpmTasks('grunt-docco'); // nice docs. https://bitbucket.org/doklovic_atlassian/atlassian-docco/wiki/writing-docco-comments

    // chrome dev tool for grunt
    //grunt.loadNpmTasks('grunt-devtools');
    //


    // project files
    var projectJson = grunt.file.read("project.json");
    var project = JSON.parse(projectJson);

    // Project configuration
    grunt.initConfig({
	pkg: grunt.file.readJSON('package.json'),
	meta: {
	    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %>\n' + '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' + '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' + ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
	},
	jshint: {
	    options: {
		// http://www.jshint.com/docs/
		// Enforcing Options:
		curly: false,
		eqeqeq: false,
		//eqeqeq: true, <= TODO: lots of cleaning
		immed: false,
		//immed: true, <= TODO: lots of cleaning
		latedef: true,
		noarg: true,
		sub: true,
		undef: false,
		//undef: true, <= TODO: lots of cleaning
		eqnull: true,
		browser: true,
		unused: false,
		//unused: true, <= TODO: lots of cleaning
		forin: true,
		camelcase: false,
		newcap: false,
		// Relaxing Options:
		loopfunc: true,
		evil: true,

		globals: {
		    gl: true,

		    osg: true,
		    osgDB: true,
		    osgGA: true,
		    osgUtil: true,
		    osgViewer: true,
		    osgAnimation: true,

		    WebGLDebugUtils: true,
		    WebGLUtils: true,

		    Stats: true,
		    performance: true,

		    WebGLRenderingContext: true,
		    WebGLBuffer: true,
		    WebGLRenderbuffer: true,
		    WebGLFramebuffer: true,
		    WebGLProgram: true,
		    WebGLTexture: true,
		    WebGLShader: true
		}
		//, force: true,
		//ignores: [
		//    'js/osgDB/Promise.js'
		//]
	    },
	    beforeconcat: [project.scripts],
	    afterconcat: 'build/<%= pkg.name %>-debug.js'
	},
	jsvalidate: {
	    options: {
		tolerant: true
	    },
	    main: {
		src: [project.scripts,
		      'examples/*/*.js',
		      'sandbox/*/*.js',
		      'test/*.js'
		     ]
	    }
	},
	qunit: {
	    options: {
		timeout: 10000
	    },
	    base: ['test/index.html']
	},
	concat: {
	    build: {
		src: ['<banner:meta.banner>', project.scripts],
		dest: 'build/<%= pkg.name %>-debug.js'
	    }
	},
	strip: {
	    main: {
		src: 'build/<%= pkg.name %>-debug.js',
		dest: 'build/<%= pkg.name %>.js',
		nodes: ['console', 'debug']
	    }
	},
	uglify: {
	    main: {
		options: {
		    //wrap: 'osgLib',// amd step
		    //exportAll: true,
		    beautify: false,
		    quote_keys: false,
		    sourceMap: 'build/source-map.js',
		    sourceMapPrefix: 1,
		    compressor: {
			sequences: true, // join consecutive statements with the “comma operator”
			properties: false, // optimize property access: a["foo"] → a.foo
			dead_code: false, // discard unreachable code
			drop_debugger: true, // discard “debugger” statements
			unsafe: true, // some unsafe optimizations (see below)
			conditionals: true, // optimize if-s and conditional expressions
			comparisons: true, // optimize comparisons
			evaluate: true, // evaluate constant expressions
			booleans: true, // optimize boolean expressions
			loops: true, // optimize loops
			unused: true, // drop unused variables/functions
			hoist_funs: true, // hoist function declarations
			hoist_vars: false, // hoist variable declarations
			if_return: true, // optimize if-s followed by return/continue
			join_vars: true, // join var declarations
			cascade: true, // try to cascade `right` into `left` in sequences
			side_effects: true, // drop side-effect-free statements
			warnings: true, // warn about potentially dangerous optimizations/code
			global_defs: {
			    //osg.debug: FALSE // will remove all code inside "if (osg.debug){..}"
			} // global definitions
		    },
		    mangle: {
			toplevel: false,
			except: ['osgViewer']
		    }
		},
		files: {
		    'build/<%= pkg.name %>.min.js': ['build/<%= pkg.name %>.js']
		}
	    }
	},
	compress: {
	    options: {
		archive: 'build/<%= pkg.name %>.min.js.gz',
		mode: 'gzip',
		pretty: true
	    },
	    main: {
		files: [{
		    src: 'build/<%= pkg.name %>.min.js',
		    dest: 'build/<%= pkg.name %>.min.js'
		}
		       ]
	    }
	},
	copy: {
	    min: {
		files: {
		    'build/<%= pkg.name %>-<%= pkg.version %>.js': 'build/<%= pkg.name %>.min.js'
		}
	    },
	    debug: {
		files: {
		    'build/<%= pkg.name %>-debug-<%= pkg.version %>.js': 'build/<%= pkg.name %>-debug.js'
		}
	    }
	},
	plato: {
	    options: {
		// Task-specific options go here.
	    },
	    main: {
		files: {
		    'docs/analysis': project.scripts
		}
	    }
	},
	docco: {
	    options: {
		//layout: 'parallel', //   'choose a layout (parallel, linear or classic'
		css: 'docs/docco/docco.css' //'use a custom css file'
		//template:  'docs/docco/mytemplace.jst',//'use a custom .jst template'
		//extension:  'js'//'assume a file extension for all inputs'
	    },
	    main: {
		src: project.scripts,
		options: {
		    output: 'docs/docco'
		}
	    }
	},
	wrap: { // wrap my modules with define
	    main: {
		files: ['build/<%= pkg.name %>.min.js'],
		dest: 'build',
		pathSep: '/',
		prefix: 'amd.',
		wrapper: ['define(["osg"], function () {\n', '\nreturn osg;});']
		// wrapper can also be a function, like so:
		//
		// wrapper: function(filepath, options) {
		//   // ...
		//   return ['define(function (require, exports, module) {\n', '\n});'];
		// }
	    },
            debug: {
                files: ['build/<%= pkg.name %>.js'],
                dest: 'build',
                pathSep: '/',
                prefix: 'amd.',
                wrapper: [
                    [
                        "(function () {",
                        "   var rootScope = this;",
                        "   var previousOSG = rootScope.OSG;",
                        "   var OSG;",
                        "   if (typeof exports !== 'undefined') {",
                        "      OSG = exports;",
                        "   } else {",
                        "      OSG = rootScope.OSG = {};",
                        "   }",
                        "   // Require Q, if we're on the server, and it's not already present.",
                        "   var Q = rootScope.Q;",
                        "   // if (!Q && (typeof require !== 'undefined')) Q = require('Q');",

                        "   OSG.noConflict = function() {",
                        "      rootScope.OSG = previousOSG;",
                        "      return this;",
                        "   };",
                        "",
                        ""
                    ].join('\n'),
                    [
                        '',
                        'OSG.osg = osg;',
                        'OSG.osgGA = osgGA;',
                        'OSG.osgDB = osgDB;',
                        'OSG.osgUtil = osgUtil;',
                        'OSG.osgViewer = osgViewer;',
                        '}).call(this);',
                        ''
                    ].join('\n')
                ]
            }
	},
	watch: {
	    syntax: {
		files: [project.scripts,
			'examples/*/*.js',
			'test/*.js'
		       ],
		tasks: ['jsvalidate', 'jshint:beforeconcat', 'build_debug']
	    }
	}
    });

    grunt.registerTask('gzTest', ['compress']);
    grunt.registerTask('release_side', ['docco', 'plato']);
    grunt.registerTask('release_main', ['jshint:beforeconcat', 'concat', 'jshint:afterconcat', 'strip', 'uglify', 'copy', 'wrap']);

    grunt.registerTask('release', ['release_main', 'release_side', 'gzTest']);

    grunt.registerTask('build_debug', ['jshint:beforeconcat', 'concat', 'copy:debug', 'wrap:debug']);
    grunt.registerTask('build_min', ['jshint:beforeconcat', 'concat', 'strip', 'uglify', 'copy']);
    grunt.registerTask('verify', ['jsvalidate', 'jshint:beforeconcat']);
    grunt.registerTask('default', ['verify', 'build_debug']);

};
