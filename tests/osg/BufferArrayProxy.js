import { assert } from 'chai';
import BufferArrayProxy from 'osg/BufferArrayProxy';
import BufferArray from 'osg/BufferArray';

export default function() {
    test('BufferArrayProxy', function() {
        (function() {
            var bufferArrayA = new BufferArray();
            var bufferArrayB = new BufferArray();

            var bufferArrayProxyA = new BufferArrayProxy(bufferArrayA);
            var bufferArrayProxyB = new BufferArrayProxy(bufferArrayB);

            bufferArrayProxyA.setBufferArray(bufferArrayB);
            bufferArrayProxyB.setBufferArray(bufferArrayA);

            assert.equal(
                bufferArrayProxyA.getInstanceID(),
                bufferArrayB.getInstanceID(),
                'check proxyA use B'
            );
            assert.equal(
                bufferArrayProxyB.getInstanceID(),
                bufferArrayA.getInstanceID(),
                'check proxyB use A'
            );
            assert.equal(
                bufferArrayProxyA.getInitialBufferArray().getInstanceID(),
                bufferArrayA.getInstanceID(),
                'check initial buffer'
            );

            bufferArrayProxyA.setBufferArray(bufferArrayProxyB);
            assert.equal(
                bufferArrayProxyA.getInstanceID(),
                bufferArrayProxyB.getBufferArray().getInstanceID(),
                'check proxy with proxy'
            );
        })();
    });
}
