//  token: rx2nazb78x6eerun62wnzwjp
//  secret: AxJKpzMyAshH
//  access_token: rkwa3zkamu9h9mfep7uk6mem87mmd2bxzjxhr9xdskh9p7hchm8ad8feddhmch9j
//  access_secret: PPjCSNFSkKru
var express = require('express')
	, OAuth = require('oauth').OAuth
  , url = require('url')
  , _ = require('underscore')
	, querystring = require('querystring')
  , fileify = require('fileify');

var token = 'rkwa3zkamu9h9mfep7uk6mem87mmd2bxzjxhr9xdskh9p7hchm8ad8feddhmch9j';
var secret = 'PPjCSNFSkKru';
	
var app = express.createServer();

app.set('views', __dirname + '/app/views');
app.set('view engine', 'jade');

//oauth setup
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({
	secret: "98yKGKgkdrg94tnkfdh"
}));

app.dynamicHelpers({
	base: function(){
		return '/' == app.route ? '' : app.route;
	},
	session: function(req, res){
		return req.session;
	},

  loggedIn: function(req, res) {
    return req.session.oauth_access_token;
  }
});

// Middleware
app.configure(function(){
	app.use(express.logger('\x1b[33m:method\x1b[0m \x1b[32m:url\x1b[0m :response-time'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express['static'](__dirname + '/public'));
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

//setup rdio
var rdio = require('rdio')({
  rdio_api_key: 'mpmzsmhezn5xutcp8mruuws4', 
  rdio_api_shared: '8h6jJmmNQV',
  callback_url: 'http://arrrrdio.herokuapp.com/oauth/callback'
});

// Routes
//require('./routes/site')(app, rdio);

app.get('/', function(req, res){
  
  rdio.api(
    req.session.oauth_access_token,
    req.session.oauth_access_token_secret,
    {
      method: 'getTopCharts',
      type: 'Track',
      count: 10
    }, function(err, data, response) {
      //if(err) throw new Error(err);
      
      rdio.getPlaybackToken(
        req.session.oauth_access_token,
        req.session.oauth_access_token_secret,
        'http://arrrrdio.herokuapp.com/',
        function(err, data, response) {
          //if(err) throw new Error(err);
          console.log("IN HERE", data);
          res.render('layout', {
            body: 'hi',
            layout: false,
            playbackToken: JSON.parse(data).result
          });
        }
      );
    }
  );
});

app.get('/top_charts', function(req, res) {
  rdio.api(
    req.session.oauth_access_token,
    req.session.oauth_access_token_secret,
    {
      method: 'getTopCharts',
      type: 'Track',
      count: 10
    },
    function(err, data, response) {
      if(err) throw new Error(err);
      res.send(JSON.parse(data).result);
    }
  );
});

app.get ('/oauth/login', function(req, res, params) {
  if(!req.session.oauth_access_token) {
    rdio.getRequestToken(function(error, oauth_token, oauth_token_secret, results){
      if(error) {
        throw new Error(error);
      } else { 
        // store the tokens in the session
        req.session.oauth_token = oauth_token;
        req.session.oauth_token_secret = oauth_token_secret;

        // redirect the user to authorize the token
        res.redirect('https://www.rdio.com/oauth/authorize?oauth_token='+oauth_token);
      }
    });
  } else {
    res.redirect("/");
  }
});

app.get('/user', function(req, res) {
  res.send(req.session.user);
});

app.get ('/oauth/callback', function(req, res, params) {
  var parsedUrl = url.parse(req.url, true);
  rdio.getAccessToken(parsedUrl.query.oauth_token, req.session.oauth_token_secret, parsedUrl.query.oauth_verifier, 
    function(error, oauth_access_token, oauth_access_token_secret, results) {
      req.session.oauth_access_token = oauth_access_token;
      req.session.oauth_access_token_secret = oauth_access_token_secret;

      rdio.api(
        req.session.oauth_access_token,
        req.session.oauth_access_token_secret,
        {
          method: 'currentUser'
        }, 
        function(err, data, response) {
          req.session.user = JSON.parse(data).result;
          res.redirect("/");
        }
      );
    }
  );
});

app.get('/search/:query', function(req, res) {
  rdio.api(
    req.session.oauth_access_token,
    req.session.oauth_access_token_secret,
    {
      method: 'search',
      query: req.params.query,
      types: 'Artist, Albums, Songs',
      count: 30
    }, 
    function(err, data, response) {
      res.send(JSON.parse(data).result);
    }
  );
});

app.get('/artists/:id', function(req, res) {
  rdio.api(
    req.session.oauth_access_token,
    req.session.oauth_access_token_secret,
    {
      method: 'getAlbumsForArtist',
      artist: req.params.id
    }, 
    function(err, data, response) {
      res.send(JSON.parse(data).result);
    }
  );
});

app.get('/artists/:id/albums', function(req, res) {
  rdio.api(
    req.session.oauth_access_token,
    req.session.oauth_access_token_secret,
    {
      method: 'getAlbumsForArtist',
      artist: req.params.id
    }, 
    function(err, data, response) {
      res.send(JSON.parse(data).result);
    }
  );
});

app.get('/albums/:id/tracks', function(req, res) {
  rdio.api(
    req.session.oauth_access_token,
    req.session.oauth_access_token_secret,
    {
      method: 'albumInfoPopup',
      album: req.params.id
    }, 
    function(err, data, response) {
      res.send(JSON.parse(data).result.album.tracks);
    }
  );
});

app.get('/albums/:id', function(req, res) {
  rdio.api(
    req.session.oauth_access_token,
    req.session.oauth_access_token_secret,
    {
      method: 'albumInfoPopup',
      album: req.params.id
    }, 
    function(err, data, response) {
      res.send(JSON.parse(data).result.album);
    }
  );
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

var browserify = require('browserify');
var bundle = browserify();
app.use(bundle);

var fileify = require('fileify');
bundle.use(fileify('templates', __dirname + '/app/views'));



