( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var ExampleOSGJS = window.ExampleOSGJS;

    var Example = function () {
        ExampleOSGJS.call( this );
    };

    // http://stackoverflow.com/questions/521295/javascript-random-seeds
    var seed = function ( s ) {
        return function () {
            s = Math.sin( s ) * 10000;
            return s - Math.floor( s );
        };
    };

    Example.prototype = osg.objectInherit( ExampleOSGJS.prototype, {

        // helpers
        createNormalArray: function ( size, x, y, z ) {
            var array = new Float32Array( size * 3 );
            for ( var i = 0; i < size; i++ ) {
                array[ i * 3 + 0 ] = x;
                array[ i * 3 + 1 ] = y;
                array[ i * 3 + 2 ] = z;
            }
            return array;
        },

        createColorsArray: function ( size ) {
            var random = seed( size );
            var array = new Float32Array( size * 3 );
            for ( var i = 0; i < size; i++ ) {
                array[ i * 3 + 0 ] = 0.4 + random();
                array[ i * 3 + 1 ] = 0.4 + random();
                array[ i * 3 + 2 ] = 0.4 + random();
            }
            return array;
        },

        createPoints: function () {

            var segment = 50;
            var geom = osg.createTexturedSphereGeometry( 0.2, segment, segment );
            var n = geom.getVertexAttributeList().Vertex.getElements().length / 3;
            var colors = this.createColorsArray( n );

            geom.setVertexAttribArray( 'Color', new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, colors, 3 ) );
            geom.getPrimitiveSetList().length = 0;
            geom.getPrimitiveSetList().push( new osg.DrawArrays( osg.primitiveSet.POINTS, 0, segment * segment * 4 ) );
            var mt = new osg.MatrixTransform();
            mt.addChild( geom );
            mt.setMatrix( osg.mat4.fromTranslation( osg.mat4.create(), osg.vec3.fromValues( 1.8, 0, 0.4 ) ) );

            return mt;

        },

        createLines: function () {

            var vertices = new Float32Array( [ -1.13704, -2.15188e-09, 0.40373, -0.856897, -2.15188e-09, 0.531441, -0.889855, -2.15188e-09, 0.444927, -0.568518, -2.15188e-09, 0.40373, -1.00933, -2.15188e-09, 0.370773, -0.716827, -2.15188e-09, 0.292498, -1.07936, 9.18133e-09, 0.317217, -0.700348, 9.18133e-09, 0.362533 ] );


            var normals = this.createNormalArray( 8, 0, -1, 0 );
            var colors = this.createColorsArray( 8 );
            var geom = new osg.Geometry();

            geom.setVertexAttribArray( 'Vertex', new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, vertices, 3 ) );
            geom.setVertexAttribArray( 'Normal', new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, normals, 3 ) );
            geom.setVertexAttribArray( 'Color', new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, colors, 3 ) );

            geom.getPrimitiveSetList().push( new osg.DrawArrays( osg.primitiveSet.LINES, 0, 8 ) );
            return geom;

        },

        createLineStrip: function () {

            var vertices = new Float32Array( [ -0.0741545, -2.15188e-09, 0.416089,
                0.234823, -2.15188e-09, 0.259541,
                0.164788, -2.15188e-09, 0.366653, -0.0288379, -2.15188e-09, 0.333695, -0.0453167, -2.15188e-09, 0.280139
            ] );

            var normals = this.createNormalArray( 5, 0, -1, 0 );
            var colors = this.createColorsArray( 5 );

            var geom = new osg.Geometry();

            geom.setVertexAttribArray( 'Vertex', new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, vertices, 3 ) );
            geom.setVertexAttribArray( 'Normal', new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, normals, 3 ) );
            geom.setVertexAttribArray( 'Color', new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, colors, 3 ) );
            geom.getPrimitiveSetList().push( new osg.DrawArrays( osg.primitiveSet.LINE_STRIP, 0, 5 ) );
            return geom;

        },

        createLineLoop: function () {

            var vertices = new Float32Array( [
                0.741546, -2.15188e-09, 0.453167,
                0.840418, -2.15188e-09, 0.304858,
                1.12468, -2.15188e-09, 0.300738,
                1.03816, 9.18133e-09, 0.453167,
                0.968129, -2.15188e-09, 0.337815,
                0.869256, -2.15188e-09, 0.53144
            ] );

            var normals = this.createNormalArray( 6, 0, -1, 0 );
            var colors = this.createColorsArray( 6 );

            var geom = new osg.Geometry();

            geom.setVertexAttribArray( 'Vertex', new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, vertices, 3 ) );
            geom.setVertexAttribArray( 'Normal', new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, normals, 3 ) );
            geom.setVertexAttribArray( 'Color', new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, colors, 3 ) );
            geom.getPrimitiveSetList().push( new osg.DrawArrays( osg.primitiveSet.LINE_LOOP, 0, 6 ) );
            return geom;

        },


        createTriangles: function () {

            // TRIANGLES 6 vertices, v0..v5
            // note in anticlockwise order.
            var vertices = new Float32Array( [
                // TRIANGLES 6 vertices, v0..v5
                // note in anticlockwise order.
                -1.12056, -2.15188e-09, -0.840418, -0.95165, -2.15188e-09, -0.840418, -1.11644, 9.18133e-09, -0.716827, -0.840418, 9.18133e-09, -0.778623, -0.622074, 9.18133e-09, -0.613835, -1.067, 9.18133e-09, -0.609715,

                // TRIANGLE STRIP 6 vertices, v6..v11
                // note defined top point first,
                // then anticlockwise for the next two points,
                // then alternating to bottom there after.
                -0.160668, -2.15188e-09, -0.531441, -0.160668, -2.15188e-09, -0.749785,
                0.0617955, 9.18133e-09, -0.531441,
                0.168908, -2.15188e-09, -0.753905,
                0.238942, -2.15188e-09, -0.531441,
                0.280139, -2.15188e-09, -0.823939,

                // TRIANGLE FAN 5 vertices, v12..v16
                // note defined in anticlockwise order.
                0.844538, 9.18133e-09, -0.712708,
                1.0258, 9.18133e-09, -0.799221,
                1.03816, -2.15188e-09, -0.692109,
                0.988727, 9.18133e-09, -0.568518,
                0.840418, -2.15188e-09, -0.506723
            ] );

            var normals = this.createNormalArray( 17, 0, -1, 0 );
            var colors = this.createColorsArray( 17 );

            var geom = new osg.Geometry();

            geom.setVertexAttribArray( 'Vertex', new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, vertices, 3 ) );
            geom.setVertexAttribArray( 'Normal', new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, normals, 3 ) );
            geom.setVertexAttribArray( 'Color', new osg.BufferArray( osg.BufferArray.ARRAY_BUFFER, colors, 3 ) );

            geom.getPrimitiveSetList().push( new osg.DrawArrays( osg.primitiveSet.TRIANGLES, 0, 6 ) );
            geom.getPrimitiveSetList().push( new osg.DrawArrays( osg.primitiveSet.TRIANGLE_STRIP, 6, 6 ) );
            geom.getPrimitiveSetList().push( new osg.DrawArrays( osg.primitiveSet.TRIANGLE_FAN, 12, 5 ) );
            return geom;

        },

        createScene: function () {
            // the root node
            var scene = new osg.Node();
            scene.getOrCreateStateSet().setAttributeAndModes( new osg.CullFace( 0 ) );

            scene.addChild( this.createPoints() );
            scene.addChild( this.createLines() );
            scene.addChild( this.createLineStrip() );
            scene.addChild( this.createLineLoop() );
            scene.addChild( this.createTriangles() );

            this.getRootNode().addChild( scene );

            this._viewer.getManipulator().setNode( scene );
            this._viewer.getManipulator().computeHomePosition();
        }

    } );

    window.addEventListener( 'load', function () {

        var example = new Example();
        example.run();
        window.example = example;

    }, true );

} )();
