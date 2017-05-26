'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var IntersectionVisitor = require( 'osgUtil/IntersectionVisitor' );
var LineSegmentIntersector = require( 'osgUtil/LineSegmentIntersector' );
var KdTreeBuilder = require( 'osg/KdTreeBuilder' );
var BoundingSphere = require( 'osg/BoundingSphere' );
var Camera = require( 'osg/Camera' );
var Viewport = require( 'osg/Viewport' );
var mat4 = require( 'osg/glMatrix' ).mat4;
var vec3 = require( 'osg/glMatrix' ).vec3;
var MatrixTransform = require( 'osg/MatrixTransform' );
var Shape = require( 'osg/shape' );
var View = require( 'osgViewer/View' );
var ReaderParser = require( 'osgDB/readerParser' );


module.exports = function () {

    test( 'LineSegmentIntersector simple test', function () {
        var lsi = new LineSegmentIntersector();
        var bs = new BoundingSphere();
        bs.set( vec3.fromValues( 4.0, 2.0, 0.0 ), 2.0 );

        // start right on the edge
        lsi.set( vec3.fromValues( 2.0, 2.0, 0.0 ), vec3.fromValues( -1.0, 2.0, 0.0 ) );
        lsi.setCurrentTransformation( mat4.create() );
        assert.isOk( lsi.intersects( bs ), 'hit success' );

        // end right on edge
        lsi.set( vec3.fromValues( 2.0, 0.0, 0.0 ), vec3.fromValues( 4.0, 0.0, 0.0 ) );
        lsi.setCurrentTransformation( mat4.create() );
        assert.isOk( lsi.intersects( bs ), 'hit success' );

        // line right on edge
        lsi.set( vec3.fromValues( 2.0, 0.0, 0.0 ), vec3.fromValues( 4.0, 0.0, 0.0 ) );
        lsi.setCurrentTransformation( mat4.create() );
        assert.isOk( lsi.intersects( bs ), 'hit success' );

        lsi.set( vec3.fromValues( 2.0, 0.0, 0.0 ), vec3.fromValues( 3.0, 1.0, 0.0 ) );
        lsi.setCurrentTransformation( mat4.create() );
        assert.isOk( lsi.intersects( bs ), 'hit success' );

        lsi.set( vec3.fromValues( 0.0, 2.0, 0.0 ), vec3.fromValues( 1.9, 2.0, 0.0 ) );
        lsi.setCurrentTransformation( mat4.create() );
        assert.isOk( !lsi.intersects( bs ), 'hit failed' );

        lsi.set( vec3.fromValues( 0.0, 2.0, 0.0 ), vec3.fromValues( 2.1, 2.0, 0.0 ) );
        lsi.setCurrentTransformation( mat4.create() );
        assert.isOk( lsi.intersects( bs ), 'hit success' );

        lsi.set( vec3.fromValues( 5.0, 1.0, 0.0 ), vec3.fromValues( 6.0, 0.0, 0.0 ) );
        lsi.setCurrentTransformation( mat4.create() );
        assert.isOk( lsi.intersects( bs ), 'hit success' );

        lsi.set( vec3.fromValues( 1.0, 1.0, 0.0 ), vec3.fromValues( 2.0, 3.0, 0.0 ) );
        lsi.setCurrentTransformation( mat4.create() );
        assert.isOk( !lsi.intersects( bs ), 'hit failed' );
    } );

    test( 'LineSegmentIntersector without 2 branches', function () {

        // right branch should be picked
        // left branch shouldn't be picked
        //
        // MatrixTransform  (-10 -10 -10)
        //     /    \
        //    |     MatrixTransform (10 10 10)
        //     \   /
        //     Scene

        var camera = new Camera();
        camera.setViewport( new Viewport() );
        camera.setViewMatrix( mat4.lookAt( mat4.create(), vec3.fromValues( 0.0, 0.0, -10.0 ), vec3.create(), vec3.fromValues( 0.0, 1.0, 0.0 ) ) );
        camera.setProjectionMatrix( mat4.perspective( mat4.create(), Math.PI / 180 * 60, 800.0 / 600.0, 0.1, 1000.0 ) );

        var scene = Shape.createTexturedQuadGeometry( -0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0 );

        var tr1 = new MatrixTransform();
        mat4.fromTranslation( tr1.getMatrix(), [ 5.0, 0.0, 0.0 ] );
        tr1.addChild( scene );

        var mrot = new MatrixTransform();
        mat4.fromTranslation( mrot.getMatrix(), [ -5.0, 0.0, 0.0 ] );
        mrot.addChild( tr1 );
        mrot.addChild( scene );

        camera.addChild( mrot );

        var lsi = new LineSegmentIntersector();
        lsi.set( vec3.fromValues( 420, 300, 0.0 ), vec3.fromValues( 420, 300, 1.0 ) );
        var iv = new IntersectionVisitor();
        iv.setIntersector( lsi );
        camera.accept( iv );
        assert.isOk( lsi._intersections.length === 1, 'Hits should be 1 and result is ' + lsi._intersections.length );
        assert.isOk( lsi._intersections[ 0 ]._nodePath.length === 4, 'NodePath should be 4 and result is ' + lsi._intersections[ 0 ]._nodePath.length );

    } );

    test( 'LineSegmentIntersector without kdtree and camera', function () {

        var camera = new Camera();
        camera.setViewport( new Viewport() );
        camera.setViewMatrix( mat4.lookAt( mat4.create(), vec3.fromValues( 0.0, 0.0, -10 ), vec3.create(), vec3.fromValues( 0.0, 1.0, 0.0 ) ) );
        camera.setProjectionMatrix( mat4.perspective( mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 1000.0 ) );

        var scene = Shape.createTexturedQuadGeometry( -0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0 );
        camera.addChild( scene );
        var lsi = new LineSegmentIntersector();
        lsi.set( vec3.fromValues( 400, 300, 0.0 ), vec3.fromValues( 420, 300, 1.0 ) );
        var iv = new IntersectionVisitor();
        iv.setIntersector( lsi );
        camera.accept( iv );
        assert.isOk( lsi._intersections.length === 1, 'Hits should be 1 and result is ' + lsi._intersections.length );
        assert.isOk( lsi._intersections[ 0 ]._nodePath.length === 2, 'NodePath should be 2 and result is ' + lsi._intersections[ 0 ]._nodePath.length );

    } );

    test( 'LineSegmentIntersector without kdtree', function () {

        var view = new View();
        view.getCamera().setViewport( new Viewport() );
        view.getCamera().setViewMatrix( mat4.lookAt( mat4.create(), vec3.fromValues( 0.0, 0.0, -10 ), vec3.create(), vec3.fromValues( 0.0, 1.0, 0.0 ) ) );
        view.getCamera().setProjectionMatrix( mat4.perspective( mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 1000.0 ) );

        // TODO it uses the old sync parseSceneGraphDeprecated
        var quad = ReaderParser.parseSceneGraph( mockup.getScene() );
        view.setSceneData( quad );

        var result = view.computeIntersections( 400, 300 );
        assert.isOk( result.length === 1, 'Hits should be 1 and result is ' + result.length );
    } );

    test( 'LineSegmentIntersector with kdtree and camera', function () {
        // This test will never work with kdtree
        var camera = new Camera();
        camera.setViewport( new Viewport() );
        camera.setViewMatrix( mat4.lookAt( mat4.create(), vec3.fromValues( 0.0, 0.0, -10 ), vec3.create(), vec3.fromValues( 0.0, 1.0, 0.0 ) ) );
        camera.setProjectionMatrix( mat4.perspective( mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 1000.0 ) );

        var scene = Shape.createTexturedQuadGeometry( -0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0 );
        camera.addChild( scene );
        var treeBuilder = new KdTreeBuilder( {
            _numVerticesProcessed: 0.0,
            _targetNumTrianglesPerLeaf: 1,
            _maxNumLevels: 20
        } );
        treeBuilder.apply( scene );

        var lsi = new LineSegmentIntersector();
        lsi.set( vec3.fromValues( 400, 300, 0.0 ), vec3.fromValues( 420, 300, 1.0 ) );
        var iv = new IntersectionVisitor();
        iv.setIntersector( lsi );
        camera.accept( iv );
        assert.isOk( lsi._intersections.length === 1, 'Intersections should be 1 and result is ' + lsi._intersections.length );
        assert.isOk( lsi._intersections[ 0 ]._nodePath.length === 2, 'NodePath should be 2 and result is ' + lsi._intersections[ 0 ]._nodePath.length );
    } );

    test( 'LineSegmentIntersector with kdtree', function () {

        var view = new View();
        view.getCamera().setViewport( new Viewport() );
        view.getCamera().setViewMatrix( mat4.lookAt( mat4.create(), vec3.fromValues( 0.0, 0.0, -10.0 ), vec3.create(), vec3.fromValues( 0.0, 1.0, 0.0 ) ) );
        view.getCamera().setProjectionMatrix( mat4.perspective( mat4.create(), Math.PI / 180 * 60, 800 / 600, 0.1, 1000.0 ) );

        // TODO it uses the old sync parseSceneGraphDeprecated
        var root = ReaderParser.parseSceneGraph( mockup.getScene() );
        view.setSceneData( root );

        var treeBuilder = new KdTreeBuilder( {
            _numVerticesProcessed: 0.0,
            _targetNumTrianglesPerLeaf: 50,
            _maxNumLevels: 20
        } );
        treeBuilder.apply( root );

        var result = view.computeIntersections( 400, 300 );
        assert.isOk( result.length === 1, 'Hits should be 1 and result is ' + result.length );
    } );

};
