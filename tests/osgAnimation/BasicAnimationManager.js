define( [
    'tests/mockup/mockup',
    'osgAnimation/BasicAnimationManager',
    'osg/Utils',
    'vendors/Q',
    'osg/NodeVisitor',
    'osgDB/ReaderParser',
    'osgAnimation/LinkVisitor',
    'osg/Notify'
], function ( mockup, BasicAnimationManager, MACROUTILS, Q, NodeVisitor, ReaderParser, LinkVisitor, Notify ) {

    return function () {

        module( 'osgAnimation' );

        asyncTest( 'BasicAnimationManager', function () {
            var tree = {
                'Generator': 'OpenSceneGraph 3.1.0',
                'Version': 1,
                'osg.Node': {
                    'Children': [ {
                        'osg.Node': {
                            'Name': 'Root',
                            'UpdateCallbacks': [ {
                                'osgAnimation.BasicAnimationManager': {
                                    'Animations': [ {
                                        'osgAnimation.Animation': {
                                            'Name': 'Cube',
                                            'Channels': [ {
                                                'osgAnimation.Vec3LerpChannel': {
                                                    'Name': 'translate',
                                                    'TargetName': 'Cube',
                                                    'KeyFrames': [
                                                        [ -0.04, 0, 0, 0 ],
                                                        [ 0, 0.0232, 0, 0 ],
                                                        [ 0.76, 4.0612, 0, 0 ]
                                                    ]
                                                }
                                            }, {
                                                'osgAnimation.FloatLerpChannel': {
                                                    'Name': 'euler_x',
                                                    'TargetName': 'Cube',
                                                    'KeyFrames': [
                                                        [ -0.04, 0 ],
                                                        [ 0, 0 ],
                                                        [ 0.76, 1.5708 ]
                                                    ]
                                                }
                                            }, {
                                                'osgAnimation.FloatLerpChannel': {
                                                    'Name': 'euler_y',
                                                    'TargetName': 'Cube',
                                                    'KeyFrames': [
                                                        [ -0.04, 0 ],
                                                        [ 0, 0 ],
                                                        [ 0.76, -0 ]
                                                    ]
                                                }
                                            }, {
                                                'osgAnimation.FloatLerpChannel': {
                                                    'Name': 'euler_z',
                                                    'TargetName': 'Cube',
                                                    'KeyFrames': [
                                                        [ -0.04, 0 ],
                                                        [ 0, 0 ],
                                                        [ 0.76, 0 ]
                                                    ]
                                                }
                                            } ]
                                        }
                                    } ]
                                }
                            } ],
                            'Children': [ {
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
                                            } ]
                                        }
                                    } ],
                                    'Children': [ {
                                        'osg.Node': {
                                            'Name': 'GeodeCube',
                                            'Children': [ {
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
                                                            } ]
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
                                                    } ],
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
                                                    }
                                                }
                                            } ]
                                        }
                                    } ]
                                }
                            } ]
                        }
                    } ]
                }
            };

            ( function () {
                Q.when( ReaderParser.parseSceneGraph( tree ) ).then( function ( result ) {

                    var FindAnimationManagerVisitor = function () {
                        NodeVisitor.call( this, NodeVisitor.TRAVERSE_ALL_CHILDREN );
                        this._cb = undefined;
                    };
                    FindAnimationManagerVisitor.prototype = MACROUTILS.objectInehrit( NodeVisitor.prototype, {
                        init: function () {
                            this.found = [];
                        },
                        apply: function ( node ) {
                            var cbs = node.getUpdateCallbackList();
                            for ( var i = 0, l = cbs.length; i < l; i++ ) {
                                if ( cbs[ 0 ] instanceof BasicAnimationManager ) {
                                    this._cb = cbs[ 0 ];
                                    return;
                                }
                            }
                            this.traverse( node );
                        }
                    } );
                    var finder = new FindAnimationManagerVisitor();
                    result.accept( finder );
                    var animationManager = finder._cb;
                    var lv = new LinkVisitor();
                    lv.setAnimationMap( animationManager.getAnimationMap() );
                    result.accept( lv );
                    animationManager.buildTargetList();
                    ok( animationManager._targets.length === 4, 'Check targets' );

                    animationManager.playAnimation( 'Cube' );
                    animationManager.updateManager( 0 );
                    animationManager.updateManager( 0.5 );
                    //Notify.log( 'value ' + animationManager._targets[ 0 ].getValue() );
                    animationManager.updateManager( 1.0 );
                    ok( mockup.check_near( animationManager._targets[ 0 ].getValue(), [ 1.085831578947368, 0, 0 ] ), 'Check animation loop result' );

                    animationManager.stopAnimation( 'Cube' );
                    animationManager.updateManager( 2.0 );
                    animationManager.playAnimation( {
                        name: 'Cube',
                        loop: 1
                    } );
                    animationManager.updateManager( 2.5 );
                    //Notify.log( 'value ' + animationManager._targets[ 0 ].getValue() );
                    animationManager.updateManager( 3.0 );
                    ok( animationManager.isPlaying( 'Cube' ), false, 'Check animation is not active' );
                    ok( mockup.check_near( animationManager._targets[ 0 ].getValue(), [ 2.6797789473684217, 0, 0 ] ), 'Check animation once result' );
                    start();
                } );
            } )();
        } );
    };
} );
