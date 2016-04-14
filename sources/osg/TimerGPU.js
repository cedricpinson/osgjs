'use strict';
var Notify = require( 'osg/Notify' );

// use EXT_disjoint_timer_query
// to time webgl calls GPU side
// average over multiple frames
// for consistent results
// use double buffer queries for that.
// see http://www.reedbeta.com/blog/2011/10/12/gpu-profiling-101/
var TimerGPU = function ( gl ) {

    this._enabled = false;

    if ( gl ) {

        var ext = gl.getExtension( 'EXT_disjoint_timer_query' );
        if ( !ext ) return this;

        // https://github.com/KhronosGroup/WebGL/blob/master/sdk/tests/conformance/extensions/ext-disjoint-timer-query.html#L102
        // run the page if strange results
        // to validate you gpu/browser has correct gpu queries support
        this._hasTimeElapsed = ext.getQueryEXT( ext.TIME_ELAPSED_EXT, ext.QUERY_COUNTER_BITS_EXT ) >= 30;
        this._hasTimeStamp = ext.getQueryEXT( ext.TIMESTAMP_EXT, ext.QUERY_COUNTER_BITS_EXT ) >= 30;

        if ( !this._hasTimeElapsed && !this.hasTimeStamp ) {
            return this;
        }

        // no timestamp means not start/end absolute time
        // which means each start must be followed by a end
        // BEFORE any other start (of other queryID)
        if ( !this.hasTimeStamp ) {
            Notify.warn( 'Warning: do not use interleaved GPU query' );
        }

        this._gl = gl;
        this._glTimer = ext;
        this._enabled = true;

    }

    // those we seek results of
    // (all query per frame)
    // double Buffered
    this._pollingStartQueries = {};
    this._pollingEndQueries = {};
    // query list currently recording
    // between a start and a end query
    this._runningQueries = {};
    // number of query asked (current index query per queryID)
    this._timingCountQuery = {};
    // number of query answered with results
    this._resultCountQuery = {};
    // cumulative average
    this._averageTimerQuery = {};
    // query waiting async results from GPU 
    this._waitingQueries = {};
    // cumulative average on N frame
    // reset & restart every N frames
    this._frameAverageCount = 30;
};

TimerGPU.instance = function ( gl ) {

    if ( !TimerGPU._instance ) {
        TimerGPU._instance = new TimerGPU( gl );
    } else if ( gl && TimerGPU._instance.getContext() !== gl ) {
        TimerGPU._instance.setContext( gl );
    }
    return TimerGPU._instance;

};

