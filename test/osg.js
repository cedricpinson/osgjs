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

    near(osg.Quat.mult(q1, q0) , [0.707107, 4.32964e-17, -0.707107, 4.32964e-17]);

    near(osg.Quat.mult(q2, osg.Quat.mult(q1,q0)) , [0.653281, 0.270598, -0.653281, 0.270598]);
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
    var res = osg.Matrix.transformVec3(osg.Matrix.inverse(m), vec);
    near(res , [10, 0, 0]);

    var res2 = osg.Matrix.transformVec3(m, res);
    near(res2 , [0, 0, 10]);


    var m = [-0.00003499092540543186, 0, 0, 0, 0, 0.00003499092540543186, 0, 0, 0, 0, 1.8163636363636322, -9.989999999999977, 0.013996370162172783, -0.010497277621629587, -1.7999999999999958, 9.999999999999977];
    var preMultVec3 = function(s, vec, result) {
        if (result === undefined) {
            result = [];
        }
        var d = 1.0/( s[3]*vec[0] + s[7] * vec[1] + s[11]*vec[2] + s[15] );
        result[0] = (s[0] * vec[0] + s[4]*vec[1] + s[8]*vec[2] + s[12]) * d;
        result[1] = (s[1] * vec[0] + s[5]*vec[1] + s[9]*vec[2] + s[13]) * d;
        result[2] = (s[2] * vec[0] + s[6]*vec[1] + s[10]*vec[2] + s[14]) * d;
        return result;
    };
    var r0 = preMultVec3(m, [400, 300, 1]);
    var res = osg.Matrix.transformVec3(m, [400, 300, 1]);
    near(res , r0);

});

test("osg.Matrix.transpose", function() {
    var m = [ 0,1,2,3,
              4,5,6,7,
              8,9,10,11,
              12,13,14,15];
    var res = osg.Matrix.transpose(m);
    near(res , [0, 4, 8, 12,
                1, 5, 9, 13,
                2, 6, 10,14,
                3, 7, 11,15]);

    var res2 = osg.Matrix.transpose(m, res2);
    near(res2 , [0, 4, 8, 12,
                 1, 5, 9, 13,
                 2, 6, 10,14,
                 3, 7, 11,15]);

    var res3 = osg.Matrix.transpose(m, m);
    near(res3 , [0, 4, 8, 12,
              1, 5, 9, 13,
              2, 6, 10,14,
              3, 7, 11,15]);
});

test("osg.Matrix.mult", function() {
    var width = 800;
    var height = 600;
    var translate;
    var scale;

    translate = osg.Matrix.makeTranslate(1.0, 1.0, 1.0);
    scale = osg.Matrix.makeScale(0.5*width, 0.5*height, 0.5);
    var res = osg.Matrix.mult(scale, translate);
    near(res , [400, 0, 0, 0,
	        0, 300, 0, 0,
	        0, 0, 0.5, 0,
	        400, 300, 0.5, 1]);

    translate = osg.Matrix.makeTranslate(1.0, 1.0, 1.0);
    scale = osg.Matrix.makeScale(0.5*width, 0.5*height, 0.5);
    res = osg.Matrix.mult(scale, translate, scale);
    ok(check_near(res , [400, 0, 0, 0,
	                 0, 300, 0, 0,
	                 0, 0, 0.5, 0,
	                 400, 300, 0.5, 1]), "check preMult");


    translate = osg.Matrix.makeTranslate(1.0, 1.0, 1.0);
    scale = osg.Matrix.makeScale(0.5*width, 0.5*height, 0.5);
    res = osg.Matrix.mult(scale, translate, translate);
    ok(check_near(res , [400, 0, 0, 0,
	                 0, 300, 0, 0,
	                 0, 0, 0.5, 0,
	                 400, 300, 0.5, 1]), "check postMult");


    // test to check equivalent
    translate = osg.Matrix.makeTranslate(1.0, 1.0, 1.0);
    scale = osg.Matrix.makeScale(0.5*width, 0.5*height, 0.5);

    var ident = osg.Matrix.makeIdentity();
    osg.Matrix.mult(ident, scale, ident);

    osg.Matrix.mult(ident, translate, ident);
    near(ident, [400, 0, 0, 0,
	                 0, 300, 0, 0,
	                 0, 0, 0.5, 0,
	                 400, 300, 0.5, 1]);
    osg.Matrix.mult(scale, translate, scale);
    near(scale, [400, 0, 0, 0,
	         0, 300, 0, 0,
	         0, 0, 0.5, 0,
	         400, 300, 0.5, 1] );

});



