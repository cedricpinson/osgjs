define ( [
    'osg/Utils',
    'osg/StateAttribute',
    'osg/Uniform',
    'osg/Matrix',
    'osg/Vec4',
    'osgShader/ShaderGenerator',
    'osg/Map'
] , function( MACROUTILS, StateAttribute, Uniform, Matrix, Vec4, ShaderGenerator, Map ) {


    var Light = function( lightNumber ) {
        StateAttribute.call(this);

        if (lightNumber === undefined) {
            lightNumber = 0;
        }

        this._color = [ 1.0, 1.0, 1.0 ];
        this._useDiffuse = true;
        this._useSpecular = true;
        this._position = [ 0.0, 0.0, 0.0 ];
        this._direction = [ 0.0, 0.0, -1.0 ];
        this._spotCutoff = Math.cos(25);
        this._spotBlend = 0.01;
        this._falloffType = 'INVERSE_SQUARE';
        this._distance = 25;
        this._energy = 1.0;
        this._lightUnit = lightNumber;
        this._type = 'POINT';
        this._useSphere = false;
        this._enable = true;
        this.dirty();
    };

    /** @lends Light.prototype */
    Light.uniforms = {};
    Light.prototype = MACROUTILS.objectLibraryClass( MACROUTILS.objectInherit( StateAttribute.prototype, {
        attributeType: 'Light',
        cloneType: function() {return new Light(this._lightUnit); },
        getType: function() { return this.attributeType; },
        getTypeMember: function() { return this.attributeType + this._lightUnit;},
        getUniformName: function (name) { return this.getPrefix()+ '_uniform_' + name; },
        getHash: function() {
            return 'Light'+this._lightUnit + this._type + this._falloffType + this._useSphere.toString()+this._useDiffuse.toString() + this._useSpecular.toString();
        },
        getOrCreateUniforms: function() {

            var obj = Light;
            var typeMember = this.getTypeMember();

            if ( obj.uniforms[ typeMember ] ) return obj.uniforms[ typeMember ];

            var uniformList = {
                'color': 'createFloat3',
                'position': 'createFloat3',
                'direction': 'createFloat3',
                'spotCutoff': 'createFloat1',
                'spotBlend': 'createFloat1',
                'distance': 'createFloat1'
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

        isEnable: function() { return this._enable; },
        setEnable: function( bool ) { this._enable = bool;},
        setPosition: function(a) { MACROUTILS.Vec3.copy(a, this._position); },
        setDirection: function(a) { MACROUTILS.Vec3.copy(a, this._direction); },

        setColor: function(a) { MACROUTILS.Vec3.copy(a, this._color); this.dirty(); },
        getColor: function() { return this._color; },

        setEnergy: function(a) { this._energy = a; this.dirty(); },
        getEnergy: function() { return this._energy; },

        setSpotCutoff: function(a) { this._spotCutoff = a; this.dirty(); },
        setSpotBlend: function(a) { this._spotBlend = a; this.dirty(); },

        setUseDiffuse: function(a) { this._useDiffuse = a; this.dirty(); },
        getUseDiffuse: function() { return this._useDiffuse; },

        setUseSpecular: function(a) { this._useSpecular = a; this.dirty(); },
        getUseSpecular: function() { return this._useSpecular; },

        setLightType: function(a) {
            if (a === 'SUN' || a === 'HEMI' ) {
                this._position = [0,0,-1];
            } else {
                this._position = [0,0,0];
            }
            this._type = a; this.dirty();
        },
        getLightType: function() { return this._type; },

        setFalloffType: function(value) { this._falloffType = value;},
        getFalloffType: function() { return this._falloffType; },

        setUseSphere: function(value) { this._useSphere = value;},
        getUseSphere: function() { return this._useSphere;},

        setDistance: function(value) { this._distance = value; this.dirty();},
        getDistance: function() { return this._distance; },

        setLightNumber: function(unit) { this._lightUnit = unit; this.dirty(); },
        getLightNumber: function() { return this._lightUnit; },

        getPrefix: function() { return this.getType() + this._lightUnit; },
        getParameterName: function (name) { return this.getPrefix()+ '_' + name; },

        applyPositionedUniform: (function() {
            var invMatrix = new Matrix.create();

            return function( matrix /*, state*/) {

                var uniformMap = this.getOrCreateUniforms();

                if ( this._type === 'SUN' || this._type === 'HEMI' ) {
                    MACROUTILS.Matrix.copy( matrix, invMatrix );
                    invMatrix[ 12 ] = 0.0;
                    invMatrix[ 13 ] = 0.0;
                    invMatrix[ 14 ] = 0.0;
                    MACROUTILS.Matrix.inverse( invMatrix, invMatrix );
                    MACROUTILS.Matrix.transpose( invMatrix, invMatrix );
                    MACROUTILS.Matrix.transformVec3( invMatrix, this._position, uniformMap.position.get() );
                }
                else {
                    MACROUTILS.Matrix.transformVec3( matrix, this._position, uniformMap.position.get() );
                }
                if ( this._type === 'SPOT' ) {
                    MACROUTILS.Matrix.copy( matrix, invMatrix );
                    invMatrix[ 12 ] = 0.0;
                    invMatrix[ 13 ] = 0.0;
                    invMatrix[ 14 ] = 0.0;
                    MACROUTILS.Matrix.inverse( invMatrix, invMatrix );
                    MACROUTILS.Matrix.transpose( invMatrix, invMatrix );
                    MACROUTILS.Matrix.transformVec3( invMatrix, this._direction, uniformMap.direction.get() );
                }

                uniformMap.position.dirty();
                uniformMap.direction.dirty();
            };
        })(),

        apply: function( /*state*/)
        {
            var uniformMap = this.getOrCreateUniforms();

            var color = uniformMap.color.get();
            color[ 0 ] = this._color[ 0 ] * this._energy;
            color[ 1 ] = this._color[ 1 ] * this._energy;
            color[ 2 ] = this._color[ 2 ] * this._energy;
            uniformMap.color.dirty();

            MACROUTILS.Vec3.copy( this._position, uniformMap.position.get() );
            MACROUTILS.Vec3.copy( this._direction, uniformMap.direction.get() );
            uniformMap.position.dirty();
            uniformMap.direction.dirty();

            var spotsize = Math.cos( this._spotCutoff * 0.5 );
            uniformMap.spotCutoff.get()[ 0 ] = spotsize;
            uniformMap.spotCutoff.dirty();

            uniformMap.spotBlend.get()[ 0 ] = ( 1.0 - spotsize ) * this._spotBlend;
            uniformMap.spotBlend.dirty();

            uniformMap.distance.get()[ 0 ] = this._distance;
            uniformMap.distance.dirty();

            this.setDirty( false );
        }

    }),'osg','Light');

    MACROUTILS.setTypeID( Light );

    return Light;
});
