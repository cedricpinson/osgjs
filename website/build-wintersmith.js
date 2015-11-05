var wintersmith = require( 'wintersmith' );
var fs = require( 'fs' );

var buildDest = process.argv[ 2 ];

// create the sites environment, can also be called with a config object. e.g.
// {contents: '/some/contents', locals: {powerLevel: 10}}, ..}
var env = wintersmith( 'config.json' );
env.config.output = buildDest;
//console.log( env.config );

// build site
env.build( function ( error ) {
    if ( error ) throw error;
    console.log( 'Done!' );
    process.exit();
} );
