define( [
    'qunit',
    'q',
    'osgDB/Input',
    'osg/Notify',
    'osg/Image'
], function ( QUnit, Q, Input, Notify, Image ) {

    'use strict';

    return function () {

        QUnit.module( 'osgWrapper' );

        QUnit.asyncTest( 'osgAnimation', function () {

            var input = new Input();
            input.readNodeURL( '../examples/media/models/animation-test/brindherbetrs.osgjs').then( function( scene ) {

                ok( scene !== undefined, true );

                start();


            }).fail( function( error ) {
                Notify.error( error );
            });


        } );

    };
} );
