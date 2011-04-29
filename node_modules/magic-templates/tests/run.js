/**
 * Call this script from the command line: 
 * $ node run.js
 */

var T    = require('../index')
  , sys  = require('sys')
  , path = require('path');
  
T.setTemplatesDir( __dirname );
T.setDebug( true );

sys.puts( "\nRunning some benchmarks:" );
sys.puts( "*******************************************************" );
var html =[
  "<h1>This is the homepage</h1><p>{{ greeting }}</p>",
  "<p></p>",
  "{% for i in l %}",
  "  {{i}}",
  "{% if four > five %}",
  "  <p>{{four}} is bigger than {{five}}</p>",
  "{% else if five > 6 %}",
  "  <p>{{five}} is bigger than 6</p>",
  "{% else %}",
  "  <p>The world is sane after all.</p>",
  "{% endif %}",
  "{% endfor %}"].join("\n");

sys.puts("\n", "Original html template: \n\n" + html, "");
sys.puts("Context: { greeting:'Hello World', four:4, five:5, l: [array with 100 elements] }", "");

sys.puts( "*******************************************************" );

var l = [];
for( var i=0; i<100; i++ ) l.push(".");

var d1 = new Date();
var t2 = new T.Template();
for( var i=0; i<10000; ++i )
  t2.parse(html);

sys.puts( "10K iterations on parsing the original string: " + (new Date() - d1) + " ms");

var d1 = new Date();
var t2 = new T.Template();
t2.parse(html);
for( var i=0; i<1000; ++i )
  t2.render({ greeting: "Hello World", four: 4, five: 5, l: l});

sys.puts( "1000 iterations on rendering the parsed template: " + (new Date() - d1) + " ms");

sys.puts( "\nParsing and loading from file:" );
sys.puts( "*******************************************************" );
sys.puts( "" );

var context = {
    file: "included.html"
  , extending: "base.html"
  , four: 4
  , five: 5
  , array: [1,2,3,4]
};

// Add a default variable for all context instances
T.Context.addToDefault({  greeting: "This text is a variable defined in the view." });

var template = new T.Template( path.join( "page.html" ) );
template.load( function( err, template ) {
  if( err ) 
    sys.puts( err );
  else
    template.render( context, function( err, output ) {
      if( err ) 
        sys.puts( err );
      else 
        sys.puts( output.join("").replace(/\n+/g,"\n") );
    });
});