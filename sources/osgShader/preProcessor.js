'use strict';

// remove fat code (undefined)
// TODO: comments, unused functions)
var preProcessor = function ( source, definesInput /*, extensionsInput */ ) {

    var inputsDefines = definesInput && definesInput.slice( 0 );
    //    var inputsExtension = extensionsInput && extensionsInput.slice( 0 );

    // what we'll do
    var pruneComment = false;
    var pruneDefines = true;
    var addNewLines = true;

    // code
    var strippedContent = '';

    // split sources in indexable per line array
    var lines = source.split( '\n' );
    var linesLength = lines.length;
    if ( linesLength === 0 ) return source;

    // regex to extract error message and line from webgl compiler reporting
    // one condition
    var ifdefReg = /#ifdef\s(.+)/i;
    var elseReg = /#else/i;
    var endifReg = /#endif/i;
    var ifndefReg = /#ifndef\s(.+)/i;

    // multipleCondition
    var definedReg = /(?:\s)(!defined|defined)\s?\(\s?(\w+)\)?\s?|(&&)|(\|\|)/gi;
    //var ifReg = /#if defined(.+)/gi;
    //var elifReg = /#elif defined(.+)/gi;

    // change of context
    var defineReg = /#define\s(\w+)$|#define\s(\w+)\s(\S+)|#define\s(\w+)\(\w+\)(.+)/i;
    var undefReg = /#undef (.+)/i;

    // clean ears;
    var ccComent = /\/\/(.+)/i;
    //
    var extensionReg = /#extension\s(\w+)\s:\s(\w+)/i;
    // state var
    var foundIfDef, index, results;

    var droppingComment = false;
    var preProcessorCmd = false;
    // do we drop or include current code
    var droppingDefineStack = [ false ];
    // did we already include code from this branching struct
    var didIncludeDefineStack = [ false ];
    // where are we in branching struct stack deepness
    var droppingDefineStackIndex = 0;

    var definesReplaceMap = {};
    var definesReplaceKeys;
    // get if one of the branch above is dropping code we're in
    var parentDroppingStack = [ false ];

    // prevent complex things when keeping comments
    var isComment = false;

    // Let'start, get A move on !
    for ( var i = 0; i < linesLength; i++ ) {

        var line = lines[ i ].trim();
        if ( line.length === 0 ) continue;


        isComment = droppingComment;

        if ( droppingComment ) {
            if ( line.length >= 2 && line[ 0 ] === '/' && line[ 1 ] === '*' ) {
                droppingComment = false;
            }

            if ( pruneComment ) continue;
        }

        if ( line.length >= 2 ) {

            if ( line[ 0 ] === '/' && line[ 1 ] === '/' ) {

                if ( pruneComment ) continue;
                isComment = true;
            }

            if ( line[ 0 ] === '/' && line[ 1 ] === '*' ) {

                droppingComment = true;
                if ( pruneComment ) continue;
                isComment = true;

            }
        }
        if ( isComment ) {
            strippedContent += lines[ i ] + '\n';
            continue;
        }


        if ( pruneDefines ) {

            preProcessorCmd = line[ 0 ] === '#';
            if ( preProcessorCmd ) {


                // remove comments
                // elif defined(FSDF) //&& defined(NOSF)
                results = line.search( ccComent );
                if ( results !== -1 ) {
                    line = line.substr( 0, results ).trim();
                }

                // important: if dropping,
                // only semi-parse dropping string for out of current branch
                // but semi-parse can only be done by "parsing completely"
                // to get tthe correct else/elif/endif deepness...
                // so do as normal, just prevent any code changing things
                // (like undef/defines....)
                if ( !parentDroppingStack[ droppingDefineStackIndex ] ) {

                    //////////
                    // #extensionReg
                    //https://www.opengl.org/wiki/Core_Language_(GLSL)#Extensions
                    results = line.match( extensionReg );
                    if ( results !== null && results.length > 2 ) {

                        var extension = results[ 1 ].trim();
                        var activation = results[ 2 ].trim();

                        if ( inputsDefines.indexOf( extension ) === -1 ) {

                            switch ( activation ) {

                            case 'enable':
                            case 'require':
                            case 'warn':

                                // TODO: handle neable using webglCAPS
                                inputsDefines.push( extension );
                                // keep it in source otw breaks shader
                                // continue
                                break;

                                //case 'disable':
                            default:
                                //   warn,  disable ...
                                continue;
                            }
                        }
                    }

                    results = line.match( defineReg );
                    if ( results !== null && results.length > 1 ) {

                        var defineRes;
                        var defineVal;
                        if ( results[ 1 ] !== undefined ) {

                            //standard define
                            defineRes = results[ 1 ].trim();

                        } else if ( results[ 2 ] !== undefined ) {

                            defineRes = results[ 2 ].trim();
                            defineVal = results[ 3 ].trim();

                            if ( defineRes !== 'SHADER_NAME' ) {
                                definesReplaceMap[ defineRes ] = defineVal;
                                definesReplaceKeys = window.Object.keys( definesReplaceMap );
                            }

                        } else if ( results[ 3 ] !== undefined ) {

                            // it's a macro
                            // better we ignore it for now ?
                            defineRes = results[ 4 ].trim();
                            //defineVal = results[ 5 ].trim();

                        }
                        //replace( /\s+/g, ' ' ).split( ' ' )[ 1 ];
                        if ( inputsDefines.indexOf( defineRes ) === -1 ) {
                            inputsDefines.push( defineRes );
                        }

                        // keep them in source always
                        // macros/values etc
                        strippedContent += ( pruneComment ) ? line : lines[ i ] + '\n';
                        continue;

                    }

                    results = line.match( undefReg );
                    if ( results !== null && results.length > 1 ) {

                        var defineToUndef = results[ 1 ].trim();
                        var indexOfDefine = inputsDefines.indexOf( defineToUndef );
                        if ( indexOfDefine !== -1 ) {
                            inputsDefines.splice( index, 1 );
                        }

                        if ( definesReplaceMap[ defineToUndef ] !== undefined ) {

                            definesReplaceMap[ defineToUndef ] = undefined;
                            definesReplaceKeys = window.Object.keys( definesReplaceMap );

                        }
                        // keep them in source always
                        // macros/values etc
                        strippedContent += ( ( pruneComment ) ? line : lines[ i ] ) + '\n';
                        continue;

                    }

                }

                //////////
                // #else
                results = line.search( elseReg );
                if ( results !== -1 ) {

                    // was keeping, it's early out
                    if ( didIncludeDefineStack[ droppingDefineStackIndex ] ) {
                        droppingDefineStack[ droppingDefineStackIndex ] = true;
                        parentDroppingStack[ droppingDefineStackIndex ] = true;
                        continue;
                    }

                    // no previous include
                    droppingDefineStack[ droppingDefineStackIndex ] = false;
                    // didIncludeDefineStack[ droppingDefineStackIndex ] no need we're going out next
                    parentDroppingStack[ droppingDefineStackIndex ] = parentDroppingStack[ droppingDefineStackIndex - 1 ];
                    continue;

                }


                //////////
                // #ifdef _EVSM
                results = line.match( ifdefReg );
                if ( results !== null && results.length >= 2 ) {

                    foundIfDef = results[ 1 ];
                    index = inputsDefines.indexOf( foundIfDef );
                    if ( index !== -1 ) {

                        droppingDefineStackIndex++;
                        droppingDefineStack.push( false );
                        didIncludeDefineStack.push( true );
                        parentDroppingStack.push( parentDroppingStack[ droppingDefineStackIndex - 1 ] );

                    } else {

                        droppingDefineStackIndex++;
                        droppingDefineStack.push( true );
                        didIncludeDefineStack.push( false );
                        parentDroppingStack.push( true );

                    }
                    continue;
                }

                //////////
                // #ifndef _dfd
                results = line.match( ifndefReg );
                if ( results !== null && results.length >= 2 ) {

                    foundIfDef = results[ 1 ];
                    index = inputsDefines.indexOf( foundIfDef );
                    if ( index !== -1 ) {

                        droppingDefineStackIndex++;
                        droppingDefineStack.push( true );
                        didIncludeDefineStack.push( false );
                        parentDroppingStack.push( true );

                    } else {

                        droppingDefineStackIndex++;
                        droppingDefineStack.push( false );
                        didIncludeDefineStack.push( true );
                        parentDroppingStack.push( parentDroppingStack[ droppingDefineStackIndex - 1 ] );
                    }

                    continue;

                }

                //////////
                // check for endif
                results = line.search( endifReg );
                if ( results !== -1 ) {

                    droppingDefineStack.pop();
                    didIncludeDefineStack.pop();
                    parentDroppingStack.pop();
                    droppingDefineStackIndex--;

                    continue; // remove endif

                }


                /// complexity arise: multiple condition possible
                var definesGroup;
                var operator;
                var result = true;

                // check of elif
                if ( line.substr( 1, 4 ) === 'elif' ) {

                    // was keeping before, it's a early out
                    if ( didIncludeDefineStack[ droppingDefineStackIndex ] ) {
                        droppingDefineStack[ droppingDefineStackIndex ] = true;
                        parentDroppingStack[ droppingDefineStackIndex ] = true;
                        continue;
                    }

                    result = true;
                    operator = '&&';
                    while ( ( definesGroup = definedReg.exec( line ) ) !== null ) {
                        if ( definesGroup.length > 2 ) {

                            if ( definesGroup[ 1 ] === undefined ) {

                                // yeah. don't ask for the undefined. just follow along.
                                // "in theory it should be , in practice however..."

                                operator = definesGroup[ 0 ].trim();

                            } else if ( definesGroup[ 1 ].trim()[ 0 ] === '!' ) {

                                // !defined(dfsdf)
                                if ( operator === '&&' )
                                    result = result && inputsDefines.indexOf( definesGroup[ 2 ] ) === -1;
                                else
                                    result = result || inputsDefines.indexOf( definesGroup[ 2 ] ) === -1;

                            } else {
                                // defined(dfsdf)
                                if ( operator === '&&' )
                                    result = result && inputsDefines.indexOf( definesGroup[ 2 ] ) !== -1;
                                else
                                    result = result || inputsDefines.indexOf( definesGroup[ 2 ] ) !== -1;
                            }
                        }
                    }

                    if ( result ) {
                        droppingDefineStack[ droppingDefineStackIndex ] = false;
                        didIncludeDefineStack[ droppingDefineStackIndex ] = true;
                        parentDroppingStack[ droppingDefineStackIndex ] = parentDroppingStack[ droppingDefineStackIndex - 1 ];
                    }

                    continue;
                }


                if ( line.substr( 1, 2 ) === 'if' ) {

                    // #if defined (_FLOATTEX) && defined(_PCF)
                    // #if defined(_NONE) ||  defined(_PCF)
                    result = true;
                    operator = '&&';
                    while ( ( definesGroup = definedReg.exec( line ) ) !== null ) {

                        if ( definesGroup.length > 2 ) {

                            if ( definesGroup[ 1 ] === undefined ) {
                                // yeah. twiceis ok.
                                // third's the charm
                                operator = definesGroup[ 0 ].trim();

                            } else if ( definesGroup[ 1 ].trim()[ 0 ] === '!' ) {

                                // !defined(dfsdf)
                                if ( operator === '&&' )
                                    result = result && inputsDefines.indexOf( definesGroup[ 2 ] ) === -1;
                                else
                                    result = result || inputsDefines.indexOf( definesGroup[ 2 ] ) === -1;

                            } else {

                                // defined(dfsdf)
                                if ( operator === '&&' )
                                    result = result && inputsDefines.indexOf( definesGroup[ 2 ] ) !== -1;
                                else
                                    result = result || inputsDefines.indexOf( definesGroup[ 2 ] ) !== -1;

                            }

                        }
                    }

                    droppingDefineStackIndex++;
                    droppingDefineStack.push( !result );
                    didIncludeDefineStack.push( result );
                    if ( !result ) {
                        parentDroppingStack.push( true );
                    } else {
                        parentDroppingStack.push( parentDroppingStack[ droppingDefineStackIndex - 1 ] );
                    }
                    continue;

                }

            } // #
        } //prunedef

        if ( !droppingDefineStack[ droppingDefineStackIndex ] && !parentDroppingStack[ droppingDefineStackIndex ] ) {

            //we  "keep comment" means we keep syntax format
            var toAdd = ( pruneComment ) ? line : lines[ i ];

            if ( definesReplaceKeys ) {
                for ( var defIdx = 0, lDefIdx = definesReplaceKeys.length; defIdx < lDefIdx; defIdx++ ) {

                    var key = definesReplaceKeys[ defIdx ];
                    //if ( toAdd.indexOf( key ) !== -1 ) {
                    toAdd = toAdd.replace( key, definesReplaceMap[ key ] );
                    //}

                }
            }

            strippedContent += toAdd;
            if ( addNewLines ) strippedContent += '\n';

        }
    }


    return strippedContent;

};

module.exports = preProcessor;
