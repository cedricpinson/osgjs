( function () {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;

    function getShader() {
        var vertexshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'attribute vec3 Vertex;',
            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            'varying vec2 position;',
            'void main(void) {',
            '  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);',
            '  position = Vertex.xy;',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'varying vec2 position;',
            'uniform vec3 groundColor;',
            'void main(void) {',
            '   float f = length(position) * 1.0;',
            '   f = smoothstep(0.0, 0.5, f);',
            '   gl_FragColor = vec4(groundColor, 1.0 - f);',
            '}',
            ''
        ].join( '\n' );

        var program = new osg.Program(
            new osg.Shader( 'VERTEX_SHADER', vertexshader ),
            new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

        return program;
    }

    window.Ground = function () {
        osg.MatrixTransform.call( this );

        // Height position of the ground, applied with the translateMatrix
        // This value is normalized for all models and is scaled by the model scale factor
        // 0: center, -1: under, 1: above
        this._normalizedHeight = 0.0;

        // Size of the ground, applied with the scaleMatrix
        // We set the ground size via the scale Matrix instead of directly creating a presized quad
        // If we presize a big quad, it could expand the bounding box of the scene and thus
        // the default home position would be farther away and the model would appear smaller
        this._size = 100.0;

        // The size of the ground should be the same for all models, but every model have a different
        // size. So we scale the ground size with this per-model scale factor (radius of bounding sphere)
        this._scale = 1.0;

        this._scaleMatrix = osg.Matrix.create();
        this._yTranslateMatrix = osg.Matrix.create();
        this._center = osg.Vec3.create();

        // Create geometry for the ground, 1 unit and centered around 0
        var quad = osg.createTexturedQuadGeometry( -0.5, -0.5, 0.0,
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0
        );
        this._color = osg.Uniform.createFloat3( [ 0.7, 0.7, 0.7 ], 'groundColor' );

        quad.getOrCreateStateSet().setAttributeAndModes( getShader() );
        quad.getOrCreateStateSet().setAttributeAndModes( new osg.BlendFunc( 'SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA' ) );
        quad.getOrCreateStateSet().addUniform( this._color );

        this.addChild( quad );
    };

    window.Ground.prototype = osg.objectLibraryClass( osg.objectInherit( osg.MatrixTransform.prototype, {

        // The min height of a bsphere will near always be lower than
        // that of the bounding box, so try to compensate it
        _correction: Math.sqrt( 2 ) / Math.sqrt( 3 ),

        /**
         * This function set the scale factor to the model bsphere radius
         * and set the ground under the model (normalizedHeight = -1)
         */
        setGroundFromModel: function ( model ) {

            var bsphere = model.getBound();

            this._normalizedHeight = -1.0;
            this._scale = bsphere.radius() * this._correction;

            osg.Vec3.copy( bsphere.center(), this._center );

            this.computeMatrix();
        },

        computeMatrix: function () {

            osg.Matrix.makeScale( this._scale * this._size, this._scale * this._size, 1, this._scaleMatrix );
            osg.Matrix.makeTranslate( this._center[ 0 ], this._center[ 1 ], this._center[ 2 ] + ( this._normalizedHeight * this._scale ), this._yTranslateMatrix );

            osg.Matrix.mult( this._yTranslateMatrix, this._scaleMatrix, this.getMatrix() );
        },

        setNormalizedHeight: function ( normalizedHeight ) {
            this._normalizedHeight = normalizedHeight;
            this.computeMatrix();
        },

        getNormalizedHeight: function () {
            return this._normalizedHeight;
        },

        setColor: function ( color ) {
            this._color.setInternalArray( color );
        },

        getColor: function () {
            return this._color.getInternalArray();
        }

    } ), 'osgUtil', 'Ground' );
} )();
