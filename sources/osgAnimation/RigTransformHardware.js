define( [

    'osg/Utils',
    'osg/NodeVisitor',
    'osg/Notify',
    'osg/Matrix',
    'osg/Program',
    'osg/Shader',
    'osg/StateAttribute',
    'osg/Uniform',
    'osgAnimation/AnimationAttribute',
    'osgAnimation/CollectBoneVisitor'
], function ( MACROUTILS, NodeVisitor, Notify, Matrix, Program, Shader, StateAttribute, Uniform, AnimationAttribute, CollectBoneVisitor ) {

    'use strict';

    /**
     * Hardware implementation for rigGeometry
     *
     */
    var RigTransformHardware = function () {
        this._needInit = true;

        // bones are sorted to be used directly by
        // computeMatrixPalette
        // means the
        this._bones = [];
    };


    RigTransformHardware.prototype = {

        // boneNameID contains a map: boneName: id
        // {
        //    'bone0' : 1,
        //    'bone4' : 0,
        // }
        //
        // boneMap contains a map: boneName: Bone
        // {
        //    'bone0: : Bone object,
        //    'bone1: : Bone object,
        // }
        //
        // return index / bone object
        // [
        //    Bone4 object,
        //    Bone0 object
        // ]
        computeBonePalette: function ( boneMap, boneNameID ) {
            var keys = Object.keys( boneMap );
            var size = keys.length;
            var bones = this._bones;


            for ( var i = 0; i < size; i++ ) {
                var bName = keys[ i ];
                var index = boneNameID[ bName ];
                var bone = boneMap[ bName ];

                if ( index !== undefined )
                    bones[ index ] = bone;
            }

            return bones;
        },


        init: function ( geom ) {

            // init the bones map

            // stop here
            // compute bonemap / index
            var mapVisitor = new CollectBoneVisitor();
            geom.getSkeleton().accept( mapVisitor );
            var bm = mapVisitor.getBoneMap();

            this.computeBonePalette( bm, geom._boneNameID );

            // matrix are 4x3
            var nbVec4Uniforms = this._bones.length * 3;
            var matrix = new Float32Array( nbVec4Uniforms * 4 );
            this._matrixPalette = new Uniform.createFloat4Array( matrix, 'uBones' );

            var st = geom.getStateSetAnimation();


            var animAttrib = new AnimationAttribute( nbVec4Uniforms );
            st.setAttributeAndModes( animAttrib, StateAttribute.ON );
            animAttrib.setMatrixPalette( this._matrixPalette );

            this._needInit = false;
            return true;
        },


        computeMatrixPalette: ( function () {

            var mTmp = Matrix.create();

            return function ( transformFromSkeletonToGeometry, invTransformFromSkeletonToGeometry ) {

                var bones = this._bones;
                var uniformTypedArray = this._matrixPalette.get();
                var uniformIndex = 0;

                for ( var i = 0, l = bones.length; i < l; i++ ) {
                    var bone = bones[ i ];

                    var invBindMatrix = bone.getInvBindMatrixInSkeletonSpace();
                    var boneMatrix = bone.getMatrixInSkeletonSpace();

                    Matrix.mult( boneMatrix, invBindMatrix, mTmp );
                    Matrix.postMult( invTransformFromSkeletonToGeometry, mTmp );
                    Matrix.preMult( mTmp, transformFromSkeletonToGeometry );

                    // TODO: maybe change upload order so that we can use
                    // glsl constructor :
                    // mat4(uBones[index], uBones[index+1], uBones[index+2], vec4(0.0, 0.0, 0.0, 1.0))
                    // for faster glsl
                    uniformTypedArray[ uniformIndex++ ] = mTmp[ 0 ];
                    uniformTypedArray[ uniformIndex++ ] = mTmp[ 4 ];
                    uniformTypedArray[ uniformIndex++ ] = mTmp[ 8 ];
                    uniformTypedArray[ uniformIndex++ ] = mTmp[ 12 ];

                    uniformTypedArray[ uniformIndex++ ] = mTmp[ 1 ];
                    uniformTypedArray[ uniformIndex++ ] = mTmp[ 5 ];
                    uniformTypedArray[ uniformIndex++ ] = mTmp[ 9 ];
                    uniformTypedArray[ uniformIndex++ ] = mTmp[ 13 ];

                    uniformTypedArray[ uniformIndex++ ] = mTmp[ 2 ];
                    uniformTypedArray[ uniformIndex++ ] = mTmp[ 6 ];
                    uniformTypedArray[ uniformIndex++ ] = mTmp[ 10 ];
                    uniformTypedArray[ uniformIndex++ ] = mTmp[ 14 ];
                }

                this._matrixPalette.set( uniformTypedArray );
                this._matrixPalette.dirty();
            };

        } )(),

        update: function ( geom ) {

            if ( this._needInit )
                this.init( geom );

            this.computeMatrixPalette( geom.getMatrixFromSkeletonToGeometry(), geom.getInvMatrixFromSkeletonToGeometry() );
        }
    };


    return RigTransformHardware;

} );