TimerGPU.prototype = {

    getContext: function () {
        return this._gl;
    },
    setContext: function ( gl ) {
        this._gl = gl;
    },
    setFrameAverageCount: function ( val ) {
        this._frameAverageCount = val;
    },

    // when timing same thing
    // but under new conditions
    reset: function ( queryID ) {

        this._timingCountQuery[ queryID ] = 0;
        this._averageTimerQuery[ queryID ] = 0.0;
        this._resultCountQuery[ queryID ] = 0;

    },

    // many browser doesn't yet have
    // the marvellous gpu timers
    enable: function () {
        // enable only if we have the extension
        this._enabled = this._glTimer;
    },

    disable: function () {
        this._enabled = false;
    },
    isEnabled: function () {
        return this._enabled;
    },

    setCallback: function ( cb ) {
        this._callback = cb;
    },

    // start recording time
    // if query already exist, don't recreate
    start: function ( queryID ) {

        // If timing currently disabled or glTimer does not exist, exit early.
        if ( !this._enabled ) {
            return undefined;
        }


        if ( !this._timingCountQuery[ queryID ] ) {

            this._resultCountQuery[ queryID ] = 0;
            this._timingCountQuery[ queryID ] = 0;
            this._averageTimerQuery[ queryID ] = 0.0;
            this._pollingStartQueries[ queryID ] = {};
            this._pollingEndQueries[ queryID ] = {};
            this._waitingQueries[ queryID ] = [];

        } else {

            // poll glTimer for data for last frames queries
            this.pollQueriesData( queryID );
        }

        var pollIndex = this._timingCountQuery[ queryID ];

        var startQuery = this._glTimer.createQueryEXT();
        this._pollingStartQueries[ queryID ][ pollIndex ] = startQuery;

        if ( this._hasTimeStamp ) {

            var endQuery = this._glTimer.createQueryEXT();
            this._pollingEndQueries[ queryID ][ pollIndex ] = endQuery;

            this._glTimer.queryCounterEXT( startQuery, this._glTimer.TIMESTAMP_EXT );

        } else {

            this._glTimer.beginQueryEXT( this._glTimer.TIME_ELAPSED_EXT, startQuery );
        }

        this._runningQueries[ queryID ] = startQuery;

        return startQuery;

    },
    /*
     * stop query recording   (if running) 
     * polls for results
     */
    end: function ( queryID ) {

        if ( !this._enabled ) {
            return;
        }



        var query = this._runningQueries[ queryID ];

        // End currently running query
        if ( query ) {

            var pollIndex = this._timingCountQuery[ queryID ];

            if ( this._hasTimeStamp ) {

                var endQuery = this._pollingEndQueries[ queryID ][ pollIndex ];
                this._glTimer.queryCounterEXT( endQuery, this._glTimer.TIMESTAMP_EXT );

            } else {

                this._glTimer.endQueryEXT( this._glTimer.TIME_ELAPSED_EXT );

            }
            this._runningQueries[ queryID ] = undefined;

            // number of finished queries per ID increments.
            this._timingCountQuery[ queryID ]++;

            this._waitingQueries[ queryID ].push( pollIndex );

        }

    },


    // results are async
    pollQueryData: function ( queryID, pollIndex ) {

        // last to be queried
        var lastQuery = this._hasTimeStamp ? this._pollingEndQueries[ queryID ][ pollIndex ] : this._pollingStartQueries[ queryID ][ pollIndex ];

        // wait till results are ready
        var available = this._glTimer.getQueryObjectEXT( lastQuery, this._glTimer.QUERY_RESULT_AVAILABLE_EXT );

        if ( !available ) return null;

        var disjoint = this._gl.getParameter( this._glTimer.GPU_DISJOINT_EXT );

        if ( disjoint ) return null;


        var timeElapsed;

        if ( this._hasTimeStamp ) {

            var startQuery = this._pollingStartQueries[ queryID ][ pollIndex ];

            var startTime = this._glTimer.getQueryObjectEXT( startQuery, this._glTimer.QUERY_RESULT_EXT );
            var endTime = this._glTimer.getQueryObjectEXT( lastQuery, this._glTimer.QUERY_RESULT_EXT );
            timeElapsed = endTime - startTime;

            //free slots
            this._glTimer.deleteQueryEXT( lastQuery );
            this._pollingEndQueries[ queryID ][ pollIndex ] = undefined;
            this._glTimer.deleteQueryEXT( startQuery );
            this._pollingStartQueries[ queryID ][ pollIndex ] = undefined;

        } else {

            timeElapsed = this._glTimer.getQueryObjectEXT( lastQuery, this._glTimer.QUERY_RESULT_EXT );

            //free slots
            this._glTimer.deleteQueryEXT( lastQuery );
            this._pollingStartQueries[ queryID ][ pollIndex ] = undefined;

        }


        if ( timeElapsed === 0 ) return undefined;


        this._resultCountQuery[ queryID ]++;

        // store results
        var lastTime = this._averageTimerQuery[ queryID ];
        var resultCount = this._resultCountQuery[ queryID ];

        // restart cumulative average every frameAveragecount frames
        if ( resultCount > this._frameAverageCount ) {

            this.reset( queryID );
            // we have one result
            this._resultCountQuery[ queryID ]++;
            lastTime = 0;

        }


        var cumulativeAverage;
        if ( lastTime === 0 ) {
            cumulativeAverage = timeElapsed;
        } else {
            // https://en.wikipedia.org/wiki/Moving_average#Cumulative_moving_average
            cumulativeAverage = lastTime + ( ( timeElapsed - lastTime ) / ( resultCount ) );
        }
        this._averageTimerQuery[ queryID ] = cumulativeAverage;

        return cumulativeAverage;

    },

    // results are async
    pollQueriesData: function ( queryID ) {

        var average;
        var self = this;
        var queries = this._waitingQueries[ queryID ];

        queries = queries.filter( function ( pollIndex ) {

            // check if result ready
            var res = self.pollQueryData( queryID, pollIndex );

            // not ready we keep it in waiting queue
            if ( res === null ) return true;
            // ready, but discarded
            if ( res === undefined ) return false;

            average = res;
            // remove from waiting queue
            return false;

        } );
        this._waitingQueries[ queryID ] = queries;

        // only bother client side if we have results
        if ( average !== undefined && this._callback ) {
            this._callback( average, queryID );
        }
    }

};


module.exports = TimerGPU;
