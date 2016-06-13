'use strict';
var assert = require( 'chai' ).assert;
var Shader = require( 'osg/Shader' );
var Notify = require( 'osg/Notify' );


module.exports = function () {

    test( 'Shader', function () {

        // catch logs
        var results = '';
        var resultsWarn = '';
        var resultsError = '';
        var myConsole = {
            warn: function ( txt ) {
                results += txt + '\n';
                resultsWarn += txt + '\n';
            },
            error: function ( txt ) {
                results += txt + '\n';
                resultsError += txt + '\n';
            },
            log: function ( txt ) {
                results += txt + '\n';
            },
            info: function ( txt ) {
                results += txt + '\n';
            }
        };
        Notify.setConsole( myConsole );


        var shader = '';
        var errors = '';

        Shader.prototype.processErrors( errors, shader );
        assert.isOk( results === '', 'test empty compilation error' );

        results = '';
        resultsWarn = '';
        resultsError = '';

        shader = '#version 100\n#ifdef GL_FRAGMENT_PRECISION_HIGH\n precision highp float;\n #else\n precision mediump float;\n\n#endif\n#define SHADER_NAME CompilerOSGJS\n\n\nattribute vec3 Vertex;\nattribute vec2 TexCoord0;\nattribute vec3 Normal;\nattribute vec4 Color;\n\nuniform float ArrayColorEnabled;\nuniform mat4 ModelViewMatrix;\nuniform mat4 NormalMatrix;\nuniform mat4 ProjectionMatrix;\nvarying vec2 FragTexCoord0;\nvarying vec3 FragNormal;\nvarying vec4 FragEyeVector;\nvarying vec4 VertexColor;\n\n\n\nvoid main() {\n// vars\n\nconst float unitFloat = 1.0;\n// end vars\ngl_PointSize = unitFloat;\nFragEyeVector = ModelViewMatrix*vec4(Vertex.xyz, 1.);\ngl_Position = ProjectionMatrix*FragEyeVector;\nFragNormal = vec3(NormalMatrix*vec4(Normal.xyz, 0.));\nFragTexCoord0 = TexCoord0.rg;\n\nif (\nArrayColorEnabled == 1.0 ) \n    VertexColor = Color;e\n  else\n    VertexColor = vec4(1.0,1.0,1.0,1.0);\n}';

        errors = "ERROR: 0:37: 'e' : undeclared identifier\nERROR: 0:38: 'else' : syntax error'";
        Shader.prototype.processErrors( errors, shader );


        assert.isOk( 624 === resultsWarn.length, 'test compilation warnings' );
        assert.isOk( 91 === resultsError.length, 'test compilation error' );



    } );
};
