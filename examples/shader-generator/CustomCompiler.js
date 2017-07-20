(function() {
    'use strict';

    var osgShader = window.OSG.osgShader;
    var osg = window.OSG.osg;

    // this compiler use basic lighting and add a node to demonstrate how to
    // customize the shader compiler
    var CustomCompiler = function() {
        osgShader.Compiler.apply(this, arguments);
    };

    // we use same attributes than the default compiler
    var config = osgShader.Compiler.cloneStateAttributeConfig(osgShader.Compiler);
    config.attribute.push('Ramp');
    config.attribute.push('Negatif');
    osgShader.Compiler.setStateAttributeConfig(CustomCompiler, config);

    CustomCompiler.prototype = osg.objectInherit(osgShader.Compiler.prototype, {
        getLighting: function() {
            // we simply hook the getLighting function and apply our ramp and negatif attributes
            var lightOutput = osgShader.Compiler.prototype.getLighting.call(this);

            // ======================================================
            // my custom attribute ramp
            // it's here I connect ouput of light result with my ramp
            // ======================================================
            var rampAttribute = this.getAttributeType('Ramp');

            if (rampAttribute && rampAttribute.getAttributeEnable()) {
                var rampResult = this.createVariable('vec3');

                this.getNode('Ramp')
                    .inputs({
                        colorInput: lightOutput
                    })
                    .outputs({
                        colorOutput: rampResult
                    });

                lightOutput = rampResult;
            }

            // ======================================================
            // my custom attribute negatif
            // it's here I connect ouput of light result with my ramp
            // ======================================================

            var negatifAttribute = this.getAttributeType('Negatif');

            if (negatifAttribute) {
                var uEnable = negatifAttribute.getOrCreateUniforms().enable;
                var negatifResult = this.createVariable('vec3');

                this.getNode('Negatif')
                    .inputs({
                        colorInput: lightOutput,
                        enable: this.getOrCreateUniform(uEnable)
                    })
                    .outputs({
                        colorOutput: negatifResult
                    });

                lightOutput = negatifResult;
            }

            return lightOutput;
        }
    });

    window.CustomCompiler = CustomCompiler;
})();
