import notify from 'osg/notify';
import { vec4 } from 'osg/glMatrix';
import Camera from 'osg/Camera';
import utils from 'osg/utils';
import ShadowTechnique from 'osgShadow/ShadowTechnique';
import ShadowTextureAtlas from 'osgShadow/ShadowTextureAtlas';
import ShadowMap from 'osgShadow/ShadowMap';
import Texture from 'osg/Texture';
import FrameBufferObject from 'osg/FrameBufferObject';
import Uniform from 'osg/Uniform';
import Viewport from 'osg/Viewport';

/**
 *  ShadowMapAtlas provides an implementation of shadow textures.
 * here, one shadow
 *  @class ShadowMapAtlas
 */
var ShadowMapAtlas = function(settings) {
    this._lights = [];
    this._shadowMaps = [];
    this._viewportDimension = [];

    ShadowTechnique.apply(this, arguments);
    this._shadowSettings = settings;
    this._texture = new ShadowTextureAtlas();
    this._textureUnitBase = 4;
    this._textureUnit = this._textureUnitBase;

    // see shadowSettings.js header for param explanations
    this._textureMagFilter = undefined;
    this._textureMinFilter = undefined;

    this._textureSize = 1024;
    this._shadowMapSize = 256;

    this._receivingStateset = undefined;

    this._shaderProcessor = undefined;

    if (settings) {
        this.setShadowSettings(settings);
        if (settings.atlasSize) this._textureSize = settings.atlasSize;
        if (settings.textureSize) this._shadowMapSize = settings.textureSize;
    }

    this._texelSizeUniform = Uniform.createFloat1(1.0 / this._textureSize, 'texelSize');

    var unifRenderSize = Uniform.createFloat2('RenderSize');
    this._renderSize = unifRenderSize.getInternalArray();
    this._renderSize[0] = this._renderSize[1] = this._textureSize;

    this._numShadowWidth = this._textureSize / this._shadowMapSize;
    this._numShadowHeight = this._textureSize / this._shadowMapSize;

    this._cameraClear = new Camera();
    this._cameraClear.setName('shadowAtlasCameraClear');
    this._cameraClear.setRenderOrder(Camera.PRE_RENDER, 0);
    this._cameraClear.setClearColor(vec4.fromValues(1.0, 1.0, 1.0, 1.0));
    this._cameraClear.setFrameBufferObject(new FrameBufferObject());
    this._cameraClear.setClearMask(0x0);
};

