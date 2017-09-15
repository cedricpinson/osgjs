'use strict';
var assert = require('chai').assert;
var DatabasePager = require('osgDB/DatabasePager');
var PagedLOD = require('osg/PagedLOD');
var Node = require('osg/Node');
var FrameStamp = require('osg/FrameStamp');
var Notify = require('osg/notify');

module.exports = function() {
    var dbpager = new DatabasePager();
    // Modify the processRequest
    dbpager.processRequest = function(dbrequest) {
        this._loading = true;
        var that = this;
        // Check if the request is valid;
        if (dbrequest._groupExpired) {
            //Notify.log( 'DatabasePager::processRequest() Request expired.' );
            that._downloadingRequestsNumber--;
            this._loading = false;
            return undefined;
        }

        // Load from function
        if (dbrequest._function !== undefined) {
            return this.loadNodeFromFunction(dbrequest._function, dbrequest._group).then(function(
                child
            ) {
                that._downloadingRequestsNumber--;
                dbrequest._loadedModel = child;
                that._pendingNodes.push(dbrequest);
                that._loading = false;
            });
        } else if (dbrequest._url !== '') {
            // Load from URL
            return this.loadNodeFromURL(dbrequest._url).then(function(child) {
                that._downloadingRequestsNumber--;
                dbrequest._loadedModel = child;
                that._pendingNodes.push(dbrequest);
                that._loading = false;
            });
        }
    };

    test('DatabasePager.requestNodeFile', function(done) {
        dbpager.reset();
        var fn = function createNode(/*parent*/) {
            var n = new Node();
            return n;
        };
        var plod = new PagedLOD();
        plod.setFunction(0, fn);
        plod.setRange(0, 0, 200);
        var request = dbpager.requestNodeFile(fn, '', plod, 1);
        assert.isOk(dbpager._pendingRequests.length === 1, 'Node requested');
        dbpager
            .processRequest(request)
            .then(function() {
                done();
                assert.isOk(dbpager._pendingNodes.length === 1, 'Request processed');
            })
            .catch(function(error) {
                Notify.error(error);
            });
    });

    test('DatabasePager.addLoadedDataToSceneGraph', function(done) {
        dbpager.reset();
        var fn = function createNode(/*parent*/) {
            var n = new PagedLOD();
            return n;
        };
        var plod = new PagedLOD();
        plod.setFunction(0, fn);
        plod.setRange(0, 0, 200);
        var request = dbpager.requestNodeFile(fn, '', plod, 1);

        assert.isOk(dbpager._pendingRequests.length === 1, 'Node requested');
        dbpager
            .processRequest(request)
            .then(function() {
                done();
                dbpager.addLoadedDataToSceneGraph(new FrameStamp(), 0.005);
                assert.isOk(
                    dbpager._activePagedLODList.size === 2,
                    'we should have two plods active'
                );
            })
            .catch(function(error) {
                Notify.error(error);
            });
    });

    test('DatabasePager.removeExpiredChildren', function(done) {
        dbpager.reset();
        dbpager.setTargetMaximumNumberOfPageLOD(1);
        var fn = function createNode(/*parent*/) {
            var n = new PagedLOD();
            return n;
        };
        var plod = new PagedLOD();
        plod.setFunction(0, fn);
        plod.setRange(0, 0, 200);
        var request = dbpager.requestNodeFile(fn, '', plod, 1);
        var frameStamp = new FrameStamp();
        assert.isOk(dbpager._pendingRequests.length === 1, 'Node requested');
        dbpager
            .processRequest(request)
            .then(function() {
                done();
                dbpager.addLoadedDataToSceneGraph(frameStamp);
                frameStamp.setSimulationTime(10);
                frameStamp.setFrameNumber(10);
                dbpager.removeExpiredSubgraphs(frameStamp);
                assert.isOk(
                    dbpager._activePagedLODList.size === 1,
                    'we should have the root plod active'
                );
                assert.isOk(
                    dbpager._childrenToRemoveList.size === 1,
                    'we should have the child plod marked to be deleted'
                );
            })
            .catch(function(error) {
                Notify.error(error);
            });
    });
};
