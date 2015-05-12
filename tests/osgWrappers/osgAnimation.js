define( [
    'qunit',
    'q',
    'osgDB/Input',
    'osg/Notify',
    'osg/NodeVisitor',
    'osg/Utils',
    'osgAnimation/Bone',
    'osgAnimation/Skeleton',
    'osg/MatrixTransform',
    'osg/UpdateVisitor'
], function ( QUnit, Q, Input, Notify, NodeVisitor, MACROUTILS, Bone, Skeleton, MatrixTransform, UpdateVisitor ) {

    'use strict';

    return function () {

        QUnit.module( 'osgWrapper' );

        QUnit.asyncTest( 'osgAnimation', function () {

            var input = new Input();
            input.readNodeURL( '../examples/media/models/animation-test/brindherbetrs.osgjs' ).then( function ( scene ) {

                ok( scene !== undefined, true );

                var FindBoneVisitor = function () {
                    NodeVisitor.call( this, NodeVisitor.TRAVERSE_ALL_CHILDREN );
                    this._bones = [];
                };
                FindBoneVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {
                    init: function () {},
                    apply: function ( node ) {

                        if ( node.getTypeID() === Bone.getTypeID() ) {
                            this._bones.push( node );
                        }
                        this.traverse( node );
                    },
                    getBones: function () {
                        return this._bones;
                    },
                    getBone: function ( name ) {
                        var bones = this.getBones();
                        for ( var i = 0, l = bones.length; i < l; i++ ) {
                            var bone = bones[ i ];
                            if ( bone.getName() === name ) {
                                return bone;
                            }
                        }
                        return undefined;
                    }
                } );

                var finder = new FindBoneVisitor();
                scene.accept( finder );

                var bones = finder.getBones();

                console.log( bones );

                var bone003 = finder.getBone( 'Bone003' );
                ok( bone003 !== undefined, 'Get "Bone003"' );

                console.log( bone003.getMatrixInSkeletonSpace() );
                console.log( bone003.getInvBindMatrixInSkeletonSpace() );

                var bone001 = finder.getBone( 'Bone001' );
                ok( bone001 !== undefined, 'Get "Bone001"' );

                ok( bone001.getBoneParent() === undefined, 'Check no parent bone to first bone' );


                var bone005 = finder.getBone( 'Bone005' );
                ok( bone005 !== undefined, 'Get "Bone005"' );

                ok( bone005.children.length === 0, 'Check no child bone to the last bone' );


                var FindSkeletonVisitor = function () {
                    NodeVisitor.call( this, NodeVisitor.TRAVERSE_ALL_CHILDREN );
                    this._skeletons = [];
                };
                FindSkeletonVisitor.prototype = MACROUTILS.objectInherit( NodeVisitor.prototype, {
                    init: function () {},
                    apply: function ( node ) {
                        if ( node.getTypeID() === Skeleton.getTypeID() ) {
                            this._skeletons.push( node );
                        }
                        this.traverse( node );
                    },
                    getSkeletons: function () {
                        return this._skeletons;
                    }
                } );

                var sklFinder = new FindSkeletonVisitor();
                scene.accept( sklFinder );

                var skls = sklFinder.getSkeletons();
                console.log( skls.length );
                console.log( skls );


                var skl = skls[ 0 ];


                //Test validate Skeleton visitor
                var uv = new UpdateVisitor();
                //scene.accept(uv);
                //skl.getUpdateCallback().update( skl, uv );
                uv.apply = function ( node ) {
                    if ( node.getTypeID() === Bone.getTypeID() || node.getTypeID() === Skeleton.getTypeID() ) {
                        var ncs = node.getUpdateCallbackList();

                        if ( ncs.length )
                            for ( var j = 0, m = ncs.length; j < m; j++ ) {
                                if ( !ncs[ j ].update( node, this ) ) {
                                    return;
                                }
                            }
                    }
                    this.traverse( node );
                };

                //Call UpdateVisitor
                scene.accept( uv );

                //Make a dirty state
                var mt = new MatrixTransform();
                bone003.addChild( mt );

                var b = new Bone();
                bone003.addChild( b );

                //Reset skelton update callback flag
                skl.getUpdateCallback()._needValidate = true;

                scene.accept( uv );

                // bone003.setDefaultUpdateCallback();
                // //finder.getBone('Bone004').setDefaultUpdateCallback();
                // bone003.getUpdateCallback().update( bone003, uv );


                console.log( scene );
                start();


            } ).fail( function ( error ) {
                Notify.error( error );
            } );


        } );

    };
} );