/** @lends ShadowMapAtlas.prototype */
utils.createPrototypeObject(
    ShadowMapAtlas,
    utils.objectInherit(ShadowTechnique.prototype, {
        getTexture: function() {
            return this._texture;
        },

        isDirty: function(ligthtIndex) {
            if (ligthtIndex !== undefined) {
                return this._shadowMaps[ligthtIndex].isDirty();
            } else {
                for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                    if (this._shadowMaps[i].isDirty()) return true;
                }
            }
            return false;
        },
        /**
         * at which Texture unit number we start adding texture shadow
         */
        setTextureUnitBase: function(unitBase) {
            this._textureUnitBase = unitBase;
            this._textureUnit = unitBase;

            for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                this._shadowMaps[i].setTextureUnitBase(unitBase);
            }
        },

        /* Sets  shadowSettings
        */
        setShadowSettings: function(shadowSettings) {
            if (!shadowSettings) return;
            this._shadowSettings = shadowSettings;

            for (var i = 0, l = this._shadowMaps.length; i < l; i++)
                this._shadowMaps[i].setShadowSettings(shadowSettings);

            this.setTextureSize(shadowSettings.textureSize);
            this.setTexturePrecision(shadowSettings.textureType);
        },

        setCastsShadowDrawTraversalMask: function(mask) {
            for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                this._shadowMaps[i].setCastsShadowDrawTraversalMask(mask);
            }
        },

        getCastsShadowDrawTraversalMask: function(numShadow) {
            if (numShadow !== undefined) {
                return this._shadowMaps[numShadow].getCastsShadowDrawTraversalMask();
            } else if (this._shadowMaps.length !== 0) {
                return this._shadowMaps[0].getCastsShadowDrawTraversalMask();
            }
        },

        setCastsShadowBoundsTraversalMask: function(mask) {
            for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                this._shadowMaps[i].setCastsShadowBoundsTraversalMask(mask);
            }
        },

        getCastsShadowBoundsTraversalMask: function(numShadow) {
            if (numShadow !== undefined) {
                return this._shadowMaps[numShadow].getCastsShadowDrawTraversalMask();
            } else if (this._shadowMaps.length !== 0) {
                return this._shadowMaps[0].getCastsShadowDrawTraversalMask();
            }
        },

        getNormalBias: function(numShadow) {
            if (numShadow !== undefined) {
                return this._shadowMaps[numShadow].getNormalBias();
            } else if (this._shadowMaps.length !== 0) {
                return this._shadowMaps[0].getNormalBias();
            }
        },

        setNormalBias: function(value) {
            for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                this._shadowMaps[i].setNormalBias(value);
            }
        },

        getBias: function(numShadow) {
            if (numShadow !== undefined) {
                return this._shadowMaps[numShadow].getBias();
            } else if (this._shadowMaps.length !== 0) {
                return this._shadowMaps[0].getBias();
            }
        },

        setBias: function(value) {
            for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                this._shadowMaps[i].setBias(value);
            }
        },

        getKernelSizePCF: function(numShadow) {
            if (numShadow !== undefined) {
                return this._shadowMaps[numShadow].getKernelSizePCF();
            } else if (this._shadowMaps.length !== 1) {
                return this._shadowMaps[0].getKernelSizePCF();
            }
        },

        setKernelSizePCF: function(value) {
            for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                this._shadowMaps[i].setKernelSizePCF(value);
            }
        },

        setShadowedScene: function(shadowedScene) {
            ShadowTechnique.prototype.setShadowedScene.call(this, shadowedScene);
            this._receivingStateset = this._shadowedScene.getReceivingStateSet();

            for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                this._shadowMaps[i].setShadowedScene(shadowedScene);
            }
        },

        setTexturePrecision: function(value) {
            for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                this._shadowMaps[i].setTexturePrecision(value);
            }
        },

        getTexturePrecision: function(numShadow) {
            if (numShadow !== undefined) {
                return this._shadowMaps[numShadow].getTexturePrecision();
            } else if (this._shadowMaps.length !== 1) {
                return this._shadowMaps[0].getTexturePrecision();
            }
        },

        setTextureSize: function(mapSize) {
            if (mapSize === this._textureSize) return;

            //this._textureSize = mapSize;
            //this._textureSize = settings.atlasSize;
            this._shadowMapSize = mapSize;

            this._numShadowWidth = this._textureSize / this._shadowMapSize;
            this._numShadowHeight = this._textureSize / this._shadowMapSize;

            this.dirty();
        },

        getShadowMap: function(lightNum) {
            return this._shadowMaps[lightNum];
        },

        addLight: function(light) {
            if (!light || this._lights.indexOf(light) !== -1) {
                notify.warn('no light or light already added');
                return -1;
            }

            var lightCount = this._lights.length;
            if (lightCount === this._numShadowWidth * this._numShadowHeight) {
                notify.warn(
                    "can't allocate shadow for light " +
                        light.getLightNumber() +
                        ' ShadowAtlas already full '
                );
                return undefined;
            }

            this._lights.push(light);
            this._shadowSettings.setLight(light);

            var shadowMap = new ShadowMap(this._shadowSettings, this._texture);
            this._shadowMaps.push(shadowMap);

            if (this._shadowedScene) shadowMap.setShadowedScene(this._shadowedScene);

            this.recomputeViewports();

            return shadowMap;
        },

        /** initialize the ShadowedScene and local cached data structures.*/
        init: function() {
            if (!this._shadowedScene) return;

            this.initTexture();
            var lightNumberArray = [];
            for (var k = 0; k < this._lights.length; k++) {
                lightNumberArray.push(this._lights[k].getLightNumber());
            }
            this._texture.setLightNumberArray(lightNumberArray);

            this._textureUnit = this._textureUnitBase;
            this._texture.setName('ShadowTexture' + this._textureUnit);

            var unifRenderSize = Uniform.createFloat2('RenderSize');
            this._texelSizeUniform = Uniform.createFloat1(1.0 / this._textureSize, 'texelSize');
            this._renderSize = unifRenderSize.getInternalArray();
            this._renderSize[0] = this._renderSize[1] = this._textureSize;

            this.recomputeViewports();
            for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                var shadowMap = this._shadowMaps[i];

                if (!this._shadowedScene)
                    this._shadowedScene = shadowMap.getShadowedScene(this._shadowedScene);
                if (this._shadowedScene) shadowMap.setShadowedScene(this._shadowedScene);
                shadowMap.init(this._texture, i, this._textureUnitBase);
            }
        },

        recomputeViewports: function() {
            var numViews = this._shadowMaps.length;

            var viewDivideY = numViews > 2 ? Math.sqrt(2 * Math.ceil(numViews / 2)) : numViews;
            var viewDivideX = viewDivideY;

            var mapSizeX = this._textureSize / viewDivideX;
            var mapSizeY = this._textureSize / viewDivideY;

            var numShadowWidth = this._textureSize / mapSizeX;
            var numShadowHeight = this._textureSize / mapSizeY;

            for (var i = 0; i < numViews; i++) {
                var shadowMap = this._shadowMaps[i];

                var x = mapSizeX * (i % numShadowWidth);
                var y = mapSizeY * Math.floor(i / numShadowHeight);

                if (this._viewportDimension.length <= i) {
                    this._viewportDimension.push(vec4.fromValues(x, y, mapSizeX, mapSizeY));
                } else {
                    vec4.set(this._viewportDimension[i], x, y, mapSizeX, mapSizeY);
                }

                this._texture.setLightShadowMapSize(
                    this._lights[i].getLightNumber(),
                    this._viewportDimension[i]
                );

                shadowMap.dirty();
            }
        },

        valid: function() {
            // checks
            return true;
        },

        updateCameraClear: function() {
            var camera = this._cameraClear;
            var texture = this._texture;

            if (camera && texture) {
                var vp = camera.getViewport();

                if (!vp) {
                    vp = new Viewport();
                    camera.setViewport(vp);
                }

                // if texture size changed update the camera rtt params
                if (vp.width() !== texture.getWidth() || vp.height() !== texture.getHeight()) {
                    camera.detachAll();

                    camera.attachTexture(FrameBufferObject.COLOR_ATTACHMENT0, texture);
                    camera.attachRenderBuffer(
                        FrameBufferObject.DEPTH_ATTACHMENT,
                        FrameBufferObject.DEPTH_COMPONENT16
                    );
                    camera.getViewport().setViewport(0, 0, texture.getWidth(), texture.getHeight());
                }
            }
        },

        updateShadowTechnique: function(nv) {
            this.updateCameraClear();
            var fbo = this._cameraClear.getFrameBufferObject();
            for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                this._shadowMaps[i].updateShadowTechnique(nv, this._viewportDimension[i], fbo);
            }
        },

        // internal texture allocation
        // handle any change like resize, filter param, etc.
        initTexture: function() {
            if (!this._dirty) return;

            if (!this._texture) {
                this._texture = new ShadowTextureAtlas();
                this._textureUnit = this._textureUnitBase;
            }

            this._texture.setTextureSize(this._textureSize, this._textureSize);
            this._texelSizeUniform.setFloat(1.0 / this._textureSize);
            this._renderSize[0] = this._textureSize;
            this._renderSize[1] = this._textureSize;

            var textureFormat;
            // luminance Float format ?
            textureFormat = Texture.RGBA;

            ShadowMap.prototype.setTextureFiltering.call(this);
            this._texture.setInternalFormat(textureFormat);

            this._texture.setWrapS(Texture.CLAMP_TO_EDGE);
            this._texture.setWrapT(Texture.CLAMP_TO_EDGE);

            this._texture.dirty();
        },

        // Defines the frustum from light param.
        //
        cullShadowCasting: function(cullVisitor, bbox) {
            this._cameraClear.accept(cullVisitor);

            for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                var shadowMap = this._shadowMaps[i];
                if (shadowMap.isContinuousUpdate() || shadowMap.needRedraw()) {
                    shadowMap.cullShadowCasting(cullVisitor, bbox);
                }
            }
        },

        isContinuousUpdate: function() {
            // need at least one shadow to be enabled
            // so that shadowedScene will continue shadowCasting
            for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                if (this._shadowMaps[i].isContinuousUpdate()) {
                    return true;
                }
            }
            return false;
        },

        needRedraw: function() {
            // need at least one shadow not dirty
            // so that shadowedScene will continue shadowCasting
            for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                if (this._shadowMaps[i].needRedraw()) {
                    return true;
                }
            }
            return false;
        },

        removeShadowMap: function(shadowMap) {
            if (this._shadowMaps.length > 0) {
                var idx = this._shadowMaps.indexOf(shadowMap);
                if (idx !== -1) {
                    if (this._shadowMaps[idx].valid()) {
                        this._shadowMaps[idx].cleanSceneGraph(true);
                    }
                    this._shadowMaps.splice(idx, 1);

                    var lightNumberArray = this._texture.getLightNumberArray();
                    idx = lightNumberArray.indexOf(shadowMap.getLightNumber());
                    if (idx !== -1) lightNumberArray.splice(idx, 1);

                    var light = shadowMap.getLight();
                    idx = this._lights.indexOf(light);
                    if (idx !== -1) this._lights.splice(idx, 1);

                    if (this._viewportDimension.length > idx) {
                        this._viewportDimension.splice(idx, 1);
                    }

                    this.recomputeViewports();
                }
            }
        },

        addShadowMap: function(shadowMap) {
            if (this._shadowMaps.length > 0) {
                if (this._shadowMaps.indexOf(shadowMap) !== -1) return;
            }

            this._shadowMaps.push(shadowMap);

            var light = shadowMap.getLight();
            if (this._lights.indexOf(light) === -1) {
                this._lights.push(light);
            }

            if (this._shadowedScene) shadowMap.setShadowedScene(this._shadowedScene);

            var lightNumberArray = this._texture.getLightNumberArray();
            if (lightNumberArray.indexOf(shadowMap.getLightNumber()) === -1) {
                lightNumberArray.push(light.getLightNumber());
            }

            this.recomputeViewports();
        },

        cleanReceivingStateSet: function() {
            if (this._receivingStateset) {
                if (this._texture) {
                    // remove this._texture, but not if it's not this._texture
                    if (
                        this._receivingStateset.getTextureAttribute(
                            this._textureUnit,
                            this._texture.getTypeMember()
                        ) === this._texture
                    )
                        this._receivingStateset.removeTextureAttribute(
                            this._textureUnit,
                            this._texture.getTypeMember()
                        );
                }

                for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                    this._shadowMaps[i].cleanReceivingStateSet();
                }
            }
        },
        cleanSceneGraph: function() {
            // TODO: need state
            //this._texture.releaseGLObjects();
            //this._shadowReceiveAttribute = undefined;
            this._texture = undefined;
            this._shadowedScene = undefined;
        },
        setDebug: function(enable, lightNum) {
            if (!lightNum) {
                for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                    this._shadowMaps[i].setDebug(enable);
                }
            } else {
                this._shadowMaps[lightNum].setDebug(enable);
            }
        },
        markSceneAsNoShadow: function() {
            for (var i = 0, l = this._shadowMaps.length; i < l; i++) {
                this._shadowMaps[i].markSceneAsNoShadow();
            }
        }
    }),
    'osgShadow',
    'ShadowMapAtlas'
);

export default ShadowMapAtlas;
