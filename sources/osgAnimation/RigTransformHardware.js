define( [
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/Notify',
    'osg/Matrix',
    'osg/Program',
    'osg/Shader',
    'osg/Uniform',
    'osgAnimation/CollectBoneVisitor'

], function ( MACROUTILS, NodeVisitor, Notify, Matrix, Program, Shader, Uniform, CollectBoneVisitor ) {

    'use strict';


    function getShader( nbVec4 ) {
        var vertexshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',
            'attribute vec3 Vertex;',
            'attribute vec3 Normal;',
            'attribute vec4 Bone;',
            'attribute vec4 Weight;',

            'uniform mat4 ModelViewMatrix;',
            'uniform mat4 ProjectionMatrix;',
            'uniform mat4 NormalMatrix;',
            'uniform vec4 uBones[' + ( nbVec4 ) + '];',

            'varying vec3 vNormal;',

            'vec4 position;',

            'mat4 getMatrix( int index ) {',
            '            vec4 l1 = uBones[ index * 3 ];',
            '            vec4 l2 = uBones[ index * 3 + 1 ];',
            '            vec4 l3 = uBones[ index * 3 + 2 ];',
            '',
            '            mat4 myMat;',
            '',
            '            myMat[ 0 ][ 0 ] = l1[ 0 ];',
            '            myMat[ 0 ][ 1 ] = l2[ 0 ];',
            '            myMat[ 0 ][ 2 ] = l3[ 0 ];',
            '            myMat[ 0 ][ 3 ] = 0.;',
            '',
            '            myMat[ 1 ][ 0 ] = l1[ 1 ];',
            '            myMat[ 1 ][ 1 ] = l2[ 1 ];',
            '            myMat[ 1 ][ 2 ] = l3[ 1 ];',
            '            myMat[ 1 ][ 3 ] = 0.;',
            '',
            '            myMat[ 2 ][ 0 ] = l1[ 2 ];',
            '            myMat[ 2 ][ 1 ] = l2[ 2 ];',
            '            myMat[ 2 ][ 2 ] = l3[ 2 ];',
            '            myMat[ 2 ][ 3 ] = 0.;',
            '',
            '            myMat[ 3 ][ 0 ] = l1[ 3 ];',
            '            myMat[ 3 ][ 1 ] = l2[ 3 ];',
            '            myMat[ 3 ][ 2 ] = l3[ 3 ];',
            '            myMat[ 3 ][ 3 ] = 1.;',
            '',
            '            return myMat;',
            '}',

            'void computeAcummulatedPosition( int matrixIndex, float matrixWeight ) {',
            'mat4 matrix = getMatrix( matrixIndex );',
            '   position += matrixWeight * ( matrix * vec4( Vertex, 1.0 ) );',
            '}',

            'void main(void) {',

            'position = vec4( 0.0, 0.0, 0.0, 0.0 );',
            '',
            'if ( Weight.x != 0.0 )',
            'computeAcummulatedPosition( int( Bone.x ), Weight.x );',
            'if ( Weight.y != 0.0 )',
            'computeAcummulatedPosition( int( Bone.y ), Weight.y );',
            'if ( Weight.z != 0.0 )',
            'computeAcummulatedPosition( int( Bone.z ), Weight.z );',
            'if ( Weight.w != 0.0 )',
            'computeAcummulatedPosition( int( Bone.w ), Weight.w );',

            // 'if ( Bone.x == -1.0 &&  Bone.y == -1.0 &&  Bone.z == -1.0 &&  Bone.w == -1.0 ) ',
            // 'position = vec4( Vertex, 1.0 );',

            'vNormal = (ModelViewMatrix * vec4(Normal, 0.0)).xyz;',
            'gl_Position = ProjectionMatrix * ModelViewMatrix * position;',
            '}'
        ].join( '\n' );

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',

            'varying vec3 vNormal;',

            'void main(void) {',
            '  gl_FragColor = vec4(normalize(vNormal) * .5 + .5, 1.0);',
            '}',
            ''
        ].join( '\n' );

        var program = new Program(
            new Shader( 'VERTEX_SHADER', vertexshader ),
            new Shader( 'FRAGMENT_SHADER', fragmentshader ) );

        return program;
    }



    /**
     * Hardware implementation for rigGeometry
     *
     */

    var RigTransformHardware = function ( nbMatrix ) {
        this._needInit = true;

        // bones are sorted to be used directly by
        // computeMatrixPalette
        // means the
        this._bones = [];

        // matrix are 4x3
        var matrix = new Float32Array( nbMatrix * 12 );
        this._matrixPalette = new Uniform.createFloat4Array( matrix, 'uBones' );
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
        computeBonePalette: function( boneMap, boneNameID) {

        },


        init: function ( geom ) {

            // init the bones map

            // stop here
            // compute bonemap / index
            var mapVisitor = new CollectBoneVisitor();
            geom.getSkeleton().accept( mapVisitor );
            var bm = mapVisitor.getBoneMap();


            //Shader setUP
            geom.getOrCreateStateSet().addUniform( this._matrixPalette );
            var nbVec4Uniforms = this._matrixPalette/3;
            geom.parents[ 0 ].getOrCreateStateSet().setAttributeAndModes( getShader( nbVec4Uniforms ) );

            this._needInit = false;
            return true;
        },


        computeMatrixPalette: ( function() {

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
                    Matrix.mult( invTransformFromSkeletonToGeometry, mTmp, mTmp );
                    Matrix.mult( mTmp, transformFromSkeletonToGeometry, mTmp );

                    uniformTypedArray[uniformIndex++] = mTmp[0];
                    uniformTypedArray[uniformIndex++] = mTmp[4];
                    uniformTypedArray[uniformIndex++] = mTmp[8];
                    uniformTypedArray[uniformIndex++] = mTmp[12];
                    uniformTypedArray[uniformIndex++] = mTmp[1];
                    uniformTypedArray[uniformIndex++] = mTmp[5];
                    uniformTypedArray[uniformIndex++] = mTmp[9];
                    uniformTypedArray[uniformIndex++] = mTmp[13];
                    uniformTypedArray[uniformIndex++] = mTmp[2];
                    uniformTypedArray[uniformIndex++] = mTmp[6];
                    uniformTypedArray[uniformIndex++] = mTmp[10];
                    uniformTypedArray[uniformIndex++] = mTmp[14];
                }
            };

        })(),

        update: function ( geom ) {

            if ( this._needInit && !this.init( geom ) ) return;

            this.computeMatrixPalette( geom.getMatrixFromSkeletonToGeometry(), geom.getInvMatrixFromSkeletonToGeometry(), geom._geometry._name );
        }
    };


    return RigTransformHardware;

});
