define( [
    'osg/Utils',
    'osg/NodeVisitor',
    'osg/Notify',
    'osg/Matrix',
    'osg/Program',
    'osg/Shader',
    'osgAnimation/CollectBoneVisitor',
    'osgAnimation/UniformMatrixPalette'

], function ( MACROUTILS, NodeVisitor, Notify, Matrix, Program, Shader, CollectBoneVisitor, UniformMatrixPalette ) {

    'use strict';


    function getShader( maxMatrix ) {
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
            'uniform vec4 uBones[' + ( maxMatrix * 3 ) + '];',

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

    var RigTransformHardware = function () {
        this._needInit = true;
        this._bonesPerVertex = 0;
        this._nbVertexes = 0;

        this._bonePalette = undefined;
        this._matrixPalette = new UniformMatrixPalette();
    };


    RigTransformHardware.prototype = {

        init: function ( geom ) {

            var Vertex = geom.getAttributes().Vertex;

            if ( !Vertex ) {
                Notify.warn( 'RigTransformHardware no vertex array in the geometry ' + geom.getName() );
                return false;
            }

            if ( !geom.getSkeleton() ) {
                Notify.warn( 'RigTransformHardware no skeleton set in geometry ' + geom.getName() );
                return false;
            }

            var mapVisitor = new CollectBoneVisitor();
            geom.getSkeleton().accept( mapVisitor );
            var bm = mapVisitor.getBoneMap();

            if ( !this._matrixPalette.createPalette( bm, geom.getVertexInfluenceSet().getVertexToBoneList() ) ) {
                return false;
            }

            //Shader setUP
            geom.getOrCreateStateSet().addUniform( this._matrixPalette._unformPalette );
            geom.parents[ 0 ].getOrCreateStateSet().setAttributeAndModes( getShader( this._matrixPalette._palette.length ) );

            // do not iterate with var in
            for ( var attr in this._matrixPalette._boneWeightAttribArrays ) {
                geom.getAttributes()[ attr ] = this._matrixPalette._boneWeightAttribArrays[ attr ];
            }

            this._needInit = false;
            return true;
        },


        computeMatrixPalette: function ( transformFromSkeletonToGeometry, invTransformFromSkeletonToGeometry ) {
            var palette = this._matrixPalette._palette;

            for ( var i = 0, l = palette.length; i < l; i++ ) {
                var bone = palette[ i ];

                var invBindMatrix = bone.getInvBindMatrixInSkeletonSpace();
                var boneMatrix = bone.getMatrixInSkeletonSpace();
                var resultBoneMatrix = Matrix.create();
                var result = Matrix.create();

                Matrix.mult( boneMatrix, invBindMatrix, resultBoneMatrix );
                Matrix.mult( invTransformFromSkeletonToGeometry, resultBoneMatrix, result );
                Matrix.preMult( result, transformFromSkeletonToGeometry );

                this._matrixPalette.setElement( i, result );

            }
        },

        update: function ( geom ) {

            if ( this._needInit && !this.init( geom ) ) return;

            this.computeMatrixPalette( geom.getMatrixFromSkeletonToGeometry(), geom.getInvMatrixFromSkeletonToGeometry(), geom._geometry._name );
        }
    };


    return RigTransformHardware;

});
