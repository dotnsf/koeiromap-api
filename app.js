//. app.js
var express = require( 'express' ),
    axios = require( 'axios' ),
    bodyParser = require( 'body-parser' ),
    formData = require( 'express-form-data' ),
    app = express();

require( 'dotenv' ).config();

app.use( express.static( __dirname + '/public' ) );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( formData.parse( { autoClean: true } ) );
app.use( formData.format() );
app.use( express.Router() );

var settings_cors = 'CORS' in process.env ? process.env.CORS : '';  //. "http://localhost:8080,https://xxx.herokuapp.com"
app.all( '/*', function( req, res, next ){
  if( settings_cors ){
    var origin = req.headers.origin;
    if( origin ){
      var cors = settings_cors.split( " " ).join( "" ).split( "," );

      //. cors = [ "*" ] への対応が必要
      if( cors.indexOf( '*' ) > -1 ){
        res.setHeader( 'Access-Control-Allow-Origin', '*' );
        res.setHeader( 'Access-Control-Allow-Methods', '*' );
        res.setHeader( 'Access-Control-Allow-Headers', '*' );
        res.setHeader( 'Vary', 'Origin' );
      }else{
        if( cors.indexOf( origin ) > -1 ){
          res.setHeader( 'Access-Control-Allow-Origin', origin );
          res.setHeader( 'Access-Control-Allow-Methods', '*' );
          res.setHeader( 'Access-Control-Allow-Headers', '*' );
          res.setHeader( 'Vary', 'Origin' );
        }
      }
    }
  }
  next();
});

app.get( '/ping', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  res.write( JSON.stringify( { status: true, message: 'PONG' }, null, 2 ) );
  res.end();
});

var settings_apikey = 'API_KEY' in process.env ? process.env.API_KEY : '';

app.post( '/api/infer', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );
  var text = ( req.body.text ? req.body.text : '' );
  if( text ){
    if( settings_apikey ){
      var data = req.body;
      if( data && data.speaker_x && typeof data.speaker_x == 'string' ){ data.speaker_x = parseFloat( data.speaker_x ); }
      if( data && data.speaker_y && typeof data.speaker_y == 'string' ){ data.speaker_y = parseFloat( data.speaker_y ); }
      if( data && data.seed && typeof data.seed == 'string' ){ data.seed = parseInt( data.seed ); }
      if( data && data.speed && typeof data.speed == 'string' ){ data.speed = parseFloat( data.speed ); }
      if( data && data.volume && typeof data.volume == 'string' ){ data.volume = parseFloat( data.volume ); }
      var config = {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Ocp-Apim-Subscription-Key': settings_apikey
        }
      };
      var r = await axios.post( 'https://api.rinna.co.jp/koeiromap/v1.0/infer', data, config );
      //console.log( {r} );
      if( r && r.data ){
        res.write( JSON.stringify( { status: true, result: r.data }, null, 2 ) );
        res.end();
      }else{
        res.status( r.status );
        res.write( JSON.stringify( { status: false, error: r.error }, null, 2 ) );
        res.end();
      }
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: 'no api key provided.' }, null, 2 ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'no text provided.' }, null, 2 ) );
    res.end();
  }
});


var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );

module.exports = app;
