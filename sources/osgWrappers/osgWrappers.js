define( [
    'osgWrappers/serializers/osg',
    'osgWrappers/serializers/osgAnimation'
], function ( osg, osgAnimation ) {

    'use strict';

    var osgWrappers = {};

    osgWrappers.osg = osg;
    osgWrappers.osgAnimation = osgAnimation;

    return osgWrappers;
} );
