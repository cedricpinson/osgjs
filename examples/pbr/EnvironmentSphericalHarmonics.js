window.EnvironmentSphericalHarmonics = ( function () {
    'use strict';

    var P = window.P;
    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgShader = OSG.osgShader;
    var $ = window.$;

    var shaderProcessor = new osgShader.ShaderProcessor();

    var EnvironmentSphericalHarmonics = function ( file ) {

        this._uniformSpherical = undefined;

        // if file is an array it's the sh coefs
        if ( Array.isArray( file ) ) {
            this.initSHCoef( file );
        }

        this._file = file;
    };

    EnvironmentSphericalHarmonics.prototype = {

        createShaderSpherical: function () {


            var vertexshader = shaderProcessor.getShader( 'sphericalHarmonicsVertex.glsl' );
            var fragmentshader = shaderProcessor.getShader( 'sphericalHarmonicsFragment.glsl' );

            var program = new osg.Program(
                new osg.Shader( 'VERTEX_SHADER', vertexshader ),
                new osg.Shader( 'FRAGMENT_SHADER', fragmentshader ) );

            return program;
        },

        createDebugGeometry: function () {

            var debugGroup = new osg.MatrixTransform();
            var size = 10;
            // create a sphere to debug it
            var sphere = osg.createTexturedSphereGeometry( size, 20, 20 );
            sphere.getOrCreateStateSet().setAttributeAndModes( this.createShaderSpherical() );
            sphere.getOrCreateStateSet().addUniform( this._uniformSpherical );

            debugGroup.addChild( sphere );
            return debugGroup;
        },

        initSHCoef: function ( sphCoef ) {

            // use spherical harmonics with 9 coef
            this._sphCoef = sphCoef.slice( 0, 9 * 3 );

            var coef0 = 1.0 / ( 2.0 * Math.sqrt( Math.PI ) );
            var coef1 = -( Math.sqrt( 3.0 / Math.PI ) * 0.5 );
            var coef2 = -coef1;
            var coef3 = coef1;
            var coef4 = Math.sqrt( 15.0 / Math.PI ) * 0.5;
            var coef5 = -coef4;
            var coef6 = Math.sqrt( 5.0 / Math.PI ) * 0.25;
            var coef7 = coef5;
            var coef8 = Math.sqrt( 15.0 / Math.PI ) * 0.25;

            var coef = [
                coef0, coef0, coef0,
                coef1, coef1, coef1,
                coef2, coef2, coef2,
                coef3, coef3, coef3,
                coef4, coef4, coef4,
                coef5, coef5, coef5,
                coef6, coef6, coef6,
                coef7, coef7, coef7,
                coef8, coef8, coef8,
            ];

            this._sphCoef = coef.map( function ( value, index ) {
                return value * this._sphCoef[ index ];
            }.bind( this ) );

            this._uniformSpherical = osg.Uniform.createFloat3Array( 'uEnvironmentSphericalHarmonics', 9 );
            this._uniformSpherical.getInternalArray().set( this._sphCoef );

        },

        load: function () {

            if ( this._uniformSpherical )
                return this._uniformSpherical;

            var p = P( $.get( this._file ) );

            p.then( function ( text ) {
                var coefs = JSON.parse( text );

                this.initSHCoef( coefs );

            }.bind( this ) );
            return p;
        }
    };

    return EnvironmentSphericalHarmonics;
} )();
