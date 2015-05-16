module.exports = function (grunt) {

	grunt.initConfig({
		bower: {
			install: {
				options: {
					targetDir: __dirname + "/public/dist/bower_compiled",
					layout: 'byComponent'
				}
			}
		},
		less: {
			styles: {
				files: [
					{
						expand: true,
						cwd: 'public/less/',
						src: ['*.less'],
						dest: 'public/dist/',
						ext: '.css'
					}
				]
			},
			stylesMin: {
				files: [
					{
						expand: true,
						cwd: 'public/less/',
						src: ['*.less'],
						dest: 'public/dist/',
						ext: '.css'
					}
				],
				options: {
					yuicompress: true,
					strictImports: true
				}
			}
		},
		concat: {
			options: {
				// String to put between each file in the concatenated output
				separator: ';'
			},
			vendorJs: {
				src: [
					'public/dist/bower_compiled/jquery/jquery.js',
				],
				dest: 'public/dist/vendor.js'
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-less');
};
