
test("osgDB.parseSceneGraph", function() {

    (function() {
        var tree =  { 

            "stateset": {
                "material": {
                    "ambient": [ 0.5, 0.5, 0.5, 1], 
                    "diffuse": [ .1, .1, .1, .1], 
                    "emission": [ 0, 0, 0, .5], 
                    "name": "FloorBorder1", 
                    "shininess": 2.5, 
                    "specular": [ 0.5, 0.7, 0.5, 1]
                }, 
                "textures": 
                [ {
                    "file": "textures/sol_2.png", 
                    "mag_filter": "LINEAR", 
                    "min_filter": "LINEAR_MIPMAP_LINEAR"
                }, 
                  {
                      "file": "textures/floor_shadow.png", 
                      "mag_filter": "NEAREST", 
                      "min_filter": "NEAREST",
                      "wrap_s": "REPEAT",
                      "wrap_t": "MIRRORED_REPEAT"
                  }
                ]
            }
        };

        var result = osgDB.parseSceneGraph(tree);
        ok(result.getStateSet() !== undefined, "check old stateset");
        var material = result.getStateSet().getAttribute('Material');
        var materialCheck = ( material !== undefined &&
                              check_near(material.getAmbient(), [0.5, 0.5, 0.5, 1]) && 
                              check_near(material.getDiffuse(), [0.1, 0.1, 0.1, .1]) && 
                              check_near(material.getEmission(), [0.0, 0.0, 0.0, .5]) && 
                              check_near(material.getSpecular(), [0.5, 0.7, 0.5, 1]) &&
                              check_near(material.getShininess(), 2.5) && 
                              material.getName() === "FloorBorder1");

        ok(materialCheck, "check old material");
        var texture = result.getStateSet().getTextureAttribute(1, 'Texture');
        var textureCheck = (texture !== undefined && 
                            texture.getWrapS() === osg.Texture.REPEAT && 
                            texture.getWrapT() === osg.Texture.MIRRORED_REPEAT &&
                            texture.getMinFilter() === osg.Texture.NEAREST && 
                            texture.getMagFilter() === osg.Texture.NEAREST);
        ok(textureCheck, "check old texture");

    })();


    (function() {
        var tree = { 
            'StateSet': {
                'BlendFunc': {
                    'SourceRGB': 'SRC_ALPHA',
                    'DestinationRGB': 'ONE_MINUS_SRC_ALPHA',
                    'SourceAlpha': 'SRC_ALPHA',
                    'DestinationAlpha': 'ONE_MINUS_SRC_ALPHA'
                },
                "Material": {
                    "Ambient": [ 0.5, 0.5, 0.5, 1], 
                    "Diffuse": [ .1, .1, .1, .1], 
                    "Emission": [ 0, 0, 0, .5], 
                    "Name": "FloorBorder1", 
                    "Shininess": 2.5, 
                    "Specular": [ 0.5, 0.7, 0.5, 1]
                }, 
            }
        };

        var result = osgDB.parseSceneGraph(tree);
        ok(result.getStateSet() !== undefined, "check last StateSet");
        ok(result.getStateSet().getAttribute('BlendFunc') !== undefined, "check BlendFunc");
        var material = result.getStateSet().getAttribute('Material');
        var materialCheck = ( material !== undefined &&
                              check_near(material.getAmbient(), [0.5, 0.5, 0.5, 1]) && 
                              check_near(material.getDiffuse(), [0.1, 0.1, 0.1, .1]) && 
                              check_near(material.getEmission(), [0.0, 0.0, 0.0, .5]) && 
                              check_near(material.getSpecular(), [0.5, 0.7, 0.5, 1]) &&
                              check_near(material.getShininess(), 2.5) && 
                              material.getName() === "FloorBorder1");

        ok(materialCheck, "check Material");

    })();

});
