var Templates = require('templates');

App = {
  Models: {},
  Views: {},
  Types: {
    albums: 'a',
    artists: 'r',
    tracks: 't'
  },

  loggedIn: function() {
    return typeof currentUser != 'undefined';
  }
};

Handlebars.registerHelper('get', function(attr) {
  return this.get(attr);
});

Handlebars.registerHelper('json', function(obj) {
  if(_(obj).isFunction())
    var json = obj.call(this);
  else
    var json = obj;
  return JSON.stringify(json);
});

App.Router = Backbone.Router.extend({
  routes: {
    '': 'root',
    'search/:query': 'search',
    'profile': 'profile',
    'albums/:id': 'album',
    'users/:id/friends': 'friends'
  },

  root: function() {
    if(App.loggedIn())
      this._renderUserHeavyRotation();
    else {
      var topCharts = new App.TopCharts();
      topCharts.fetch({
        success: function(resp) {
          new App.Views.TopCharts({
            tracks: resp
          });
        }
      });
    }
  },

  search: function(query) {
    var results = new App.SearchResults([], { query: query });
    results.fetch({
      success: function(resp) {
        new App.Views.SearchResults({
          results: resp
        });
      }
    });
  },

  album: function(id) {
    var album = new App.Album({id: id});
    album.fetch({
      success: function(album, response) {
        new App.Views.Album({
          album: album
        });
      }
    });
  },

  profile: function() {
    new App.Views.Profile({
      user: App.currentUser
    });
  },

  friends: function() {
    var friends = new App.Friends([], {
      user: App.currentUser
    });
    friends.fetch({
      success: function(friends, resp) {
        new App.Views.Friends({
          friends: friends
        });
      }
    });
  },

  _renderUserHeavyRotation: function() {
    var albums =  new App.UsersHeavyRotation();
    albums.fetch({
      success: function(albums, resp) {
        new App.Views.Albums({
          albums: albums
        });
      }
    });
  }
});

App.Artist = Backbone.Model.extend({});
App.Track = Backbone.Model.extend({});
App.Album = Backbone.Model.extend({
  urlRoot: '/albums',

  initialize: function() {
    this.bind('change', this.onChange);
  },

  onChange: function() {
    this.tracks = this.get('tracks');
  }
});

App.User = Backbone.Model.extend({});

App.SearchResults = Backbone.Collection.extend({
  url: function() {
    return '/search/' + this.options.query;
  },

  parse: function(resp) {
    return resp.results;
  },

  initialize: function(models, options) {
    this.options = options;
    this.on('reset', this.onReset);
  },

  onReset: function() {
    var keys = _(App.Types).keys();
    var values = _(App.Types).values();
    this.each(function(model, i) {
      var category = keys[values.indexOf(model.get('type'))];
      this[category] || (this[category] = []); 
      this[category].push(model);
    }.bind(this));
  }
});

App.TopCharts = Backbone.Collection.extend({
  model: App.Track,
  url: '/top_charts'
});

App.Albums = Backbone.Collection.extend({ model: App.Album });
App.UsersHeavyRotation = App.Albums.extend({
  url: function() {
    return '/users/' + App.currentUser.get('key');
  }
});

App.Friends = Backbone.Collection.extend({
  model: App.User,

  url: function() {
    return '/users/' + this.user.get('key') + '/friends';
  },

  initialize: function(models, options) {
    this.user = options.user;
  }
});

App.Views.Application = Backbone.View.extend({
  el: 'body',
  userTemplate: Templates['user.html'],
  userTemplateEl: '#info',

  events: {
    'submit #search_form': 'onSearch',
    'click .play.btn': 'playTrack'
  },

  initialize: function() {
    App.player = new App.Views.Player();
    this.updateUserInfo();
    App.currentUser.bind('change', this.updateUserInfo.bind(this));
  },

  onSearch: function(e) {
    e.preventDefault();
    App.router.navigate('search/' + $(e.target).find('input').val(), true);
  },

  updateUserInfo: function(user) {
    var template = Handlebars.compile(this.userTemplate);
    $(this.userTemplateEl).html(
      template(App.currentUser)
    );
    if(user)
      new App.Views.Notification({
        message: "Your info has been updated!"
      });
  },

  playTrack: function(e) {
    var track = $(e.target).data('track') || $(e.target).parents('a').data('track');
    App.player.play(track);
  }
});

