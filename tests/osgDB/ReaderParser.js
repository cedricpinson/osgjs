define( [
    'tests/mockup/mockup',
    'osgDB/ReaderParser',
    'vendors/Q',
    'osg/Texture',
    'osgDB/Input',
    'osg/PrimitiveSet'
], function ( mockup, ReaderParser, Q, Texture, Input, PrimitiveSet ) {

    return function () {

        module( 'osgDB' );

        asyncTest( 'StateSet - MultiTextures', function () {
            var tree = {

                'stateset': {
                    'material': {
                        'ambient': [ 0.5, 0.5, 0.5, 1 ],
                        'diffuse': [ 0.1, 0.1, 0.1, 0.1 ],
                        'emission': [ 0, 0, 0, 0.5 ],
                        'name': 'FloorBorder1',
                        'shininess': 2.5,
                        'specular': [ 0.5, 0.7, 0.5, 1 ]
                    },
                    'textures': [ {
                        'file': 'textures/sol_2.png',
                        'mag_filter': 'LINEAR',
                        'min_filter': 'LINEAR_MIPMAP_LINEAR'
                    }, {
                        'file': 'textures/floor_shadow.png',
                        'mag_filter': 'NEAREST',
                        'min_filter': 'NEAREST',
                        'wrap_s': 'REPEAT',
                        'wrap_t': 'MIRRORED_REPEAT'
                    } ]
                }
            };

            Q.when( ReaderParser.parseSceneGraph( tree ) ).then( function ( result ) {

                ok( result.getStateSet() !== undefined, 'check old stateset' );
                var material = result.getStateSet().getAttribute( 'Material' );
                var materialCheck = ( material !== undefined &&
                    mockup.check_near( material.getAmbient(), [ 0.5, 0.5, 0.5, 1 ] ) &&
                    mockup.check_near( material.getDiffuse(), [ 0.1, 0.1, 0.1, 0.1 ] ) &&
                    mockup.check_near( material.getEmission(), [ 0.0, 0.0, 0.0, 0.5 ] ) &&
                    mockup.check_near( material.getSpecular(), [ 0.5, 0.7, 0.5, 1 ] ) &&
                    mockup.check_near( material.getShininess(), 2.5 ) &&
                    material.getName() === 'FloorBorder1' );

                ok( materialCheck, 'check old material' );
                var texture = result.getStateSet().getTextureAttribute( 1, 'Texture' );
                var textureCheck = ( texture !== undefined &&
                    texture.getWrapS() === Texture.REPEAT &&
                    texture.getWrapT() === Texture.MIRRORED_REPEAT &&
                    texture.getMinFilter() === Texture.NEAREST &&
                    texture.getMagFilter() === Texture.NEAREST );
                ok( textureCheck, 'check old texture' );
                start();
            } );
        } );

        asyncTest( 'StateSet - BlendFunc, Material', function () {
            var tree = {
                'osg.Node': {
                    'StateSet': {
                        'osg.StateSet': {
                            'AttributeList': [ {
                                'osg.BlendFunc': {
                                    'SourceRGB': 'SRC_ALPHA',
                                    'DestinationRGB': 'ONE_MINUS_SRC_ALPHA',
                                    'SourceAlpha': 'SRC_ALPHA',
                                    'DestinationAlpha': 'ONE_MINUS_SRC_ALPHA'
                                }
                            }, {
                                'osg.Material': {
                                    'Name': 'FloorBorder1',
                                    'Ambient': [ 0.5, 0.5, 0.5, 1 ],
                                    'Diffuse': [ 0.1, 0.1, 0.1, 0.1 ],
                                    'Emission': [ 0, 0, 0, 0.5 ],
                                    'Shininess': 2.5,
                                    'Specular': [ 0.5, 0.7, 0.5, 1 ]
                                }
                            } ],
                            'TextureAttributeList': [
                                [ {
                                    'osg.Texture': {
                                        'File': '/unknown.png',
                                        'MagFilter': 'LINEAR',
                                        'MinFilter': 'LINEAR_MIPMAP_LINEAR',
                                        'WrapS': 'REPEAT',
                                        'WrapT': 'CLAMP_TO_EDGE'
                                    }
                                } ]
                            ]
                        }
                    }
                }
            };

            var promise = ( new Input() ).setJSON( tree ).readObject();
            Q.when( promise ).then( function ( result ) {

                ok( result.getStateSet() !== undefined, 'check last StateSet' );
                ok( result.getStateSet().getAttribute( 'BlendFunc' ) !== undefined, 'check BlendFunc' );
                var material = result.getStateSet().getAttribute( 'Material' );
                var materialCheck = ( material !== undefined &&
                    mockup.check_near( material.getAmbient(), [ 0.5, 0.5, 0.5, 1 ] ) &&
                    mockup.check_near( material.getDiffuse(), [ 0.1, 0.1, 0.1, 0.1 ] ) &&
                    mockup.check_near( material.getEmission(), [ 0.0, 0.0, 0.0, 0.5 ] ) &&
                    mockup.check_near( material.getSpecular(), [ 0.5, 0.7, 0.5, 1 ] ) &&
                    mockup.check_near( material.getShininess(), 2.5 ) &&
                    material.getName() === 'FloorBorder1' );

                ok( materialCheck, 'check Material' );
                var texture = result.getStateSet().getTextureAttribute( 0, 'Texture' );
                ok( texture !== undefined, 'Check texture' );
                ok( texture.getWrapS() === Texture.REPEAT, 'Check wraps texture' );
                ok( texture.getWrapT() === Texture.CLAMP_TO_EDGE, 'Check wrapt texture' );
                ok( texture.getMinFilter() === Texture.LINEAR_MIPMAP_LINEAR, 'Check min filter texture' );
                ok( texture.getMagFilter() === Texture.LINEAR, 'Check mag filter texture' );
                start();
            } );
        } );


        asyncTest( 'Geometry Cube UserData', function () {
            var tree = {
                'osg.Geometry': {
                    'Name': 'Cube',
                    'StateSet': {
                        'osg.StateSet': {
                            'Name': 'Material',
                            'AttributeList': [ {
                                'osg.Material': {
                                    'Name': 'Material',
                                    'Ambient': [ 0.8, 0.8, 0.8, 1 ],
                                    'Diffuse': [ 0.64, 0.64, 0.64, 1 ],
                                    'Emission': [ 0, 0, 0, 1 ],
                                    'Shininess': 12.5,
                                    'Specular': [ 0.5, 0.5, 0.5, 1 ]
                                }
                            } ],
                            'UserDataContainer': {
                                'UniqueID': 23,
                                'Values': [ {
                                    'Name': 'source',
                                    'Value': 'blender'
                                }, {
                                    'Name': 'DiffuseIntensity',
                                    'Value': '1.0'
                                }, {
                                    'Name': 'DiffuseColor',
                                    'Value': '[ 0, 0, 0 ]'
                                }, {
                                    'Name': 'SpecularIntensity',
                                    'Value': '0.0'
                                }, {
                                    'Name': 'SpecularColor',
                                    'Value': '[ 1, 1, 1 ]'
                                }, {
                                    'Name': 'SpecularHardness',
                                    'Value': '50'
                                }, {
                                    'Name': 'Emit',
                                    'Value': '0.0'
                                }, {
                                    'Name': 'Ambient',
                                    'Value': '1.0'
                                }, {
                                    'Name': 'Translucency',
                                    'Value': '0.0'
                                } ]
                            }
                        }
                    },
                    'VertexAttributeList': {
                        'Normal': {
                            'Elements': [ 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, -0, 1, 0, -0, 1, 0, -0, 1, 0, -0, 1, 1, -0, 0, 1, -0, 0, 1, -0, 0, 1, -0, 0, -0, -1, -0, -0, -1, -0, -0, -1, -0, -0, -1, -0, -1, 0, -0, -1, 0, -0, -1, 0, -0, -1, 0, -0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0 ],
                            'ItemSize': 3,
                            'Type': 'ARRAY_BUFFER'
                        },
                        'Vertex': {
                            'Elements': [ 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, -1, -1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1 ],
                            'ItemSize': 3,
                            'Type': 'ARRAY_BUFFER'
                        }
                    },
                    'PrimitiveSetList': [ {
                        'DrawElementUShort': {
                            'Indices': {
                                'Elements': [ 0, 1, 3, 1, 2, 3, 4, 5, 7, 5, 6, 7, 8, 9, 11, 9, 10, 11, 12, 13, 15, 13, 14, 15, 16, 17, 19, 17, 18, 19, 20, 21, 23, 21, 22, 23 ],
                                'ItemSize': 1,
                                'Type': 'ELEMENT_ARRAY_BUFFER'
                            },
                            'Mode': 'TRIANGLES'
                        }
                    } ]
                }
            };

            Q.when( ( new Input() ).setJSON( tree ).readObject() ).then( function ( result ) {
                ok( result.getStateSet() !== undefined, 'check geometry StateSet' );
                ok( result.getStateSet().getUserData() !== undefined, 'check StateSet userdata' );
                ok( result.getPrimitiveSetList().length == 1, 'check primitives' );
                ok( result.getPrimitiveSetList()[ 0 ].getMode() === PrimitiveSet.TRIANGLES, 'check triangles primitive' );
                ok( result.getPrimitiveSetList()[ 0 ].getFirst() === 0, 'check triangles first index' );
                ok( result.getPrimitiveSetList()[ 0 ].getIndices().getElements().length === 36, 'check triangles indices' );
                ok( result.getPrimitiveSetList()[ 0 ].getIndices().getElements().length === result.getPrimitiveSetList()[ 0 ].getCount(), 'check triangles count' );
                ok( window.Object.keys( result.getVertexAttributeList() ).length === 2, 'check vertex attributes' );
                start();
            } );
        } );


        asyncTest( 'MatrixTransform', function () {
            var tree = {
                'osg.MatrixTransform': {
                    'Name': 'Lamp',
                    'Matrix': [ -0.2909, 0.9552, -0.0552, 0, -0.7711, -0.1999, 0.6045, 0, 0.5664, 0.2184, 0.7947, 0, 4.0762, 1.0055, 5.9039, 1 ],
                    'Children': [ {
                        'osg.Node': {
                            'Name': 'Lamp'
                        }
                    } ]
                }
            };

            Q.when( ( new Input() ).setJSON( tree ).readObject() ).then( function ( result ) {
                ok( result.getName() === 'Lamp', 'check matrix transform' );
                ok( result.getMatrix()[ 0 ] === -0.2909, 'check matrix transform content' );
                start();
            } );
        } );


        asyncTest( 'BasicAnimationManager', function () {
            var tree = {
                'osg.Node': {
                    'Name': 'Root',
                    'UpdateCallbacks': [ {
                        'osgAnimation.BasicAnimationManager': {
                            'Animations': [ {
                                'osgAnimation.Animation': {
                                    'Name': 'Test',
                                    'Channels': [ {
                                        'osgAnimation.Vec3LerpChannel': {
                                            'Name': 'translate',
                                            'KeyFrames': [
                                                [ 0, -15.7923,
                                                    781.26,
                                                    136.075
                                                ]
                                            ],
                                            'TargetName': 'Zeppelin_2'
                                        }
                                    }, {
                                        'osgAnimation.Vec3LerpChannel': {
                                            'Name': 'scale',
                                            'KeyFrames': [
                                                [ 0,
                                                    1,
                                                    1,
                                                    1
                                                ],
                                                [ 39.96,
                                                    1,
                                                    1,
                                                    1
                                                ]
                                            ],
                                            'TargetName': 'Zeppelin_2'
                                        }
                                    } ]
                                }
                            } ]
                        }
                    } ]
                }
            };
            Q.when( ( new Input() ).setJSON( tree ).readObject() ).then( function ( result ) {
                ok( result.getUpdateCallbackList().length === 1, 'check update callback' );

                ok( result.getUpdateCallback().getAnimationMap().Test !== undefined, 'check animation list' );
                var animation = result.getUpdateCallback().getAnimationMap().Test;
                ok( animation !== undefined, 'check animation' );
                ok( animation.getChannels().length === 2, 'check channels' );
                ok( animation.getChannels()[ 1 ].getName() === 'scale', 'check channel 1' );
                ok( animation.getChannels()[ 1 ].getTargetName() === 'Zeppelin_2', 'check taget channel 1' );
                ok( animation.getChannels()[ 1 ].getSampler().getKeyframes().length === 2, 'check keyframes on channel 1' );
                start();
            } );

        } );


        asyncTest( 'FloatLerpChannel', function () {
            var tree = {
                'osgAnimation.FloatLerpChannel': {
                    'Name': 'euler_x',
                    'TargetName': 'Cube',
                    'KeyFrames': [
                        [ -0.04, 0 ],
                        [ 0.36, -0 ]
                    ]
                }
            };

            Q.when( ( new Input() ).setJSON( tree ).readObject() ).then( function ( result ) {
                ok( result.getKeyframes().length === 2, 'Check keyframes FloatLerpChannel' );
                ok( result.getTargetName() === 'Cube', 'Check TargetName FloatLerpChannel' );
                ok( result.getName() === 'euler_x', 'Check Name FloatLerpChannel' );
                start();
            } );
        } );


        asyncTest( 'QuatSlerpChannel', function () {
            var tree = {
                'osgAnimation.QuatSlerpChannel': {
                    'Name': 'quaternion',
                    'TargetName': 'Cube',
                    'KeyFrames': [
                        [ -0.04, 0, 0, 0, 1 ],
                        [ 0.36, -0, 0, 0, 1 ]
                    ]
                }
            };
            Q.when( ( new Input() ).setJSON( tree ).readObject() ).then( function ( result ) {
                ok( result.getKeyframes().length === 2, 'Check keyframes QuatSlerpChannel' );
                ok( result.getTargetName() === 'Cube', 'Check TargetName QuatSlerpChannel' );
                ok( result.getName() === 'quaternion', 'Check Name QuatSlerpChannel' );
                start();
            } );
        } );


        asyncTest( 'QuatLerpChannel', function () {
            var tree = {
                'osgAnimation.QuatLerpChannel': {
                    'Name': 'quaternion',
                    'TargetName': 'Cube',
                    'KeyFrames': [
                        [ -0.04, 0, 0, 0, 1 ],
                        [ 0.36, -0, 0, 0, 1 ]
                    ]
                }
            };

            Q.when( ( new Input() ).setJSON( tree ).readObject() ).then( function ( result ) {
                ok( result.getKeyframes().length === 2, 'Check keyframes QuatLerpChannel' );
                ok( result.getTargetName() === 'Cube', 'Check TargetName QuatLerpChannel' );
                ok( result.getName() === 'quaternion', 'Check Name QuatLerpChannel' );
                start();
            } );

        } );


        asyncTest( 'StackedTransform', function () {

            var tree = {
                'osg.MatrixTransform': {
                    'Name': 'Cube',
                    'Matrix': [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ],
                    'UpdateCallbacks': [ {
                        'osgAnimation.UpdateMatrixTransform': {
                            'Name': 'Cube',
                            'StackedTransforms': [ {
                                'osgAnimation.StackedTranslate': {
                                    'Name': 'translate',
                                    'Translate': [ 0, 0, 0 ]
                                }
                            }, {
                                'osgAnimation.StackedRotateAxis': {
                                    'Name': 'euler_z',
                                    'Angle': 0,
                                    'Axis': [ 0, 0, 1 ]
                                }
                            }, {
                                'osgAnimation.StackedRotateAxis': {
                                    'Name': 'euler_y',
                                    'Angle': 0,
                                    'Axis': [ 0, 1, 0 ]
                                }
                            }, {
                                'osgAnimation.StackedRotateAxis': {
                                    'Name': 'euler_x',
                                    'Angle': 0,
                                    'Axis': [ 1, 0, 0 ]
                                }
                            }, {
                                'osgAnimation.StackedQuaternion': {
                                    'Name': 'quaternion',
                                    'Quaternion': [ 0, 0, 0, 1 ]
                                }
                            } ]
                        }
                    } ]
                }
            };

            Q.when( ( new Input() ).setJSON( tree ).readObject() ).then( function ( result ) {
                ok( result.getUpdateCallbackList().length === 1, 'check osgAnimation.UpdateMatrixTransform callback' );
                ok( result.getUpdateCallback().getStackedTransforms().length === 5, 'check osgAnimation.UpdateMatrixTransform stacked transform' );
                start();
            } );

        } );


        asyncTest( 'DrawArray', function () {
            var tree = {
                'osg.Geometry': {
                    'PrimitiveSetList': [ {
                        'DrawArray': {
                            'count': 3540,
                            'first': 10,
                            'mode': 'TRIANGLES'
                        }
                    } ],
                    'VertexAttributeList': {}
                }
            };

            Q.when( ( new Input() ).setJSON( tree ).readObject() ).then( function ( result ) {
                return result;
            } ).then( function ( geom ) {
                var result = geom.getPrimitiveSetList()[ 0 ];
                ok( result.getMode() === PrimitiveSet.TRIANGLES, 'check DrawArray triangles' );
                ok( result.getCount() === 3540, 'check triangles count' );
                ok( result.getFirst() === 10, 'check triangles first' );
                start();
            } );
        } );

        asyncTest( 'DrawArrays', function () {
            var tree2 = {
                'osg.Geometry': {
                    'PrimitiveSetList': [ {
                        'DrawArrays': {
                            'Count': 0,
                            'First': 0,
                            'Mode': 'TRIANGLES'
                        }
                    } ],
                    'VertexAttributeList': {}
                }
            };

            Q.when( ( new Input() ).setJSON( tree2 ).readObject() ).then( function ( result ) {
                return result.getPrimitiveSetList()[ 0 ];
            } ).then( function ( result ) {
                ok( result.getMode() === PrimitiveSet.TRIANGLES, 'check DrawArray triangles' );
                ok( result.getCount() === 0, 'check triangles count' );
                ok( result.getFirst() === 0, 'check triangles first' );
                start();
            } );
        } );



        asyncTest( 'DrawArrayLengths', function () {
            var tree = {
                'osg.Geometry': {
                    'PrimitiveSetList': [ {
                        'DrawArrayLengths': {
                            'First': 10,
                            'Mode': 'TRIANGLES',
                            'ArrayLengths': [ 3, 3, 3 ]
                        }
                    } ],
                    'VertexAttributeList': {}
                }
            };

            Q.when( ( new Input() ).setJSON( tree ).readObject() ).then( function ( result ) {
                return result.getPrimitiveSetList()[ 0 ];
            } ).then( function ( result ) {
                ok( result.getMode() === PrimitiveSet.TRIANGLES, 'check DrawArrayLengths triangles' );
                ok( result.getArrayLengths()[ 0 ] === 3, 'check array lenght' );
                ok( result.getFirst() === 10, 'check triangles first' );
                start();
            } );

        } );


        asyncTest( 'LightSource', function () {
            var tree = {
                'osg.LightSource': {
                    'Name': 'Lamp.005',
                    'Light': {
                        'osg.Light': {
                            'Ambient': [ 0, 0, 0, 1 ],
                            'ConstantAttenuation': 1,
                            'Diffuse': [ 0.88, 0.70901, 0.48297, 1 ],
                            'Direction': [ 0, 0, -1 ],
                            'LightNum': 1,
                            'LinearAttenuation': 0,
                            'Position': [ 0, 0, 1, 0 ],
                            'QuadraticAttenuation': 0,
                            'Specular': [ 0.88, 0.88, 0.88, 1 ],
                            'SpotCutoff': 180,
                            'SpotExponent': 0
                        }
                    }
                }
            };

            Q.when( ( new Input() ).setJSON( tree ).readObject() ).then( function ( result ) {
                ok( result.getLight() !== undefined, 'check if LightSource has a light' );
                start();
            } );
        } );


    };
} );
