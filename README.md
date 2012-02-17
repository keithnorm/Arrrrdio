# What's This?
It's the app I used to talk about how Backbone apps are written at the inaugural meeting of [BayQuery](http://www.meetup.com/bayQuery/)!

## Start 'er up
Install node first if you don't have it, then: 

* clone the project
* node app.js
* localhost:3080

If you have an Rdio account, you can hit localhost:3080/oauth/login and auth the app via your Rdio account. Otherwise it will only play 30 second clips of songs but everything should work still.

## What's node have to do with it?
the node app just acts as a proxy to the Rdio API, which only accepts POST requests, so because of the limitations of cross-domain XHR, couldn't be achieved with just client side JS.

So, Backbone calls the node backend which calls the Rdio API then returns that to Backbone on the client.