App.Views.Albums = Backbone.View.extend({
  el: '#body',
  template: Templates['albums.html'],
  title: 'You Seem to Like These',
    
  initialize: function() {
    this.albums = this.options.albums.models;
    this.render();
  },

  render: function() {
    var template = Handlebars.compile(this.template);
    this.$el.html(
      template(this)
    );
  }
});

App.Views.SearchResults = Backbone.View.extend({
  el: '#body',
  template: Templates['search.html'],

  initialize: function() {
    this.results = this.options.results;
    this.render();
  },

  render: function() {
    var template = Handlebars.compile(this.template);
    this.$el.html(
      template(this)
    );
  }
});

App.Views.TopCharts = Backbone.View.extend({
  el: '#body',
  template: Templates['top_charts.html'],
  
  initialize: function() {
    this.tracks = this.options.tracks.models;
    this.render();
  },

  render: function() {
    var template = Handlebars.compile(this.template);
    this.$el.html(
      template(this)
    );
  }
});

App.Views.Album = Backbone.View.extend({
  el: '#body',
  template: Templates['album.html'],

  initialize: function() {
    this.album = this.options.album;
    this.render();
  },

  render: function() {
    var template = Handlebars.compile(this.template);
    this.$el.html(
      template(this)
    );
  }
});

App.Views.Friends = Backbone.View.extend({
  el: '#body',
  template: Templates['friends.html'],
  initialize: function() {
    this.friends = this.options.friends.models;
    this.render();
  },

  render: function() {
    var template = Handlebars.compile(this.template);
    this.$el.html(
      template(this)
    );
  }
});

App.Views.Profile = Backbone.View.extend({
  el: '#body',
  template: Templates['profile.html'],

  events: {
    'submit form': 'onSubmit'
  },

  initialize: function() {
    this.user = this.options.user;
    this.render();
  },

  render: function() {
    var template = Handlebars.compile(this.template);
    this.$el.html(
      template(this)
    );
  },

  onSubmit: function(e) {
    App.currentUser.set($(e.target).serialize(true));
    e.preventDefault();
  }
});

App.Views.Notification = Backbone.View.extend({
  id: 'alert',

  initialize: function() {
    this.render();
  },

  render: function() {
    this.$el.html(this.options.message).appendTo('body');
    _(this.remove).chain().bind(this).delay(5000);
  },

  remove: function() {
    this.$el.slideUp(function() {
      $(this).remove();
    });
  }
});

App.Queue = Backbone.Collection.extend({
  model: App.Track,
  position: 0,
  next: function() {
    if(this.length && this.length > this.position){
      this.position++;
      return this.at(this.position);
    }
    else 
      this.position = 0;
  },

  prev: function() {
    if(this.position > 0) {
      this.position--;
      return this.at(this.position);
    }
  }
});

