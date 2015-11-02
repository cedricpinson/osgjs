'use strict';
var QUnit = require( 'qunit' );
var Input = require( 'osgDB/Input' );
var Notify = require( 'osg/Notify' );

module.exports = function () {

    QUnit.module( 'osgWrapper' );

    QUnit.asyncTest( 'osgAnimation', function () {

        var input = new Input();
        input.readNodeURL( '../examples/media/models/material-test/file.osgjs' ).then( function ( scene ) {

            ok( scene !== undefined, true );

            start();


        } ).fail( function ( error ) {
            Notify.error( error );
        } );


    } );

};
