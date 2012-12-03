module.exports = function(grunt) {

	var project = JSON.parse(grunt.file.read("project.json"));


	// Project configuration.
	grunt.initConfig({
		pkg: '<json:package.json>',
		meta: {
			banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %>\n' + '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' + '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' + ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
		},
		watch: {
			files: '<config:linter.files>',
			tasks: 'linter'
		},
		lint: {
			beforeconcat: project.scripts,
			afterconcat: 'build/<%= pkg.name %>-debug.js',
			jshint: {
				options: {
					curly: true,
					eqeqeq: true,
					immed: true,
					latedef: true,
					newcap: true,
					noarg: true,
					sub: true,
					undef: true,
					eqnull: true,
					browser: true,
					unused: true
				}
				//,
				//globals: {
				//	chrome: true
				//}
			}
		},
		jsvalidate: {
			files: project.scripts
		},
		qunit: {
			all: ['test/index.html']
		},
		concat: {
			build: {
				src:  ['<banner:meta.banner>', project.scripts],
				dest: 'build/<%= pkg.name %>-debug.js'
			}
		},
		strip: {
			main: {
				src: 'build/<%= pkg.name %>-debug.js',
				dest: 'build/<%= pkg.name %>.js'
			}
		},
		min: {
			build: {
				src: ['build/<%= pkg.name %>.js'],
				dest: 'build/<%= pkg.name %>.min.js'
			}
		},
		uglify: {
			mangle: {
				toplevel: false,
				except: ['osgViewer']
			},
			squeeze: {
				make_seqs: true,
				dead_code: false
			},
			codegen: {
				beautify: false,
				quote_keys: false
			}
		},
		compress: {
			zip: {
				files: {
					'build/<%= pkg.name %>.min.js.gz': 'build/<%= pkg.name %>.min.js'
				}
			}
		},
		copy: {
			dist: {
				files: {
					'build/<%= pkg.name %>-debug-<%= pkg.version %>.js': 'build/<%= pkg.name %>-debug.js',
					'build/<%= pkg.name %>-<%= pkg.version %>.js': 'build/<%= pkg.name %>.min.js'
				}
			}
		},
		docs: {
			file: {
				src: "js/",
				dest: "docs/"
			}
		},
		"qunit-cov": {
			test: {
				minimum: 0.1,
				srcDir: 'js',
				depDirs: ['test'],
				outDir: 'testResults',
				testFiles: ['test/*.html']
			}
		}

	});

	// min is uglify (included with grunt)
	// lint is jslint
	grunt.loadNpmTasks('grunt-contrib');

	grunt.loadNpmTasks('grunt-contrib-compress'); // gz
	grunt.loadNpmTasks('grunt-contrib-copy'); // copy
	grunt.loadNpmTasks('grunt-contrib-uglify'); // minify
	grunt.loadNpmTasks('grunt-linter'); // linter
	grunt.loadNpmTasks('grunt-jsvalidate'); // syntax error
	grunt.loadNpmTasks('grunt-strip'); // remove console.log, etc
	grunt.loadNpmTasks('grunt-qunit-cov'); // jscoverage
	grunt.loadTasks('tasks'); // jsdoc
	grunt.registerTask('release', 'lint:beforeconcat concat lint:afterconcat copy strip min compress');
	grunt.registerTask('default', 'jsvalidate release');


};