test("osg.Matrix.inverse4x3", function() {

    var m = [ 1,
	      0,
	      0,
	      0,
	      0,
	      1,
	      0,
	      0,
	      0,
	      0,
	      1,
	      0,
	      10,
	      10,
	      10,
	      1];

    var result = [];
    var valid = osg.Matrix.inverse4x3(m,result);
    ok(true, valid);
    near(result, [1.0, 0, 0, 0,
                  0  , 1, 0, 0,
                  0  , 0, 1, 0,
                  -10  , -10, -10, 1]);
});

test("osg.Matrix.inverse", function() {
    var result = [];
    var m = [ -1144.3119511948212,
	      23.865014474735936,
	      -0.12300358188893337,
	      -0.12288057830704444,
	      -1553.3126291998985,
	      -1441.499918560778,
	      -1.619653642392287,
	      -1.6180339887498945,
	      0.0,
	      0.0,
	      0.0,
	      0.0,
	      25190.498321578874,
	      13410.539616344166,
	      21.885543812039796,
	      21.963658268227753];

    ok(true, osg.Matrix.inverse(m,result));

    var result2 = [];
    var m2 = [ 0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,1375333.5195828325,-4275596.259263198,4514838.703939765,1.0];
    var valid = osg.Matrix.inverse(m2,result2);
    ok(true, valid);
    osg.log("inverse " + result2.toString());
//    ok(true, valid);
    

});

test("osg.NodeVisitor", function() {

    var FindItemAnchor = function(search) {
        osg.NodeVisitor.call(this);
        this.search = search
        this.result = [];
    };
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



test("osg.ShaderGenerator", function() {

    var state = new osg.State();

    var stateSet0 = new osg.StateSet();
    stateSet0.setAttributeAndMode(new osg.Material());

    var stateSet1 = new osg.StateSet();
    stateSet1.setTextureAttributeAndMode(0,new osg.Texture.create(undefined));

    state.pushStateSet(stateSet0);
    state.pushStateSet(stateSet1);
    state.apply();
});


test("osg.CullVisitor_RenderStage", function() {

    var camera0 = new osg.Camera();
    camera0.setRenderOrder(osg.Transform.NESTED_RENDER);
    var node0 = new osg.Node();
    var node1 = new osg.Node();
    camera0.addChild(node0);
    camera0.addChild(node1);

    var camera1 = new osg.Camera();
    camera1.setRenderOrder(osg.Transform.NESTED_RENDER);
    var node00 = new osg.Node();
    var node10 = new osg.Node();
    camera1.addChild(node00);
    camera1.addChild(node10);

    camera0.addChild(camera1);

    var cull = new osg.CullVisitor();
    var rs = new osg.RenderStage();
    var sg = new osg.StateGraph();
    cull.setRenderStage(rs);
    cull.setStateGraph(sg);

    camera0.accept(cull);

    ok(cull.rootRenderStage === cull.currentRenderBin, "renderStage should stay the render bin and id " + cull.rootRenderStage === cull.currentRenderBin);
});


test("osg.CullVisitor_RenderStage_test0", function() {
    var state = new osg.State();
    var camera0 = new osg.Camera();
    camera0.setViewport(new osg.Viewport());
    camera0.setRenderOrder(osg.Transform.NESTED_RENDER);
    var geom = osg.createTexuredQuad(-10/2.0, 0, -10/2.0,
                                     20, 0, 0,
                                     0, 0 , 20,
                                     1,1);
    camera0.addChild(geom);


    var cull = new osg.CullVisitor();
    var rs = new osg.RenderStage();
    var sg = new osg.StateGraph();
    rs.setViewport(camera0.getViewport());

    cull.setRenderStage(rs);
    cull.setStateGraph(sg);

    camera0.accept(cull);

    ok(cull.rootRenderStage === cull.currentRenderBin, "renderStage should stay the render bin and id " + cull.rootRenderStage === cull.currentRenderBin);

    rs.draw(state);
    

});

