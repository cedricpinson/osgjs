function check_near(a, b, threshold) {
    if (threshold === undefined) {
        threshold = 1e-5;
    }

    if (jQuery.isArray(a)) {
        for (var i = 0; i < a.length; ++i) {
            var number = typeof a[i] === "number" && typeof b[i] === "number";
            if (Math.abs(a[i]-b[i]) > threshold || number === false) {
                QUnit.log(false, QUnit.jsDump.parse(a) + " expected " + QUnit.jsDump.parse(b));
                return false;
            }
        }
    } else {
        if (Math.abs(a-b) > threshold) {
            QUnit.log(false, a + " != " + b);
            return false;
        }
    }
    return true;
}

function near(a, b, threshold)
{
    if (threshold === undefined) {
        threshold = 1e-5;
    }

    if (jQuery.isArray(a)) {
        for (var i = 0; i < a.length; ++i) {
            var number = typeof a[i] === "number" && typeof b[i] === "number";
            if (Math.abs(a[i]-b[i]) > threshold || number === false) {
                ok(false, QUnit.jsDump.parse(a) + " expected " + QUnit.jsDump.parse(b));
                return;
            }
        }
    } else {
        if (Math.abs(a-b) > threshold) {
            ok(false, a + " != " + b);
            return;
        }
    }
    ok(true, "okay: " + QUnit.jsDump.parse(a));
}


test("osg.Quat.init", function() {
    var q = osg.Quat.init();
    same(q, [0,0,0,1]);

    var q0 = [];
    osg.Quat.init(q0);
    same(q0, [0,0,0,1]);
});


test("osg.Quat.makeRotate", function() {
    var q0 = osg.Quat.makeRotate(Math.PI, 1, 0, 0);
    near(q0, [1, 0, 0, 6.12303e-17], 1e-5);

    var q1 = osg.Quat.makeRotate(Math.PI/2, 0, 1, 0);
    near(q1, [0, 0.707107, 0, 0.707107]);

    var q2 = osg.Quat.makeRotate(Math.PI/4, 0, 0, 1);
    near(q2, [0, 0, 0.382683, 0.92388]);
});


test("osg.Quat.mult", function() {
    var q0 = osg.Quat.makeRotate(Math.PI, 1, 0, 0);
    var q1 = osg.Quat.makeRotate(Math.PI/2, 0, 1, 0);
    var q2 = osg.Quat.makeRotate(Math.PI/4, 0, 0, 1);

    near(osg.Quat.mult(q0,q1) , [0.707107, 4.32964e-17, -0.707107, 4.32964e-17]);

    near(osg.Quat.mult(osg.Quat.mult(q0,q1), q2) , [0.653281, 0.270598, -0.653281, 0.270598]);
});


test("osg.Quat.slerp", function() {
    near(osg.Quat.slerp(0.5, [0, 0.707107, 0, 0.707107] , [0, 0, 0.382683, 0.92388]) , [0, 0.388863, 0.210451, 0.896937]);
});


test("osg.Matrix.makeRotateFromQuat", function() {
    var m = osg.Matrix.makeRotateFromQuat([0.653281, 0.270598, -0.653281, 0.270598]);
    near(m , [1.66533e-16, 1.11022e-16, -1, 0,
              0.707107, -0.707107, 0, 0,
              -0.707107, -0.707107, -1.66533e-16, 0,
              0, 0, 0, 1]);
});

test("osg.Matrix.getRotate", function() {
    var m = osg.Matrix.makeRotateFromQuat([0.653281, 0.270598, -0.653281, 0.270598]);
    var q = osg.Matrix.getRotate(m);
    near(q , [0.653281, 0.270598, -0.653281, 0.270598]);

});

test("osg.Matrix.makeLookAt", function() {
    var m = osg.Matrix.makeLookAt([0, -10, 0],
                              [0.0, 0.0, 0.0],
                              [0.0, 0.0, 1.0]);
    near(m , [1, 0, -0, 0,
	      0, 0, -1, 0,
	      0, 1, -0, 0,
	      0, 0, -10, 1]);


    var m2 = osg.Matrix.makeLookAt([0, 0, -10],
                               [0.0, 0.0, 0.0],
                               [0.0, 1.0, 0.0]);
    near(m2 , [-1, 0, -0, 0,
	       0, 1, -0, 0,
	       0, -0, -1, 0,
	       0, 0, -10, 1]);
});

test("osg.Matrix.getLookAt", function() {
    var m = osg.Matrix.makeLookAt([0, -10, 0],
                              [0.0, 5.0, 0.0],
                              [0.0, 0.0, 1.0]);
    var eye = [];
    var target = [];
    var up = [];
    osg.Matrix.getLookAt(m,
                         eye,
                         target,
                         up, 5.0);
    near(eye , [0, -10, 0]);
    near(target , [0, -5.0, 0]); // should be five but mimic same behaviour as OpenSceneGraph
    near(up , [0, 0, 1]);
});

test("osg.Matrix.transformVec3", function() {
    var m = osg.Matrix.makeRotate( Math.PI/2.0, 0, 1, 0);
    var vec = [0, 0, 10];
    var res = osg.Matrix.transformVec3(vec, osg.Matrix.inverse(m));
    near(res , [10, 0, 0]);


    var res2 = osg.Matrix.transformVec3(res, m);
    near(res2 , [0, 0, 10]);
});

