'use strict';
var assert = require( 'chai' ).assert;
var mockup = require( 'tests/mockup/mockup' );
var ReaderParser = require( 'osgDB/ReaderParser' );
var Texture = require( 'osg/Texture' );
var Input = require( 'osgDB/Input' );
var PrimitiveSet = require( 'osg/PrimitiveSet' );


module.exports = function () {

    test( 'StateSet - MultiTextures', function () {
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

        // TODO it uses the old sync parseSceneGraphDeprecated
        var result = ReaderParser.parseSceneGraph( tree );

        assert.isOk( result.getStateSet() !== undefined, 'check old stateset' );
        var material = result.getStateSet().getAttribute( 'Material' );
        var materialCheck = ( material !== undefined &&
            mockup.checkNear( material.getAmbient(), [ 0.5, 0.5, 0.5, 1 ] ) &&
            mockup.checkNear( material.getDiffuse(), [ 0.1, 0.1, 0.1, 0.1 ] ) &&
            mockup.checkNear( material.getEmission(), [ 0.0, 0.0, 0.0, 0.5 ] ) &&
            mockup.checkNear( material.getSpecular(), [ 0.5, 0.7, 0.5, 1 ] ) &&
            mockup.checkNear( material.getShininess(), 2.5 ) &&
            material.getName() === 'FloorBorder1' );

        assert.isOk( materialCheck, 'check old material' );
        var texture = result.getStateSet().getTextureAttribute( 1, 'Texture' );
        var textureCheck = ( texture !== undefined &&
            texture.getWrapS() === Texture.REPEAT &&
            texture.getWrapT() === Texture.MIRRORED_REPEAT &&
            texture.getMinFilter() === Texture.NEAREST &&
            texture.getMagFilter() === Texture.NEAREST );
        assert.isOk( textureCheck, 'check old texture' );
    } );

    test( 'StateSet - BlendFunc, Material', function ( done ) {
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

        ( new Input() ).setJSON( tree ).readObject().then( function ( result ) {

            assert.isOk( result.getStateSet() !== undefined, 'check last StateSet' );
            assert.isOk( result.getStateSet().getAttribute( 'BlendFunc' ) !== undefined, 'check BlendFunc' );
            var material = result.getStateSet().getAttribute( 'Material' );
            var materialCheck = ( material !== undefined &&
                mockup.checkNear( material.getAmbient(), [ 0.5, 0.5, 0.5, 1 ] ) &&
                mockup.checkNear( material.getDiffuse(), [ 0.1, 0.1, 0.1, 0.1 ] ) &&
                mockup.checkNear( material.getEmission(), [ 0.0, 0.0, 0.0, 0.5 ] ) &&
                mockup.checkNear( material.getSpecular(), [ 0.5, 0.7, 0.5, 1 ] ) &&
                mockup.checkNear( material.getShininess(), 2.5 ) &&
                material.getName() === 'FloorBorder1' );

            assert.isOk( materialCheck, 'check Material' );
            var texture = result.getStateSet().getTextureAttribute( 0, 'Texture' );
            assert.isOk( texture !== undefined, 'Check texture' );
            assert.isOk( texture.getWrapS() === Texture.REPEAT, 'Check wraps texture' );
            assert.isOk( texture.getWrapT() === Texture.CLAMP_TO_EDGE, 'Check wrapt texture' );
            assert.isOk( texture.getMinFilter() === Texture.LINEAR_MIPMAP_LINEAR, 'Check min filter texture' );
            assert.isOk( texture.getMagFilter() === Texture.LINEAR, 'Check mag filter texture' );
            done();
        } );
    } );


    test( 'Geometry Cube UserData', function ( done ) {
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

        ( new Input() ).setJSON( tree ).readObject().then( function ( result ) {
            assert.isOk( result.getStateSet() !== undefined, 'check geometry StateSet' );
            assert.isOk( result.getStateSet().getUserData() !== undefined, 'check StateSet userdata' );
            assert.isOk( result.getPrimitiveSetList().length === 1, 'check primitives' );
            assert.isOk( result.getPrimitiveSetList()[ 0 ].getMode() === PrimitiveSet.TRIANGLES, 'check triangles primitive' );
            assert.isOk( result.getPrimitiveSetList()[ 0 ].getFirst() === 0, 'check triangles first index' );
            assert.isOk( result.getPrimitiveSetList()[ 0 ].getIndices().getElements().length === 36, 'check triangles indices' );
            assert.isOk( result.getPrimitiveSetList()[ 0 ].getIndices().getElements().length === result.getPrimitiveSetList()[ 0 ].getCount(), 'check triangles count' );
            assert.isOk( window.Object.keys( result.getVertexAttributeList() ).length === 2, 'check vertex attributes' );
            done();
        } );
    } );


    test( 'MatrixTransform', function ( done ) {
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

        ( new Input() ).setJSON( tree ).readObject().then( function ( result ) {
            assert.isOk( result.getName() === 'Lamp', 'check matrix transform' );
            assert.isOk( result.getMatrix()[ 0 ] === -0.2909, 'check matrix transform content' );
            done();
        } );
    } );


    test( 'BasicAnimationManager', function ( done ) {
        var tree = {
            'osg.Node': {
                'UniqueID': 0,
                'Name': 'brindherbetrs.FBX',
                'UpdateCallbacks': [ {
                    'osgAnimation.BasicAnimationManager': {
                        'Animations': [ {
                            'osgAnimation.Animation': {
                                'Name': 'Take 001',
                                'Channels': [ {
                                    'osgAnimation.FloatCubicBezierChannel': {
                                        'Name': 'rotateX',
                                        'TargetName': 'BetaHighResMeshes',
                                        'KeyFrames': {
                                            'ControlPointIn': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ 1.5708 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            },
                                            'ControlPointOut': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ 1.5708 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            },
                                            'Position': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ 1.5708 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            },
                                            'Time': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ 0 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            }
                                        }
                                    }
                                }, {
                                    'osgAnimation.FloatCubicBezierChannel': {
                                        'Name': 'rotateY',
                                        'TargetName': 'BetaHighResMeshes',
                                        'KeyFrames': {
                                            'ControlPointIn': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ 0 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            },
                                            'ControlPointOut': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ -0 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            },
                                            'Position': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ -0 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            },
                                            'Time': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ 0 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            }
                                        }
                                    }
                                }, {
                                    'osgAnimation.FloatCubicBezierChannel': {
                                        'Name': 'rotateZ',
                                        'TargetName': 'BetaHighResMeshes',
                                        'KeyFrames': {
                                            'ControlPointIn': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ 0 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            },
                                            'ControlPointOut': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ 0 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            },
                                            'Position': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ 0 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            },
                                            'Time': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ 0 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            }
                                        }
                                    }
                                }, {
                                    'osgAnimation.FloatCubicBezierChannel': {
                                        'Name': 'rotateX',
                                        'TargetName': 'Box001',
                                        'KeyFrames': {
                                            'ControlPointIn': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ 1.5708 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            },
                                            'ControlPointOut': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ 1.5708 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            },
                                            'Position': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ 1.5708 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            },
                                            'Time': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ 0 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            }
                                        }
                                    }
                                }, {
                                    'osgAnimation.FloatCubicBezierChannel': {
                                        'Name': 'rotateY',
                                        'TargetName': 'Box001',
                                        'KeyFrames': {
                                            'ControlPointIn': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ 0 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            },
                                            'ControlPointOut': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ -0 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            },
                                            'Position': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ -0 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            },
                                            'Time': {
                                                'Array': {
                                                    'Float32Array': {
                                                        'Elements': [ 0 ],
                                                        'Size': 1
                                                    }
                                                },
                                                'ItemSize': 1,
                                                'Type': 'ARRAY_BUFFER'
                                            }
                                        }
                                    }
                                } ],
                                'StateSet': {
                                    'osg.StateSet': {
                                        'UniqueID': 1
                                    }
                                }
                            }
                        } ]
                    }
                } ]
            }
        };
        var input = ReaderParser.registry().clone();

        input.setJSON( tree ).readObject().then( function ( result ) {
            assert.isOk( result.getUpdateCallbackList().length === 1, 'check update callback' );
            assert.isOk( result.getUpdateCallback().getAnimations()[ 'Take 001' ] !== undefined, 'check animation list' );
            var animation = result.getUpdateCallback().getAnimations()[ 'Take 001' ];
            assert.isOk( animation.channels.length === 5, 'check channels' );
            assert.isOk( animation.channels[ 1 ].channel.name === 'rotateY', 'check channel 1' );
            assert.isOk( animation.channels[ 1 ].channel.target === 'BetaHighResMeshes', 'check taget channel 1' );
            done();
        } );

    } );


    test( 'FloatLerpChannel', function ( done ) {
        var tree = {
            'osgAnimation.FloatLerpChannel': {
                'Name': 'euler_x',
                'TargetName': 'Cube',
                'KeyFrames': {
                    'Key': {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159 ],
                                'Size': 28
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    },
                    'Time': {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 0, 0.133333, 0.166667, 0.2, 0.233333, 0.266667, 0.3, 0.333333, 0.866667, 0.9, 0.933333, 0.966667, 1, 1.76667, 1.8, 1.83333, 1.86667, 1.9, 1.93333, 1.96667, 2, 2.3, 2.33333, 2.36667, 2.4, 2.43333, 2.46667, 2.5 ],
                                'Size': 28
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }
                }
            }
        };

        var input = ReaderParser.registry().clone();

        input.setJSON( tree ).readObject().then( function ( result ) {
            assert.isOk( result.keys.length === 28, 'Check keys FloatLerpChannel' );
            assert.isOk( result.times.length === 28, 'Check times FloatLerpChannel' );
            assert.isOk( result.target === 'Cube', 'Check TargetName FloatLerpChannel' );
            done();
        } );
    } );


    test( 'QuatSlerpChannel', function ( done ) {
        var tree = {
            'osgAnimation.QuatSlerpChannel': {
                'Name': 'rotate_x',
                'TargetName': 'Cube',
                'KeyFrames': {
                    'Key': [ {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, ],
                                'Size': 7
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }, {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, ],
                                'Size': 7
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }, {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, ],
                                'Size': 7
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }, {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, ],
                                'Size': 7
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    } ],
                    'Time': {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 0, 0.133333, 0.166667, 0.2, 0.233333, 0.266667, 0.3 ],
                                'Size': 7
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }
                }
            }
        };
        var input = ReaderParser.registry().clone();

        input.setJSON( tree ).readObject().then( function ( result ) {
            assert.isOk( result.keys.length === 28, 'Check keys QuatSlerpChannel' );
            assert.isOk( result.times.length === 7, 'Check times QuatSlerpChannel' );
            assert.isOk( result.target === 'Cube', 'Check TargetName QuatSlerpChannel' );
            done();
        } );
    } );


    test( 'QuatLerpChannel', function ( done ) {
        var tree = {
            'osgAnimation.QuatLerpChannel': {
                'Name': 'rotate_x',
                'TargetName': 'Cube',
                'KeyFrames': {
                    'Key': [ {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, ],
                                'Size': 7
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }, {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, ],
                                'Size': 7
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }, {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, ],
                                'Size': 7
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }, {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, -3.14159, ],
                                'Size': 7
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    } ],
                    'Time': {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 0, 0.133333, 0.166667, 0.2, 0.233333, 0.266667, 0.3 ],
                                'Size': 7
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }
                }
            }
        };

        var input = ReaderParser.registry().clone();

        input.setJSON( tree ).readObject().then( function ( result ) {
            assert.isOk( result.keys.length === 28, 'Check keys QuatSlerpChannel' );
            assert.isOk( result.times.length === 7, 'Check times QuatSlerpChannel' );
            assert.isOk( result.target === 'Cube', 'Check TargetName QuatSlerpChannel' );
            done();
        } );

    } );


    test( 'FloatCubicBezierChannel', function ( done ) {

        var tree = {
            'osgAnimation.FloatCubicBezierChannel': {
                'Name': 'rotateX',
                'TargetName': 'Box001',
                'KeyFrames': {
                    'ControlPointIn': {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 1.5708 ],
                                'Size': 1
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    },
                    'ControlPointOut': {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 2.5708 ],
                                'Size': 1
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    },
                    'Position': {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 3.5708 ],
                                'Size': 1
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    },
                    'Time': {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 0 ],
                                'Size': 1
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }
                }
            }
        };

        var input = ReaderParser.registry().clone();

        input.setJSON( tree ).readObject().then( function ( result ) {
            assert.isOk( result.keys.length === 3, 'Check keys FloatCubicBezierChannel' );
            assert.isOk( result.times.length === 1, 'Check times FloatCubicBezierChannel' );
            assert.isOk( mockup.checkNear( result.keys[ 0 ], 3.5708 ), 'Ckeck Position' );
            assert.isOk( mockup.checkNear( result.keys[ 1 ], 1.5708 ), 'Check ControlIn' );
            assert.isOk( mockup.checkNear( result.keys[ 2 ], 2.5708 ), 'Check ControlOut' );
            assert.isOk( result.target === 'Box001', 'Check TargetName FloatCubicBezierChannel' );
            done();
        } );
    } );

    test( 'Vec3CubicBezierChannel', function ( done ) {

        var tree = {
            'osgAnimation.Vec3CubicBezierChannel': {
                'Name': 'scale',
                'TargetName': 'Bone004',
                'KeyFrames': {
                    'ControlPointIn': [ {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 1, 2.28678, 0.929234 ],
                                'Size': 3
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }, {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 1, 2.28678, 0.929234 ],
                                'Size': 3
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }, {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 1, 2.28678, 0.929234 ],
                                'Size': 3
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    } ],
                    'ControlPointOut': [ {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 2.28678, 0.929234, 1 ],
                                'Size': 3
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }, {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 2.28678, 0.929234, 1 ],
                                'Size': 3
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }, {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 2.28678, 0.929234, 1 ],
                                'Size': 3
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    } ],
                    'Position': [ {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 1, 2.28678, 0.929234 ],
                                'Size': 3
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }, {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 1, 2.28678, 0.929234 ],
                                'Size': 3
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }, {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 1, 2.28678, 0.929234 ],
                                'Size': 3
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    } ],
                    'Time': {
                        'Array': {
                            'Float32Array': {
                                'Elements': [ 0, 0.866667, 1.76667 ],
                                'Size': 3
                            }
                        },
                        'ItemSize': 1,
                        'Type': 'ARRAY_BUFFER'
                    }
                }
            }
        };

        var input = ReaderParser.registry().clone();

        input.setJSON( tree ).readObject().then( function ( result ) {
            assert.isOk( result.keys.length === 27, 'Check keys Vec3CubicBezierChannel' );
            assert.isOk( result.times.length === 3, 'Check times Vec3CubicBezierChannel' );
            assert.isOk( mockup.checkNear( result.keys[ 15 ], 0.92923402 ), 'Check value' );

            done();
        } );
    } );

    test( 'StackedTransform', function ( done ) {

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

        ( new Input() ).setJSON( tree ).readObject().then( function ( result ) {
            assert.isOk( result.getUpdateCallbackList().length === 1, 'check osgAnimation.UpdateMatrixTransform callback' );
            assert.isOk( result.getUpdateCallback().getStackedTransforms().length === 5, 'check osgAnimation.UpdateMatrixTransform stacked transform' );
            done();
        } );

    } );


    test( 'DrawArray', function ( done ) {
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

        ( new Input() ).setJSON( tree ).readObject().then( function ( result ) {
            return result;
        } ).then( function ( geom ) {
            var result = geom.getPrimitiveSetList()[ 0 ];
            assert.isOk( result.getMode() === PrimitiveSet.TRIANGLES, 'check DrawArray triangles' );
            assert.isOk( result.getCount() === 3540, 'check triangles count' );
            assert.isOk( result.getFirst() === 10, 'check triangles first' );
            done();
        } );
    } );

    test( 'DrawArrays', function ( done ) {
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

        ( new Input() ).setJSON( tree2 ).readObject().then( function ( result ) {
            return result.getPrimitiveSetList()[ 0 ];
        } ).then( function ( result ) {
            assert.isOk( result.getMode() === PrimitiveSet.TRIANGLES, 'check DrawArray triangles' );
            assert.isOk( result.getCount() === 0, 'check triangles count' );
            assert.isOk( result.getFirst() === 0, 'check triangles first' );
            done();
        } );
    } );



    test( 'DrawArrayLengths', function ( done ) {
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

        ( new Input() ).setJSON( tree ).readObject().then( function ( result ) {
            return result.getPrimitiveSetList()[ 0 ];
        } ).then( function ( result ) {
            assert.isOk( result.getMode() === PrimitiveSet.TRIANGLES, 'check DrawArrayLengths triangles' );
            assert.isOk( result.getArrayLengths()[ 0 ] === 3, 'check array lenght' );
            assert.isOk( result.getFirst() === 10, 'check triangles first' );
            done();
        } );

    } );


    test( 'LightSource', function ( done ) {
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

        ( new Input() ).setJSON( tree ).readObject().then( function ( result ) {
            assert.isOk( result.getLight() !== undefined, 'check if LightSource has a light' );
            done();
        } );
    } );

    test( 'Text', function ( done ) {
        var tree = {
            'osgText.Text': {
                'UniqueID': 1,
                'Text': 'test',
                'AutoRotateToScreen': 1,
                'CharacterSize': 20,
                'Color': [ 1, 1, 0, 1 ],
                'Position': [ 50, 974, 0 ],
                'Layout': 'LEFT_TO_RIGHT',
                'Alignment': 'CENTER_BOTTOM'
            }
        };
        ( new Input() ).setJSON( tree ).readObject().then( function ( result ) {
            assert.isOk( result.getText() === 'test', 'check text' );
            assert.isOk( result.getAutoRotateToScreen() === 1, 'check autoRotateToScreen' );
            assert.isOk( result.getCharacterSize() === 20, 'check characterSize' );
            assert.isOk( result.getPosition()[ 0 ] === 50, 'check Position' );
            assert.isOk( result.getColor()[ 0 ] === 1, 'check Color' );
            assert.isOk( result.getLayout() === 'ltr', 'check Layout' );
            assert.isOk( result.getAlignment() === 5, 'check Alignment' );
            done();
        } );
    } );

    test( 'PagedLOD', function ( done ) {
        var tree = {
            'osg.PagedLOD': {
                'UniqueID': 1,
                'Name': 'PAGEDLOD',
                'CenterMode': 'USER_DEFINED_CENTER',
                'RangeDataList': {
                    'File 0': 'cow.osgjs',
                    'File 1': 'cessna.osgjs'
                },
                'RangeList': {
                    'Range 0': [ 0, 2000 ],
                    'Range 1': [ 2000, 3.40282e+38 ]
                },
                'RangeMode': 'PIXEL_SIZE_ON_SCREEN',
                'UserCenter': [ 1, 2, 3, 10 ]
            }
        };
        ( new Input() ).setJSON( tree ).readObject().then( function ( result ) {
            assert.isOk( result._rangeMode === 1, 'check RangeMode' );
            assert.isOk( result._perRangeDataList.length === 2, 'check children number' );
            assert.isOk( result._perRangeDataList[ 0 ].filename === 'cow.osgjs', 'check child 0 filename' );
            assert.isOk( result._perRangeDataList[ 1 ].filename === 'cessna.osgjs', 'check child 1 filename' );
            assert.isOk( result._range.length === 2, 'check RangeList' );
            assert.isOk( result._radius === 10, 'check user defined radius' );
            done();
        } );
    } );

    test( 'Node Children Ordering', function ( done ) {
        var tree = {
            'osg.Node': {
                'UniqueID': 2,
                'Children': [ {
                    'osg.Node': {
                        'UniqueID': 3,
                        'Name': 'cow',
                        'Children': [ {
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
                        } ]
                    }
                }, {
                    'osg.Node': {
                        'UniqueID': 16,
                        'Name': 'cessna',
                        'Children': []
                    }
                } ]
            }
        };

        ( new Input() ).setJSON( tree ).readObject().then( function ( result ) {
            console.log( result.getChildren()[ 0 ].getName() );
            assert.isOk( result.getChildren()[ 0 ].getName() === 'cow', 'the first node should be cow' );
            assert.isOk( result.getChildren()[ 1 ].getName() === 'cessna', 'the second node should be cessna' );
            done();
        } );
    } );
};
