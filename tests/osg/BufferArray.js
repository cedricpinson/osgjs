import { assert } from 'chai';
import mockup from 'tests/mockup/mockup';
import BufferArray from 'osg/BufferArray';

export default function() {
    test('BufferArray', function() {
        (function() {
            var gl = mockup.createFakeRenderer();
            gl.createBuffer = function() {
                return {};
            };

            var content = [];
            for (var i = 0, l = 3 * 50; i < l; i++) {
                content.push(i);
            }
            var b = new BufferArray(BufferArray.ARRAY_BUFFER, content, 3);
            b.bind(gl);
            assert.isOk(b._buffer !== undefined, 'Check we created gl buffer');
            b.releaseGLObjects();
            assert.isOk(b._buffer === undefined, 'Check we released gl buffer');

            assert.equal(b.getType(), 0x1406, 'Check the type set is float 32');
            assert.equal(b.getItemSize(), 3, 'Check item size is 3');
        })();
    });
}