App.Views.Player = Backbone.View.extend({
  swfUrl: 'http://www.rdio.com/api/swf/',
  el: '#player_container',
  template: Templates['player.html'],

  pauseBtnCode: '5',
  playBtnCode: '4',

  events: {
    'click #player_ui .stop': 'pause',
    'click #player_ui .play': 'play',
    'click .bar': 'onSeek'
  },

  initialize: function() {
    this.renderedSWF = false;
    this.track = new App.Track();
    this.isPlaying = false;
    this.justQueued = false;
    this.queue = new App.Queue([]);
    this.render();
    this.track.bind('change:name', this.render.bind(this));
    this.track.bind('change:position', this.changedPosition.bind(this));
    this.bind('paused', this.onPause);
    this.bind('playing', this.onPlay);
    this.bind('change:state', this.onStateChanged.bind(this));
  },

  play: function(track) {
    // if it's playing and play was called from an event...?
    if(this.isPlaying && (!track || !track.name)) {
      return this.pause();
    }
    if(track && track.key) {
      this.track.set(track);
      this.player.rdio_play(track.key);
      if(this.shouldQueue())
        this.addToQueue({source: track.albumKey, position: track.trackNum});
    }
    else //resume
      this.player.rdio_play();
    this.isPlaying = true;
    this.trigger('playing');
    return this;
  },

  shouldQueue: function() {
    //kinda dumb, just seeing if we are on the album page
    return (/albums\/a[\w]+/).test(window.location.hash);
  },

  onStateChanged: function(state) {
    switch(state) {
      case 1:
        this.justQueued = false;
        break;
      case 2: 
        this.next();
        break;
    }
  },

  prev: function() {
    if(App.player.isPlaying && !this.justQueued){
      this.justQueued = !this.justQueued;
      var prev = App.player.queue.prev();
      App.player.play(prev.toJSON());
    }
  },

  next: function() {
    if(App.player.isPlaying && !this.justQueued){
      this.justQueued = !this.justQueued;
      var next = App.player.queue.next();
      App.player.play(next.toJSON());
    }
  },

  seek: function(pos) {
    this.player.rdio_seek(pos);
  },

  onSeek: function(e) {
    var pos = (e.offsetX / $(e.target).width()) * this.track.get('duration');
    this.seek(pos);
  },

  addToQueue: function(options) {
    var album = new App.Album({
      id: options.source
    });
    album.fetch({
      success: function(album, resp) {
        this.queue.add(album.get('tracks'));
        this.queue.position = (options.position - 1) || 0;
      }.bind(this)
    });
  },

  stop: function() {
    console.log('stop');
    this.isPlaying = false;
    this.player.rdio_stop();
    return this;
  },

  pause: function() {
    this.isPlaying = false;
    this.player.rdio_pause();
    this.trigger('paused');
    return this;
  },

  render: function() {
    if(!this.renderedSWF) {
      swfobject.embedSWF(this.swfUrl, 'player', '1', '1', '9.0.0','', App.Views.Player.flashvars, App.Views.Player.params);
      this.renderedSWF = true;
    }
    var template = Handlebars.compile(this.template);
    this.$el.html(
      template(this) 
    );
    this.btn = this.$el.find('.play span');
  },

  onPause: function() {
    this.btn.html(this.playBtnCode);
  },

  onPlay: function() {
    this.$el.animate({bottom: 0});
    this.btn.html(this.pauseBtnCode);
  },

  changedPosition: function() {
    this.$el.find('.meter').width(
      (this.track.get('position') / this.track.get('duration')) * 100 + "%"
    );
    this.$el.find('.time').html(this.formattedPosition());
  },

  formattedPosition: function() {
    return this._formatToMinutesSeconds(this.track.get('position'));
  },

  formattedDuration: function() {
    return this._formatToMinutesSeconds(this.track.get('duration'));
  },

  _formatToMinutesSeconds: function(seconds) {
    if(!seconds)
      return '0:00';
    var minutes = parseInt(seconds / 60, 10);
    seconds = parseInt(seconds % 60, 10);
    return minutes + ':' + (seconds >= 10 ? seconds : '0' + seconds);
  },

	ready: function() {
    console.log('readyyyy');
		this.player = document.getElementById("player");
	},

	playStateChanged: function(state) {
    App.player.trigger('change:state', state);
    switch(state) {
      case 0:
        App.player.trigger('paused');
        break;
      case 1:
        App.player.trigger('playing');
        break;
      case 2: 
        break;
      case 3:
        console.log('buffering state');
        break;
      case 4:
        console.log('puased satte');
        break;
    }
	},

  playingSourceChanged: function(source) {
    console.log('source changed', source);
  },

  playingTrackChanged: function(track) {
    console.log('adding to queeu', track.albumKey);
    App.player.track.set(track);
    //App.player.player.rdio_queue(track.albumKey);
  },

  positionChanged: function(position) {
    App.player.track.set({position: position});
  }
}, 
{
  flashvars: {
    playbackToken: playbackToken,
    domain: encodeURIComponent(document.domain),
    listener: 'App.Views.Player.prototype'
  },

  params: {
    'allowScriptAccess': 'always'
  }
});

$(function() {
  App.currentUser = new App.User(window.currentUser || {});
  new App.Views.Application({});
  App.router = new App.Router();
  Backbone.history.start();
});

$.fn.serialize = (function(oldSerialize) {
  return function(toHash) {
    var params = {};
    if(toHash)
      return _($(this).serializeArray()).inject(function(acc, obj) {
        acc[obj.name] = obj.value;
        return acc;
      }, {});
    else
      return oldSerialize.apply(this, arguments);
  };
})($.fn.serialize);

var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-29309585-1']);
_gaq.push(['_trackPageview']);

$(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('body')[0]; s.appendChild(ga);
});


