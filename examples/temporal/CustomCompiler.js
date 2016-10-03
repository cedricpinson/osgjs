'use strict';
var CustomCompiler;
( function () {

    var osgShader = window.OSG.osgShader;
    var osg = window.OSG.osg;

    // this compiler use basic lighting and add a node to demonstrate how to
    // customize the shader compiler
    CustomCompiler = function () {
        osgShader.Compiler.apply( this, arguments );
    };

    CustomCompiler.prototype = osg.objectInherit( osgShader.Compiler.prototype, {

        getOrCreateProjectionMatrix: function () {
            var projMat = this.getVariable( 'projectionMatrix' );
            if ( projMat )
                return projMat;

            projMat = this.createVariable( 'mat4', 'projectionMatrix' );


            var projectionMatrix = this.getOrCreateUniform( 'mat4', 'uProjectionMatrix' );
            var halton = this.getOrCreateUniform( 'vec4', 'halton' );
            var renderSize = this.getOrCreateUniform( 'vec2', 'RenderSize' );

            var code = [ '',
                ' %projMat = %projectionMatrix;',
                ' if (%halton.z == 1.0)',
                ' {',
                '   %projMat[2][0] +=  halton.x / %renderSize.x;',
                '   %projMat[2][1] +=  halton.y / %renderSize.y;',
                ' }',
                ''
            ];
            this.getNode( 'InlineCode' ).code( code.join( '\n' ) ).inputs( {
                projectionMatrix: projectionMatrix,
                halton: halton,
                renderSize: renderSize
            } ).outputs( {
                projMat: projMat
            } );

            return projMat;

        }

    } );

} )();
