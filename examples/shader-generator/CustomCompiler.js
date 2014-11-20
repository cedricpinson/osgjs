var CustomCompiler;
(function() {

    var osgShader = window.OSG.osgShader;
    var osg = window.OSG.osg;
    var RampNode = window.RampNode;
    var NegatifNode = window.NegatifNode;



    var sprintf = osgShader.utils.sprintf;
    var shaderNode = osgShader.node;


    // this compiler use basic lighting and add a node to demonstrate how to
    // customize the shader compiler
    CustomCompiler = function() {
        osgShader.Compiler.apply(this, arguments);
    };


    CustomCompiler.prototype = osg.objectInherit( osgShader.Compiler.prototype, {


        getRamp: function() {

            for ( var i = 0; i < this._attributes.length; i ++ ) {
                if ( this._attributes[i].getType() === 'Ramp' )
                    return this._attributes[i];
            }
            return undefined;

        },


        getNegatif: function() {

            for ( var i = 0; i < this._attributes.length; i ++ ) {
                if ( this._attributes[i].getType() === 'Negatif' )
                    return this._attributes[i];
            }
            return undefined;

        },


        // this is the main code that instanciate and link nodes together
        // it's a simplified version of the curent osgjs compiler
        // it could also be simpler
        createFragmentShaderGraph: function () {

            // no material then return a default shader
            // you could do whatever you want here
            // if you want to return a debug color
            // just to be sure that you always have
            // valid material in your scene, in our case we suppose
            // it exists in the scene
            // if ( !this._material )
            //     return this.createDefaultFragmentShaderGraph();

            var uniforms = this._material.getOrCreateUniforms();
            var materialDiffuseColor = this.getOrCreateUniform( uniforms.diffuse );
            var materialAmbientColor = this.getOrCreateUniform( uniforms.ambient );
            var materialEmissionColor = this.getOrCreateUniform( uniforms.emission );
            var materialSpecularColor = this.getOrCreateUniform( uniforms.specular );
            var materialShininess = this.getOrCreateUniform( uniforms.shininess );

            var normal = this.getOrCreateNormalizedNormal();
            var eyeVector = this.getOrCreateNormalizedPosition();


            // diffuse color
            // use texture if we have some, check code of Compiler
            // to see the default behaviour
            var diffuseColor = this.getDiffuseColorFromTextures();


            // no texture then we use the material diffuse value
            if ( diffuseColor === undefined ) {

                diffuseColor = materialDiffuseColor;

            } else {

                // if texture we multiply materialDiffuse * texture
                var str = sprintf( '%s.rgb *= %s.rgb;', [ diffuseColor.getVariable(), materialDiffuseColor.getVariable() ] );
                var operator = new shaderNode.InlineCode( materialDiffuseColor );
                operator.connectOutput( diffuseColor );
                operator.setCode( str );

            }


            // default behavior if no light
            var finalColor = this.getFinalColor( diffuseColor );

            if ( this._lights.length > 0 ) {

                var lightedOutput = this.getOrCreateVariable( 'vec4', 'lightOutput' );
                var nodeLight = new shaderNode.Lighting( lightedOutput, this._lights, normal, eyeVector, materialAmbientColor, diffuseColor, materialSpecularColor, materialShininess );
                nodeLight.createFragmentShaderGraph( this );


                // ======================================================
                // my custom attribute ramp
                // it's here I connect ouput of light result with my ramp
                // ======================================================
                var rampAttribute = this.getRamp();
                var rampResult = this.getOrCreateVariable( 'vec4');
                if ( rampAttribute && rampAttribute.getAttributeEnable() ) {
                    new RampNode( rampResult, lightedOutput );
                } else {
                    rampResult = lightedOutput;
                }
                // ======================================================


                // ======================================================
                // my custom attribute negatif
                // it's here I connect ouput of light result with my ramp
                // ======================================================
                var negatifResult = this.getOrCreateVariable( 'vec4');
                var negatifAttribute = this.getNegatif();
                if ( negatifAttribute ) {
                    new NegatifNode( negatifResult, rampResult, this.getOrCreateUniform( negatifAttribute.getOrCreateUniforms().enable ) );
                } else {
                    negatifResult = rampResult;
                }
                // ======================================================


                // get final color
                // use the rampResult from previous node
                finalColor = this.getFinalColor( materialEmissionColor, negatifResult );

            }

            // create the output of the shader
            var fragColor = new shaderNode.FragColor();

            // make a copy from final color
            // it should be simplified
            var fragFinal = new shaderNode.InlineCode( finalColor );
            fragFinal.connectOutput( fragColor );
            fragFinal.setCode( sprintf('%s = %s;', [fragColor, finalColor] ));

            return fragColor;
        }

    });

})();
