(function() {
    'use strict';

    var OSG = window.OSG;
    var osg = OSG.osg;
    var osgViewer = OSG.osgViewer;
    var osgDB = OSG.osgDB;

    var getShader = function() {
        var vertexshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',

            'attribute vec3 Vertex;',
            'attribute vec3 Normal;',

            'uniform vec3 uCenterPicking;',
            'uniform mat4 uModelViewMatrix;',
            'uniform mat4 uProjectionMatrix;',
            'uniform mat3 uModelViewNormalMatrix;',

            'varying vec3 vViewVertex;',
            'varying vec3 vNormal;',
            'varying vec3 vInter;',

            'void main( void ) {',
            '  vInter = vec3( uModelViewMatrix * vec4( uCenterPicking, 1.0 ) );',
            '  vNormal = normalize( uModelViewNormalMatrix * Normal );',
            '  vViewVertex = vec3( uModelViewMatrix * vec4( Vertex, 1.0 ) );',
            '  gl_Position = uProjectionMatrix * (uModelViewMatrix * vec4( Vertex, 1.0 ));',
            '}'
        ].join('\n');

        var fragmentshader = [
            '',
            '#ifdef GL_ES',
            'precision highp float;',
            '#endif',

            'uniform float uTime;',
            'uniform float uRadiusSquared;',

            'varying vec3 vViewVertex;',
            'varying vec3 vNormal;',
            'varying vec3 vInter;',

            'void main( void ) {',
            '  float t = mod( uTime * 0.5, 1000.0 ) / 1000.0;', // time [0..1]
            '  t = t > 0.5 ? 1.0 - t : t;', // [0->0.5] , [0.5->0]
            '  vec3 vecDistance = ( vViewVertex - vInter );',
            '  float dotSquared = dot( vecDistance, vecDistance );',
            '  if ( dotSquared < uRadiusSquared * 1.1 && dotSquared > uRadiusSquared*0.90 )',
            '    gl_FragColor = vec4( 0.75-t, 0.25+t, 0.0, 1.0 );',
            '  else if ( dotSquared < uRadiusSquared )',
            '    discard;',
            '  else',
            '    gl_FragColor = vec4( vNormal * 0.5 + 0.5, 1.0 );',
            '}'
        ].join('\n');

        var program = new osg.Program(
            new osg.Shader(osg.Shader.VERTEX_SHADER, vertexshader),
            new osg.Shader(osg.Shader.FRAGMENT_SHADER, fragmentshader)
        );

        return program;
    };

    var loadModel = function(data, viewer, node, unifs) {
        var promise = osgDB.parseSceneGraph(data);
        // var promise = window.P.resolve( osg.createTexturedSphere( 1.0, 500, 500 ) );

        promise.then(function(child) {
            node.addChild(child);

            child.getOrCreateStateSet().setAttributeAndModes(getShader());
            child.getOrCreateStateSet().addUniform(unifs.center);
            child.getOrCreateStateSet().addUniform(unifs.radius2);
            child.getOrCreateStateSet().addUniform(unifs.time);
            unifs.radius2.setFloat(child.getBound().radius2() * 0.02);

            // console.time( 'build' );
            var treeBuilder = new osg.KdTreeBuilder({
                _numVerticesProcessed: 0,
                _targetNumTrianglesPerLeaf: 50,
                _maxNumLevels: 20
            });
            treeBuilder.apply(node);
            // console.timeEnd( 'build' );
        });
    };

    var loadUrl = function(url, viewer, node, unifs) {
        osg.log('loading ' + url);
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.onload = function() {
            loadModel(JSON.parse(req.responseText), viewer, node, unifs);
            osg.log('success ' + url);
        };
        req.onerror = function() {
            osg.log('error ' + url);
        };
        req.send(null);
    };

    var createScene = function(viewer, unifs) {
        var root = new osg.Node();

        loadUrl('../media/models/raceship.osgjs', viewer, root, unifs);
        root.getOrCreateStateSet().setAttributeAndModes(new osg.CullFace(osg.CullFace.DISABLE));

        var UpdateCallback = function() {
            this.baseTime_ = new Date().getTime();
            this.update = function() {
                unifs.time.setFloat(new Date().getTime() - this.baseTime_);
                return true;
            };
        };

        root.addUpdateCallback(new UpdateCallback());

        return root;
    };

    var myReservedMatrixStack = new osg.PooledResource(osg.mat4.create);

    var projectToScreen = (function() {
        var mat = osg.mat4.create();
        var winMat = osg.mat4.create();
        return function(cam, hit) {
            osg.mat4.identity(mat);
            osg.mat4.mul(
                mat,
                mat,
                cam.getViewport() ? cam.getViewport().computeWindowMatrix(winMat) : winMat
            );
            osg.mat4.mul(mat, mat, cam.getProjectionMatrix());
            osg.mat4.mul(mat, mat, cam.getViewMatrix());

            myReservedMatrixStack.reset();
            // Node 0 in nodepath is the Camera of the Viewer, so we take next child
            osg.mat4.mul(
                mat,
                mat,
                osg.computeLocalToWorld(
                    hit._nodePath.slice(1),
                    true,
                    myReservedMatrixStack.getOrCreateObject()
                )
            );

            var pt = [0.0, 0.0, 0.0];
            osg.vec3.transformMat4(pt, hit._localIntersectionPoint, mat);
            return pt;
        };
    })();

    var onMouseMove = function(canvas, viewer, unifs, ev) {
        // TODO maybe doing some benchmark with a lot of geometry,
        // since there's one kdtree per geometry ...
        // console.time( 'pick' );

        // take care of retina display canvas size
        var ratioX = canvas.width / canvas.clientWidth;
        var ratioY = canvas.height / canvas.clientHeight;

        var hits = viewer.computeIntersections(
            ev.clientX * ratioX,
            (canvas.clientHeight - ev.clientY) * ratioY
        );
        // console.timeEnd( 'pick' );
        // console.log( hits.length );

        hits.sort(function(a, b) {
            return a._ratio - b._ratio;
        });

        if (hits.length === 0) return;
        var point = hits[0]._localIntersectionPoint;
        var ptFixed = [point[0].toFixed(2), point[1].toFixed(2), point[2].toFixed(2)];

        //update shader uniform
        unifs.center.setVec3(point);

        var pt = projectToScreen(viewer.getCamera(), hits[0]);

        var ptx = parseInt(pt[0], 10) / ratioX;
        var pty = parseInt(canvas.height - pt[1], 10) / ratioY;
        var d = document.getElementById('picking');
        d.textContent = 'x: ' + ptx.toFixed(2) + ' y: ' + pty.toFixed(2) + '\n' + ptFixed;

        d.style.transform = 'translate3d(' + ptx + 'px,' + pty + 'px,0)';

        // sphere intersection
        var runSphere = true;
        if (runSphere) {
            var osgUtil = OSG.osgUtil;
            var si = new osgUtil.SphereIntersector();
            //compute world point
            //for sphere intersection
            var worldPoint = osg.vec3.create();
            myReservedMatrixStack.reset();
            osg.vec3.transformMat4(
                worldPoint,
                point,
                osg.computeLocalToWorld(
                    hits[0]._nodePath.slice(1),
                    true,
                    myReservedMatrixStack.getOrCreateObject()
                )
            );

            si.set(worldPoint, viewer.getSceneData().getBound().radius() * 0.1);
            var iv = new osgUtil.IntersectionVisitor();
            iv.setIntersector(si);
            viewer.getSceneData().accept(iv);
            // console.log( si.getIntersections().length );
        }
    };

    var onLoad = function() {
        var canvas = document.getElementById('View');

        var unifs = {
            center: osg.Uniform.createFloat3(new Float32Array(3), 'uCenterPicking'),
            radius2: osg.Uniform.createFloat1(0.1, 'uRadiusSquared'),
            time: osg.Uniform.createFloat1(0.1, 'uTime')
        };

        var viewer = new osgViewer.Viewer(canvas);
        viewer.init();
        viewer.setSceneData(createScene(viewer, unifs));
        viewer.setupManipulator();
        viewer.run();

        canvas.addEventListener('mousemove', onMouseMove.bind(this, canvas, viewer, unifs), true);
    };

    window.addEventListener('load', onLoad, true);
})();
