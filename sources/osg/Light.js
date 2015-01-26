define( [
    'osg/Utils',
    'osg/StateAttribute',
    'osg/Uniform',
    'osg/Matrix',
    'osg/Vec3',
    'osg/Vec4',
    'osg/Map'
], function ( MACROUTILS, StateAttribute, Uniform, Matrix, Vec3, Vec4, Map ) {
    'use strict';


    // use the same kind of opengl lights
    // see http://www.glprogramming.com/red/chapter05.html


    var Light = function ( lightNumber, disable ) {
        StateAttribute.call( this );

        if ( lightNumber === undefined ) {
            lightNumber = 0;
        }

        this._ambient = [ 0.2, 0.2, 0.2, 1.0 ];
        this._diffuse = [ 0.8, 0.8, 0.8, 1.0 ];
        this._specular = [ 0.2, 0.2, 0.2, 1.0 ];

        // Default is directional as postion[3] is 0
        this._position = [ 0.0, 0.0, 1.0, 0.0 ];
        this._direction = [ 0.0, 0.0, -1.0 ];

        // TODO : refactor lights management
        // w=1.0 (isHemi), w=-1.0 (isNotHemi)
        this._ground = [ 1.0, 0.0, 0.0, -1.0 ];

        this._spotCutoff = 180.0;
        this._spotBlend = 0.01;

        // the array contains constant, linear, quadratic factor
        this._attenuation = [ 1.0, 0.0, 0.0, 0.0 ];

        this._lightUnit = lightNumber;

        this._invMatrix = new Matrix.create();

        this._enable = !disable;

        this.dirty();

    };

    Light.DIRECTION = 'DIRECTION';
    Light.SPOT = 'SPOT';
    Light.POINT = 'POINT';
    Light.HEMI = 'HEMI';

    Light.uniforms = {};
    Light.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {

        attributeType: 'Light',

        cloneType: function () {
            return new Light( this._lightUnit, true );
        },

        getTypeMember: function () {
            return this.attributeType + this._lightUnit;
        },

        getUniformName: function ( name ) {
            var prefix = this.getType() + this._lightUnit.toString();
            return prefix + '_uniform_' + name;
        },

        getHash: function () {
            return this.getTypeMember() + this.getLightType() + this.isEnable().toString();
        },

        getOrCreateUniforms: function () {

            var obj = Light;
            var typeMember = this.getTypeMember();

            if ( obj.uniforms[ typeMember ] ) return obj.uniforms[ typeMember ];

            var uniformList = {
                'ambient': 'createFloat4',
                'diffuse': 'createFloat4',
                'specular': 'createFloat4',

                'attenuation': 'createFloat4',
                'position': 'createFloat4',
                'direction': 'createFloat3',

                'spotCutOff': 'createFloat1',
                'spotBlend': 'createFloat1',

                'ground': 'createFloat3',

                'matrix': 'createMatrix4',
                'invMatrix': 'createMatrix4'

            };

            var uniforms = {};

            Object.keys( uniformList ).forEach( function ( key ) {

                var type = uniformList[ key ];
                var func = Uniform[ type ];
                uniforms[ key ] = func( this.getUniformName( key ) );

            }.bind( this ) );

            obj.uniforms[ typeMember ] = new Map( uniforms );

            return obj.uniforms[ typeMember ];
        },

        // enable / disable is not implemented in uniform
        // we should add it
        isEnable: function () {
            return this._enable;
        },
        setEnable: function ( bool ) {
            this._enable = bool;
            this.dirty();
        },


        // colors
        setAmbient: function ( a ) {
            Vec4.copy( a, this._ambient );
            this.dirty();
        },
        getAmbient: function () {
            return this._ambient;
        },

        setDiffuse: function ( a ) {
            Vec4.copy( a, this._diffuse );
            this.dirty();
        },
        getDiffuse: function () {
            return this._diffuse;
        },

        setSpecular: function ( a ) {
            Vec4.copy( a, this._specular );
            this.dirty();
        },
        getSpecular: function () {
            return this._specular;
        },


        // position, also used for directional light
        // position[3] === 0 means directional
        // see creating lightsources http://www.glprogramming.com/red/chapter05.html
        setPosition: function ( a ) {
            Vec4.copy( a, this._position );
            this.dirty();
        },
        getPosition: function () {
            return this._position;
        },

        // unused for directional
        setDirection: function ( a ) {
            Vec3.copy( a, this._direction );
            this.dirty();
        },
        getDirection: function () {
            return this._direction;
        },


        setSpotCutoff: function ( a ) {
            this._spotCutoff = a;
            this.dirty();
        },
        getSpotCutoff: function () {
            return this._spotCutoff;
        },

        setSpotBlend: function ( a ) {
            this._spotBlend = a;
            this.dirty();
        },
        getSpotBlend: function () {
            return this._spotBlend;
        },

        setGround: function ( a ) {
            Vec3.copy( a, this._ground );
            this.dirty();
        },
        getGround: function () {
            return this._ground;
        },

        // attenuation coeff
        setConstantAttenuation: function ( value ) {
            this._attenuation[ 0 ] = value;
            this.dirty();
        },
        getConstantAttenuation: function () {
            return this._attenuation[ 0 ];
        },

        setLinearAttenuation: function ( value ) {
            this._attenuation[ 1 ] = value;
            this.dirty();
        },
        getLinearAttenuation: function () {
            return this._attenuation[ 1 ];
        },

        setQuadraticAttenuation: function ( value ) {
            this._attenuation[ 2 ] = value;
            this.dirty();
        },
        getQuadraticAttenuation: function () {
            return this._attenuation[ 2 ];
        },

        setLightType: function ( type ) {
            if ( type === Light.DIRECTION )
                return this.setLightAsDirection();
            else if ( type === Light.SPOT )
                return this.setLightAsSpot();
            else if ( type === Light.HEMI )
                return this.setLightAsHemi();
            return this.setLightAsPoint();
        },

        getLightType: function () {
            if ( this.isDirectionLight() )
                return Light.DIRECTION;
            else if ( this.isSpotLight() )
                return Light.SPOT;
            else if ( this.isHemiLight() )
                return Light.HEMI;
            return Light.POINT;
        },

        setLightAsSpot: function () {
            Vec4.set( 0.0, 0.0, 0.0, 1.0, this._position );
            Vec3.set( 0.0, 0.0, -1.0, this._direction );
            this._ground[ 3 ] = -1.0;
            this._spotCutoff = 90;
            this.dirty();
        },

        setLightAsPoint: function () {
            Vec4.set( 0.0, 0.0, 0.0, 1.0, this._position );
            Vec3.set( 0.0, 0.0, -1.0, this._direction );
            this._ground[ 3 ] = -1.0;
            this.dirty();
        },

        setLightAsDirection: function () {
            Vec4.set( 0.0, 0.0, 1.0, 0.0, this._position );
            this._spotCutoff = 180;
            this._ground[ 3 ] = -1.0;
            this.dirty();
        },

        setLightAsHemi: function () {
            Vec4.set( 0.0, 0.0, 1.0, 0.0, this._position );
            this._spotCutoff = 180;
            this._ground[ 3 ] = 1.0;
            this.dirty();
        },

        setLightNumber: function ( unit ) {
            this._lightUnit = unit;
            this.dirty();
        },

        getLightNumber: function () {
            return this._lightUnit;
        },

        // internal helper
        isSpotLight: function () {
            return this._spotCutoff < 180.0;
        },

        isDirectionLight: function () {
            return this._position[ 3 ] === 0.0 && this._ground[ 3 ] < 0.0;
        },

        isHemiLight: function () {
            return this._ground[ 3 ] >= 0.0;
        },

        applyPositionedUniform: function ( matrix /*, state*/ ) {

            var uniformMap = this.getOrCreateUniforms();
            Matrix.copy( matrix, uniformMap.matrix.get() );
            uniformMap.matrix.dirty();

            Matrix.copy( matrix, uniformMap.invMatrix.get() );
            uniformMap.invMatrix.get()[ 12 ] = 0;
            uniformMap.invMatrix.get()[ 13 ] = 0;
            uniformMap.invMatrix.get()[ 14 ] = 0;

            Matrix.inverse( uniformMap.invMatrix.get(), uniformMap.invMatrix.get() );
            Matrix.transpose( uniformMap.invMatrix.get(), uniformMap.invMatrix.get() );

            uniformMap.invMatrix.dirty();
        },

        apply: function ( /*state*/) {

            if ( !this._enable )
                return;

            var uniformMap = this.getOrCreateUniforms();

            Vec4.copy( this._position, uniformMap.position.get() );
            uniformMap.position.dirty();

            if ( this.isSpotLight() ) {
                var spotsize = Math.cos( this._spotCutoff * Math.PI / 180.0 );
                uniformMap.spotCutOff.get()[ 0 ] = spotsize;
                uniformMap.spotCutOff.dirty();

                uniformMap.spotBlend.get()[ 0 ] = ( 1.0 - spotsize ) * this._spotBlend;
                uniformMap.spotBlend.dirty();

                Vec3.copy( this._direction, uniformMap.direction.get() );
                uniformMap.direction.dirty();
            }
            if ( this.isHemiLight() ) {
                Vec3.copy( this._ground, uniformMap.ground.get() );
                uniformMap.ground.dirty();
            }

            Vec4.copy( this._attenuation, uniformMap.attenuation.get() );
            uniformMap.attenuation.dirty();

            Vec4.copy( this._diffuse, uniformMap.diffuse.get() );
            uniformMap.diffuse.dirty();

            Vec4.copy( this._specular, uniformMap.specular.get() );
            uniformMap.specular.dirty();

            Vec4.copy( this._ambient, uniformMap.ambient.get() );
            uniformMap.ambient.dirty();


            this.setDirty( false );
        }

    } ), 'osg', 'Light' );

    MACROUTILS.setTypeID( Light );

    return Light;
} );
