var fs = require('fs');
var keys = require('./keys.js');
var Twitter = require('twitter');
var request = require('request');
var Spotify = require('node-spotify-api');
var tweetHistory = "";
var trackName = "";
var trackInfo = "";
var movieInfo = "";

var spotify = new Spotify({
    id: keys.spotifyKeys.client_id,
    secret: keys.spotifyKeys.client_secret
});

var client = new Twitter({
    consumer_key: keys.twitterKeys.consumer_key,
    consumer_secret: keys.twitterKeys.consumer_secret,
    access_token_key: keys.twitterKeys.access_token_key,
    access_token_secret: keys.twitterKeys.access_token_secret
});

var params = {
    screen_name: 'costfx314'
};

function append(output) {
    fs.appendFile('log.txt', process.argv[2] + ":\n" + output + "\n", function(err) {
        if (err) {
            return console.log(err);
        }
    });
}

function spotifySearch(trackName) {
    spotify.search({
        type: 'track',
        query: trackName
    }, function(err, data) {
        if (err) {
            return console.log('Error occurred: ' + err);
        }
        spotifyOutput(data);
    });
}

function spotifyOutput(data) {
    console.log(data.tracks.items[0].name);
    console.log(data.tracks.items[0].artists[0].name);
    console.log(data.tracks.items[0].preview_url);
    console.log(data.tracks.items[0].album.name);
    trackInfo =
        data.tracks.items[0].name + "\n" +
        data.tracks.items[0].artists[0].name + "\n" +
        data.tracks.items[0].preview_url + "\n" +
        data.tracks.items[0].album.name + "\n";
    append(trackInfo);
}

function movieSearch(movieTitle) {
    var queryUrl = "http://www.omdbapi.com/?t=" + movieTitle + "&y=&plot=short&apikey=40e9cece";

    request(
        queryUrl,
        function(error, response, body) {
            if (!error && response.statusCode === 200) {
                var obj = JSON.parse(body);
                var movieObj = {
                    "Title": obj.Title,
                    "Year": obj.Year,
                    "IMDB Rating": obj.imdbRating,
                    "Rotten Tomatoes": obj.Ratings[1].Value,
                    "Country": obj.Country,
                    "Language": obj.Language,
                    "Plot": obj.Plot,
                    "Actors": obj.Actors
                }

                for (k in movieObj) {
                    console.log(k + ":", movieObj[k]);
                    movieInfo += k + ": " + movieObj[k] + "\n";
                }
                append(movieInfo);
            } else {
                console.log('error: ', error);
            }
        });
}

function twitterSearch() {
    client.get('statuses/user_timeline', params, function(error, tweets, response) {
        if (!error) {
            for (var i = 0; i < 20; i++) {
                console.log(tweets[i].created_at + " " + tweets[i].text)
                tweetHistory += tweets[i].created_at + " " + tweets[i].text + "\n";
            }
            append(tweetHistory);
        }
    });
}

// concatenate search parameters into a single string
function argvParse() {
    var searchValue = "";
    for (var i = 3; i < process.argv.length; i++) {
        searchValue += process.argv[i] + " ";
    }	// can also use slice() here
    return searchValue;
}

// Twitter functionality
if (process.argv[2] === 'my-tweets') {
    twitterSearch();
}

// Spotify functionality
if (process.argv[2] === 'spotify-this-song') {
    if (process.argv[3] === undefined) {
        spotifySearch("the sign ace of base");
    } else {
        trackName = argvParse();
        spotifySearch(trackName);
    }
}

// OMDB Functionality
if (process.argv[2] === 'movie-time') {
    var movieName = argvParse();
    movieSearch(movieName);
}

// do-what-it-says
if (process.argv[2] === 'do-what-it-says') {
    fs.readFile('random.txt', 'utf8', function(err, data) {
        if (err) {
            return console.log('ERROR!', err);
        }

        switch (data.split(',')[0]) {
            case 'my-tweets':
                twitterSearch();
                break;

            case 'spotify-this-song':
                spotifySearch(data.split(',')[1]);
                break;

            case 'movie-time':
                console.log('movies');
                break;
        }
    });    
}