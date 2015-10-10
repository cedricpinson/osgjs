// polyfill for phantomjs
require( 'tests/vendors/es5-shim' );
require( 'tests/vendors/es6-shim' );

define( [
    'OSG',

    //    'tests/osg/osgPerformance',
    'tests/osgAnimation/osgAnimationPerformance'

], function ( OSG,
    //osg,
    osgAnimation ) {

    // hack because of osgPool
    OSG.osg.init();

    //osg();
    osgAnimation();



} );
