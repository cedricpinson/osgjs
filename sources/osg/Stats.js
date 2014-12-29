define( [
    'osg/Notify'

], function ( Notify ) {

    'use strict';

    // osg/Stats.cpp
    // the difference here is that we dont support reference to number. Instead
    // we return the value. If there is no value for an attribute name
    // it returns Number.MAX_VALUE, that can be check with Stats.isValid( value )

    var Stats = function ( name, samples ) {

        this._nbFrames = 25;
        this._baseFrameNumber = 0;
        this._lastFrameNumber = 0;
        this._attributeMapList = [];
        this._name = name;

        if ( samples !== undefined )
            this._nbFrames = samples;

        for ( var i = 0; i < this._nbFrames; i++ )
            this._attributeMapList.push( new Map() );
    };

    Stats.isValid = function ( value ) {
        return value !== Number.MAX_VALUE;
    };

    Stats.prototype = {

        getEarliestFrameNumber: function () {
            return this._latestFrameNumber < this._attributeMapList.length ? 0 : ( this._latestFrameNumber - this._attributeMapList.length + 1 );
        },

        getLatestFrameNumber: function () {
            return this._latestFrameNumber;
        },

        getIndex: function ( frameNumber ) {
            // reject frame that are in the future
            if ( frameNumber > this._latestFrameNumber ) return -1;

            // reject frames that are too early
            if ( frameNumber < this.getEarliestFrameNumber() ) return -1;

            if ( frameNumber >= this._baseFrameNumber ) return frameNumber - this._baseFrameNumber;
            else return this._attributeMapList.length - ( this._baseFrameNumber - frameNumber );
        },

        setAttribute: function ( frameNumber, attributeName, value ) {

            var index = 0;
            if ( frameNumber > this._lastFrameNumber ) {
                // need to advance

                var attributeLength = this._attributeMapList.length;

                // first clear the entries up to and including the new frameNumber
                for ( var i = this._latestFrameNumber + 1; i <= frameNumber; ++i ) {
                    index = ( i - this._baseFrameNumber ) % attributeLength;
                    this._attributeMapList[ index ].clear();
                }

                if ( ( frameNumber - this._baseFrameNumber ) >= attributeLength )
                    this._baseFrameNumber = ( frameNumber / attributeLength ) * attributeLength;

                this._latestFrameNumber = frameNumber;
            }

            index = this.getIndex( frameNumber );

            if ( index < 0 ) {
                Notify.log( 'Failed to assing valid index for Stats::setAttribute(', frameNumber, ',', attributeName, ',', value, ')' );
                return false;
            }

            this._attributeMapList[ index ].set( attributeName, value );
            return true;
        },

        getAttribute: function ( frameNumber, attributeName ) {
            var index = this.getIndex( frameNumber );
            if ( index < 0 ) return 0.0;

            var value = this._attributeMapList[ index ].get( attributeName );
            if ( value === undefined )
                value = Number.MAX_VALUE;

            return value;
        },


        getAveragedAttribute: function ( startFrameNumber, endFrameNumber, attributeName, averageInInverseSpace ) {

            var value = 0.0;

            if ( endFrameNumber < startFrameNumber ) {
                var tmp = endFrameNumber;
                endFrameNumber = startFrameNumber;
                startFrameNumber = tmp;
            }

            var total = 0.0;
            var numValidSamples = 0.0;
            for ( var i = startFrameNumber; i <= endFrameNumber; ++i ) {
                var v = 0.0;
                v = this.getAttribute( i, attributeName );

                if ( v !== Number.MAX_VALUE ) { // check for invalid sample

                    if ( averageInInverseSpace ) total += 1.0 / v;
                    else total += v;
                    numValidSamples += 1.0;
                }
            }

            if ( numValidSamples === 0.0 )
                return Number.MAX_VALUE;

            if ( averageInInverseSpace )
                value = numValidSamples / total;
            else
                value = total / numValidSamples;

            return value;
        }


    };


    return Stats;

} );
