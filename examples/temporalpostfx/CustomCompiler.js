var CustomCompiler;
( function () {
    'use strict';
    var osgShader = window.OSG.osgShader;
    var osg = window.OSG.osg;
    var factory = osgShader.nodeFactory;


    // this compiler use basic lighting and add a node to demonstrate how to
    // customize the shader compiler
    CustomCompiler = function () {
        osgShader.Compiler.apply( this, arguments );
    };


    CustomCompiler.prototype = osg.objectInherit( osgShader.Compiler.prototype, {
        // this is the main code that instanciate and link nodes together
        // it's a simplified version of the curent osgjs compiler
        // it could also be simpler
        createFragmentShaderGraph: function () {

            var velocityAttribute = this.getAttributeType( 'Velocity' );
            if ( velocityAttribute ) {
                // only wants velocity
                return this.velocity( velocityAttribute );
            }


            var roots = osgShader.Compiler.prototype.createFragmentShaderGraph.call( this );

            this.temporal( roots );

            return roots;
        },
        // ======================================================
        // my custom attribute temporal
        // it's here I connect ouput of light result with my temporal
        // ======================================================
        temporal: function () {



            var temporalAttribute = this.getAttributeType( 'Temporal' );
            if ( temporalAttribute ) {

                var fragColor = this.getNode( 'glFragColor' );

                var input = fragColor._inputs[ 0 ];
                fragColor._inputs[ 0 ] = undefined;

                var temporalResult = this.createVariable( 'vec4' );

                this.getNode( 'Temporal' ).inputs( {
                    color: input,
                    enable: this.getOrCreateUniform( temporalAttribute.getOrCreateUniforms().enable ),
                    frameNum: this.getOrCreateUniform( 'float', 'FrameNum' ),
                    fragScreenPos: this.getOrCreateInputPosition(),
                    prevFragScreenPos: this.getOrCreateVarying( 'vec4', 'FragEyeVectorPrev' ),
                    texture2: this.getOrCreateSampler( 'sampler2D', 'Texture2' )
                } ).outputs( {
                    color: temporalResult
                } );

                // no temporal use a default behaviour
                this.getNode( 'InlineCode' ).code( '%color = %fragTempColor;' ).inputs( {
                    fragTempColor: temporalResult
                } ).outputs( {
                    color: fragColor
                } );
            }


        },
        // ======================================================
        // my custom attribute velocity
        // it's here I connect ouput of light result with my velocity
        // ======================================================
        velocity: function ( velocityAttribute ) {

            var fragColor = this.getNode( 'glFragColor' );


            var res = this.createVariable( 'vec4' );
            this.getNode( 'Velocity' ).inputs( {
                enable: this.getOrCreateUniform( velocityAttribute.getOrCreateUniforms().enable ),
                fragScreenPos: this.getOrCreateInputPosition(),
                FragScreenPos: this.getOrCreateVarying( 'vec4', 'FragClipPos' ),
                prevFragScreenPos: this.getOrCreateVarying( 'vec4', 'FragClipPosPrev' )
            } ).outputs( {
                color: res
            } );

            //
            this.getNode( 'InlineCode' ).code( '%color = %fragTempColor;' ).inputs( {
                fragTempColor: res
            } ).outputs( {
                color: fragColor
            } );

            return [ fragColor ];
        },

        declareVertexMain: function () {
            var roots = osgShader.Compiler.prototype.declareVertexMain.call( this );

            /////////////// reproj
            var velocityAttribute = this.getAttributeType( 'Velocity' );
            var temporalAttribute = this.getAttributeType( 'Temporal' );

            if ( temporalAttribute || velocityAttribute ) {

                var vertexAttribute = this.getOrCreateVertexAttribute();

                ///
                /// Prev clip Pos
                ///
                var prevModelViewMatrix = this.getOrCreateUniform( 'mat4', 'PrevModelViewMatrix' );
                var prevProjMatrix = this.getOrCreateUniform( 'mat4', 'PrevProjectionMatrix' );

                var code = [ '',
                    '  // compute prev clip space position',
                    '  vec4 prevPos = %prevModelViewMatrix * vec4(%vertexAttribute, 1.0);',
                    '  vec4 prevPosition = %prevProjMatrix * prevPos;',
                    '  FragClipPosPrev = prevPosition;',
                    ''
                ];

                var FragClipPosPrev = this.getOrCreateVarying( 'vec4', 'FragClipPosPrev' );

                this.getNode( 'InlineCode' ).code( code.join( '\n' ) ).inputs( {
                    prevModelViewMatrix: prevModelViewMatrix,
                    prevProjMatrix: prevProjMatrix,
                    vertexAttribute: vertexAttribute
                } ).outputs( {
                    FragClipPosPrev: FragClipPosPrev
                } );

                roots.push( FragClipPosPrev );

                //
                /// current clip Pos
                //
                var modelViewMatrix = this.getOrCreateUniform( 'mat4', 'ModelViewMatrix' );
                var projMatrix = this.getOrCreateProjectionMatrix();

                // fragEye = this.getOrCreateInputPosition();
                var code = [ '',
                    '  // compute prev clip space position',
                    '  vec4 aPos = %ModelViewMatrix * vec4(%vertexAttribute, 1.0);',
                    '  vec4 aPosition = %ProjMatrix * aPos;',
                    '  FragClipPos = aPosition;',
                    ''
                ];

                var FragClipPos = this.getOrCreateVarying( 'vec4', 'FragClipPos' );

                this.getNode( 'InlineCode' ).code( code.join( '\n' ) ).inputs( {
                    ModelViewMatrix: modelViewMatrix,
                    ProjMatrix: projMatrix,
                    vertexAttribute: vertexAttribute
                } ).outputs( {
                    FragClipPos: FragClipPos
                } );

                roots.push( FragClipPos );

                /////////////
            }
            return roots;
        }

    } );

} )();