test("osg.Matrix.mult", function() {
    var width = 800;
    var height = 600;
    var translate;
    var scale;

    translate = osg.Matrix.makeTranslate(1.0, 1.0, 1.0);
    scale = osg.Matrix.makeScale(0.5*width, 0.5*height, 0.5);
    var res = osg.Matrix.mult(translate, scale);
    near(res , [400, 0, 0, 0,
	        0, 300, 0, 0,
	        0, 0, 0.5, 0,
	        400, 300, 0.5, 1]);

    translate = osg.Matrix.makeTranslate(1.0, 1.0, 1.0);
    scale = osg.Matrix.makeScale(0.5*width, 0.5*height, 0.5);
    res = osg.Matrix.mult(translate, scale, translate);
    ok(check_near(res , [400, 0, 0, 0,
	                 0, 300, 0, 0,
	                 0, 0, 0.5, 0,
	                 400, 300, 0.5, 1]), "check preMult");


    translate = osg.Matrix.makeTranslate(1.0, 1.0, 1.0);
    scale = osg.Matrix.makeScale(0.5*width, 0.5*height, 0.5);
    res = osg.Matrix.mult(translate, scale, scale);
    ok(check_near(res , [400, 0, 0, 0,
	                 0, 300, 0, 0,
	                 0, 0, 0.5, 0,
	                 400, 300, 0.5, 1]), "check postMult");
});



test("osg.Matrix.inverse", function() {

    var m = [ -1144.3119511948212,
	      23.865014474735936,
	      -0.12300358188893337,
	      -0.12288057830704444,
	      -1553.3126291998985,
	      -1441.499918560778,
	      -1.619653642392287,
	      -1.6180339887498945,
	      0,
	      0,
	      0,
	      0,
	      25190.498321578874,
	      13410.539616344166,
	      21.885543812039796,
	      21.963658268227753];

    ok(true, osg.Matrix.inverse(m));

});

test("osg.NodeVisitor", function() {

    var FindItemAnchor = function(search) {
        this.search = search
        this.result = [];
    }
    FindItemAnchor.prototype = osg.objectInehrit(osg.NodeVisitor.prototype, {
        apply: function( node ) {
            if (node.getName !== undefined) {
                var name = node.getName();
                if (name !== undefined && name === this.search) {
                    this.result.push(node);
                }
            }
            this.traverse(node);
        }
    });


    var root = new osg.Node();
    root.setName("a");
    var b = new osg.Node();
    b.setName("b");
    var c = new osg.Node();
    c.setName("c");
    root.addChild(b);
    root.addChild(c);

    var v = new FindItemAnchor("c");
    v.apply(root);
    ok(v.result[0] === c, "Should find item named 'c' " + v.result[0].name);

    c.setNodeMask(0x0);
    v = new FindItemAnchor("c");
    root.accept(v);
    ok(v.result.length === 0, "Should not find item named 'c' because of node mask");

});



test("osg.UpdateVisitor", function() {

    var uv = new osg.UpdateVisitor();

    var root = new osg.Node();
    root.setName("a");
    var b = new osg.Node();
    b.setName("b");
    var c = new osg.Node();
    c.setName("c");
    root.addChild(b);
    b.addChild(c);

    var callRoot = 0;
    var callb = 0;
    var callc = 0;

    var froot = function() {};
    froot.prototype = {
        update: function(node, nv) {
            callRoot = 1;
            node.traverse(nv);
        }
    };

    var fb = function() {};
    fb.prototype = {
        update: function(node, nv) {
        callb = 1;
        }
    };

    var fc = function() {};
    fc.prototype = {
        update: function(node, nv) {
        callc = 1;
        }
    };

    root.setUpdateCallback(new froot());
    b.setUpdateCallback(new fb());
    c.setUpdateCallback(new fc());

    uv.apply(root);

    ok(callRoot === 1, "Called root update callback");
    ok(callb === 1, "Called b update callback");
    ok(callc === 0, "Did not Call c update callback as expected");

    root.setNodeMask(~0);
    ok(callRoot === 1, "Called root update callback");
    ok(callb === 1, "Called b update callback");
    ok(callc === 0, "Did not Call c update callback as expected");
});


test("CheckMixAutogenaratedProgram", function() {

    var scene = new osg.Node();
    var item0 = new osg.Node();
    item0.getOrCreateStateSet().setAttributeAndMode(new osg.Material());
    item0.addChild(osg.createTexuredQuad(0,0,0,
                                         1,0,0,
                                         0,0,1));

    var item1 = new osg.Node();
    item1.addChild(osg.createTexuredQuad(0,0,0,
                                         1,0,0,
                                         0,0,1));
    var vertexshader = [
        "",
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "attribute vec3 Vertex;",
        "uniform mat4 ModelViewMatrix;",
        "uniform mat4 ProjectionMatrix;",
        "void main(void) {",
        "  gl_Position = ProjectionMatrix * ModelViewMatrix * vec4(Vertex,1.0);",
        "}",
        ""
    ].join('\n');

    var fragmentshader = [
        "",
        "#ifdef GL_ES",
        "precision highp float;",
        "#endif",
        "void main(void) {",
        "gl_FragColor = vec4(1.0,1.0,1.0,1.0);",
        "}",
        ""
    ].join('\n');

    var program = osg.Program.create(
        osg.Shader.create(gl.VERTEX_SHADER, vertexshader),
        osg.Shader.create(gl.FRAGMENT_SHADER, fragmentshader));
    item1.getOrCreateStateSet().setAttributeAndMode(program);

    scene.addChild(item0);
    scene.addChild(item1);

    var state = new osg.State();
    var cullVisitor = new osg.CullVisitor();
    scene.accept(cullVisitor);
    cullVisitor.renderBin.drawImplementation(state);
    
    cullVisitor.reset();
    scene.accept(cullVisitor);
    cullVisitor.renderBin.drawImplementation(state);

});