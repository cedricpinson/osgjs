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

    var Light = function ( lightNumber ) {
        StateAttribute.call( this );

        if ( lightNumber === undefined ) {
            lightNumber = 0;
        }

        this._ambient = [ 0.2, 0.2, 0.2, 1.0 ];
        this._diffuse = [ 0.8, 0.8, 0.8, 1.0 ];
        this._specular = [ 0.2, 0.2, 0.2, 1.0 ];

        this._position = [ 0.0, 0.0, 1.0, 0.0 ];
        this._direction = [ 0.0, 0.0, -1.0 ];

        this._spotCutoff = 1.0;
        this._spotBlend = 0.01;
        this._falloffType = 'INVERSE_LINEAR';
        this._distance = 25;
        this._attenuation = [ 25.0, 0.0, 1.0, 0.0 ];

        this._energy = 1.0;

        this._lightUnit = lightNumber;
        this._type = 'SPOT';

        this._enable = true;
        this._invMatrix = new Matrix.create();
        this.dirty();
    };

    /** @lends Light.prototype */
    Light.uniforms = {};
    Light.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {
        attributeType: 'Light',
        cloneType: function () {
            return new Light( this._lightUnit );
        },
        getType: function () {
            return this.attributeType;
        },
        getTypeMember: function () {
            return this.attributeType + this._lightUnit;
        },
        getUniformName: function ( name ) {
            return this.getPrefix() + '_uniform_' + name;
        },
        getHash: function () {
            return 'Light' + this._lightUnit + this._type + this._falloffType + this._ambient.toString() + this._diffuse.toString() + this._specular.toString();
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
                'distance': 'createFloat1',

                'enable': 'createInt1',
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

        isEnable: function () {
            return this._enable;
        },
        setEnable: function ( bool ) {
            this._enable = bool;
        },
        setPosition: function ( a ) {
            Vec4.copy( a, this._position );
        },
        setDirection: function ( a ) {
            Vec3.copy( a, this._direction );
        },

        setAmbient: function ( a ) {
            Vec3.copy( a, this._ambient );
            this.dirty();
        },
        getAmbient: function () {
            return this._ambient;
        },

        setDiffuse: function ( a ) {
            this._diffuse = a;
            this.dirty();
        },

        getDiffuse: function () {
            return this._diffuse;
        },

        setSpecular: function ( a ) {
            this._specular = a;
            this.dirty();
        },

        getSpecular: function () {
            return this._specular;
        },

        setEnergy: function ( a ) {
            this._energy = a;
            this.dirty();
        },
        getEnergy: function () {
            return this._energy;
        },

        setSpotCutoff: function ( a ) {
            this._spotCutoff = a;
            this.dirty();
        },
        setSpotBlend: function ( a ) {
            this._spotBlend = a;
            this.dirty();
        },


        setConstantAttenuation: function ( value ) {
            this._falloffType = 'INVERSE_CONSTANT';
            this._distance = value;
            this._attenuation[ 0 ] = value;
            this._attenuation[ 1 ] = 1.0;
            this._attenuation[ 2 ] = 0.0;
            this._attenuation[ 3 ] = 0.0;
            this.dirty();
        },

        setLinearAttenuation: function ( value ) {
            this._falloffType = 'INVERSE_LINEAR';
            this._distance = value;
            this._attenuation[ 0 ] = value;
            this._attenuation[ 1 ] = 0.0;
            this._attenuation[ 2 ] = 1.0;
            this._attenuation[ 3 ] = 0.0;

            this.dirty();
        },

        setQuadraticAttenuation: function ( value ) {
            this._falloffType = 'INVERSE_SQUARE';
            this._distance = value;
            this._attenuation[ 0 ] = value;
            this._attenuation[ 1 ] = 0.0;
            this._attenuation[ 2 ] = 0.0;
            this._attenuation[ 3 ] = 1.0;
            this.dirty();
        },

        setLightType: function ( a ) {
            if ( a === 'SUN' || a === 'HEMI' ) {
                this._position = [ 0, 0, -1 ];
            } else {
                this._position = [ 0, 0, 0 ];
            }
            this._type = a;
            this.dirty();
        },
        getLightType: function () {
            return this._type;
        },

        setFalloffType: function ( value ) {
            switch ( value ) {
            case 'INVERSE_LINEAR':
                this.setLinearAttenuation( this._distance );
                break;
            case 'INVERSE_CONSTANT':
                this.setConstantAttenuation( this._distance );
                break;
            case 'INVERSE_SQUARE':
                this.setQuadraticAttenuation( this._distance );
                break;
            default:
                return;
            }
        },
        getFalloffType: function () {
            return this._falloffType;
        },

        setDistance: function ( value ) {
            this._distance = value;
            this.dirty();
        },
        getDistance: function () {
            return this._distance;
        },

        setLightNumber: function ( unit ) {
            this._lightUnit = unit;
            this.dirty();
        },
        getLightNumber: function () {
            return this._lightUnit;
        },

        getPrefix: function () {
            return this.getType() + this._lightUnit;
        },
        getParameterName: function ( name ) {
            return this.getPrefix() + '_' + name;
        },

        applyPositionedUniform: function ( matrix /*, state*/ ) {

            var uniformMap = this.getOrCreateUniforms();


            if ( this._type === 'SUN' || this._type === 'HEMI' ) {
                Matrix.copy( matrix, this._invMatrix );
                this._invMatrix[ 12 ] = 0.0;
                this._invMatrix[ 13 ] = 0.0;
                this._invMatrix[ 14 ] = 0.0;
                Matrix.inverse( this._invMatrix, this._invMatrix );
                Matrix.transpose( this._invMatrix, this._invMatrix );
                Matrix.transformVec3( this._invMatrix, this._position, uniformMap.position.get() );
            } else {
                Matrix.transformVec3( matrix, this._position, uniformMap.position.get() );
            }
            if ( this._type === 'SPOT' ) {
                Matrix.copy( matrix, this._invMatrix );
                this._invMatrix[ 12 ] = 0.0;
                this._invMatrix[ 13 ] = 0.0;
                this._invMatrix[ 14 ] = 0.0;
                Matrix.inverse( this._invMatrix, this._invMatrix );
                Matrix.transpose( this._invMatrix, this._invMatrix );
                Matrix.transformVec3( this._invMatrix, this._direction, uniformMap.direction.get() );
            }

            Matrix.copy( matrix, uniformMap.matrix.get() );
            uniformMap.matrix.dirty();

            Matrix.copy( matrix, uniformMap.invMatrix.get() );
            uniformMap.invMatrix.dirty();

            uniformMap.position.dirty();
            uniformMap.direction.dirty();
        },

        applyEnergy: function ( colorUniform, colorVar ) {
            var color = colorUniform.get();
            color[ 0 ] = colorVar[ 0 ] * this._energy;
            color[ 1 ] = colorVar[ 1 ] * this._energy;
            color[ 2 ] = colorVar[ 2 ] * this._energy;
            colorUniform.dirty();
        },

        apply: function ( /*state*/) {
            var uniformMap = this.getOrCreateUniforms();

            this.applyEnergy( uniformMap.ambient, this._ambient );
            this.applyEnergy( uniformMap.diffuse, this._diffuse );
            this.applyEnergy( uniformMap.specular, this._specular );

            Vec3.copy( this._position, uniformMap.position.get() );
            Vec3.copy( this._direction, uniformMap.direction.get() );
            uniformMap.position.dirty();
            uniformMap.direction.dirty();

            var spotsize = Math.cos( this._spotCutoff * 0.5 );
            uniformMap.spotCutOff.get()[ 0 ] = spotsize;
            uniformMap.spotCutOff.dirty();

            uniformMap.spotBlend.get()[ 0 ] = ( 1.0 - spotsize ) * this._spotBlend;
            uniformMap.spotBlend.dirty();

            uniformMap.distance.get()[ 0 ] = this._distance;
            uniformMap.distance.dirty();

            Vec4.copy( this._attenuation, uniformMap.attenuation.get() );
            uniformMap.attenuation.dirty();

            this.setDirty( false );
        }

    } ), 'osg', 'Light' );

    MACROUTILS.setTypeID( Light );

    return Light;
} );
