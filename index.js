/* @flow */

// init required dependencies
var fs = require("fs")
var jade = require("jade")
var is = require("is_js")
var express = require("express")
var CronJob = require('cron').CronJob
var async = require("async")

var twitter = require('twitter')

module.exports = function(){
	// init express object, which we will return later
	var app = express()
	var render = jade.compileFile(__dirname + "/views/index.jade")
	var renderLoading = jade.compileFile(__dirname + "/views/loading.jade")

	app.locals.title = "Twitter"

	// init config object
	app.locals.config = {
		cKey: {
			label: 'Consumer key',
			value: null,
			setValue: function(v) {
				this.value = v
				app.generate()
			},
			type: 'text',
			isValid: function(value) {
				return null
			}
		},
		cSecret: {
			label: 'Consumer secret',
			value: null,
			setValue: function(v) {
				this.value = v
				app.generate()
			},
			type: 'text',
			isValid: function(value) {
				return null
			}
		},
		aToken: {
			label: 'Access token',
			value: null,
			setValue: function(v) {
				this.value = v
				app.generate()
			},
			type: 'text',
			isValid: function(value) {
				return null
			}
		},
		aSecret: {
			label: 'Access token secret',
			value: null,
			setValue: function(v) {
				this.value = v
				app.generate()
			},
			type: 'text',
			isValid: function(value) {
				return null
			}
		},
		screenName: {
			label: 'Screen name',
			value: null,
			setValue: function(v) {
				this.value = v
				app.generate()
			},
			type: 'text',
			isValid: function(value) {
				return null
			}
		},
		numberTweets: {
			label: 'Number of tweets',
			value: 5,
			setValue: function(v) {
				this.value = parseInt(v)
				app.generate()
			},
			type: 'text',
			isValid: function(value) {
				if (is.not.number(parseInt(value))) {
					return "value must be a number"
				} else {
					return null
				}
			}
		}
	}

	app.generate = function() {
		if (!is.string(app.locals.config.cKey.value)) {
			return
		}
		if (!is.string(app.locals.config.cSecret.value)) {
			return
		}
		if (!is.string(app.locals.config.aToken.value)) {
			return
		}
		if (!is.string(app.locals.config.aSecret.value)) {
			return
		}
		if (!is.string(app.locals.config.screenName.value)) {
			return
		}


		var client = new twitter({
			consumer_key: app.locals.config.cKey.value,
			consumer_secret: app.locals.config.cSecret.value,
			access_token_key: app.locals.config.aToken.value,
			access_token_secret: app.locals.config.aSecret.value
		});


		async.parallel(
			{
				user: function(callback) {
					client.get('users/show', {screen_name: app.locals.config.screenName.value}, function(err, data, response) {
						callback(err, data)
					});
				},
				tweets: function(callback) {
					client.get('statuses/user_timeline', {screen_name: app.locals.config.screenName.value, count: app.locals.config.numberTweets.value }, function(err, data, response) {
						callback(err, data)
					});
				},
			},
			function(err, results) {
				if (err != null) {
					console.log("err: " + err)
					app.locals.user = null
					app.locals.tweets = null
				} else {
					app.locals.user = results.user
					app.locals.tweets = results.tweets
				}
			}
		)

	}

	app.use("/public", express.static(__dirname + "/public", {
		maxAge: "7d"
	}))


	// Optional function configId, to return a string, which describes the plugin config
	app.locals.configId = function(){
		if (app.locals.config.screenName.value){
			return app.locals.config.screenName.value
		}
		return ""
	}


	app.html = function() {
		if (app.locals.user != null && app.locals.tweets != null){
			return render( app.locals )
		} else {
			return renderLoading( app.locals )
		}
	}

	app.less = function() {
		return fs.readFileSync(__dirname + "/stylesheets/style.less").toString()
	}



	new CronJob('0 31 * * * *',
		app.generate,
		null,
		true
	)



	return app
}
