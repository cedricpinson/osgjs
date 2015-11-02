'use strict';

var exec = require( 'child_process' ).exec;
var fs = require( 'fs' );
var async = require( 'async' );


var migrate = function ( folder ) {
    exec( 'amd-to-common ' + folder, function ( err, stdout ) {

        if ( err ) {
            console.log( stdout );
            throw err;
        }

        exec( 'find ' + folder + ' -type f -name "*.js" -follow -print', function ( err, stdout ) {
            var files = stdout.split( '\n' );

            async.eachSeries( files, function ( file, done ) {

                if ( file ) {

                    console.log( 'Reading :', file );

                    fs.readFile( file, function ( err, data ) {

                        if ( data ) {
                            data = data.toString();

                            var d = data.split( '\n' );
                            d.pop();
                            d.shift();

                            for ( var k in d ) {
                                d[ k ] = d[ k ].replace( /^\ \ /, '' );
                            }

                            d = d.join( '\n' );

                            console.log( 'Writing : ', file );
                            fs.writeFile( file, d, function () {

                                console.log( 'Beautifying : ', file );

                                exec( 'js-beautify -r --config .jsbeautifyrc -l 0 ' + file, function () {

                                    console.log( 'Finished :', file );

                                    setTimeout( function () {
                                        done();
                                    }, 500 );

                                } );
                            } );
                        }

                    } );
                } else {
                    console.log( 'No file, skipping' );
                    done();
                }
            } );

        } );
    } );
};

migrate( 'sources' );
migrate( 'tests' );
