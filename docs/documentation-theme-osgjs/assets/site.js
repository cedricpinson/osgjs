/* global anchors */

// add anchor links to headers
anchors.options.placement = 'left';
anchors.add().remove('.no-anchor');

// Filter UI
var tocElements = document.getElementById('toc').getElementsByTagName('a');
document.getElementById('filter-input').addEventListener('keyup', function(e) {

  var i, element;

  // enter key
  if (e.keyCode === 13) {
    // go to the first displayed item in the toc
    for (i = 0; i < tocElements.length; i++) {
      element = tocElements[i];
      if (!element.classList.contains('hide')) {
        location.replace(element.href);
        return e.preventDefault();
      }
    }
  }

  var match = function() { return true; },
    value = this.value.toLowerCase();

  if (!value.match(/^\s*$/)) {
    match = function(text) { return text.toLowerCase().indexOf(value) !== -1; };
  }

  for (i = 0; i < tocElements.length; i++) {
    element = tocElements[i];
    if (match(element.innerHTML)) {
      element.classList.remove('hide');
    } else {
      element.classList.add('hide');
    }
    element.addEventListener( 'scroll', function ( e ) {
      console.log( e );
    } );
  }
});

var removeBackgroundInList = function ( elements ) {
  for ( var i = 0; i < elements.length; i++ ) {
    var a = document.querySelector('.' + elements[i].id );
    if ( a )
      a.classList.remove( 'bg-list' );
  }
};

// document.querySelectorAll( '.pdef' )[ 0 ].style.height = window.innerHeight - document.querySelector( '#nav').clientHeight + "px";
// document.querySelectorAll( '.pdef' )[ 1 ].style.height = window.innerHeight - document.querySelector( '#nav').clientHeight + "px";

var collapsibles = document.querySelectorAll( '.collapsible .header' );
for ( var i = 0; i < collapsibles.length; i++ ) {
  collapsibles[ i ].addEventListener( 'click', function ( ev ) {
    var block = this.parentElement.querySelector('.collapser');
    var close = this.parentElement.querySelector( '.close' );
    var open = this.parentElement.querySelector( '.open' );
    if ( block.style.display === 'block' ) {
      block.style.display = 'none';
      close.style.display = 'none';
      open.style.display = 'inline-block';
    } else {
      block.style.display = 'block';
      open.style.display = 'none';
      close.style.display = 'inline-block';
    }
  } );
}

window.addEventListener( 'scroll' , function( e ) {
  var elements = document.querySelectorAll( '.class' );
  for ( var i = 0; i < elements.length; i++ ) {
    if ( elements[ i ].offsetTop > window.scrollY ) {
      removeBackgroundInList( elements );
      var selector = '.' + elements[ i ].id.split( '.' )[ 0 ];
      var a = document.querySelector( selector );
      if ( a )
        a.classList.add( 'bg-list' ); 
      break;
    }
  }
} );
