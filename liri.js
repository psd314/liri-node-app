var fs = require('fs');
var keys = require('./keys.js');
var Twitter = require('twitter');
var request = require('request');
var Spotify = require('node-spotify-api');
// handle errors for spotify and movie-this, search term not found
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
            console.log(err + '\nThere was an error in your search.  Please try another term.');
            return err;
        }
        var trackObj = {
            "Track": data.tracks.items[0].name,
            "Artist": data.tracks.items[0].artists[0].name,
            "Preview Url": data.tracks.items[0].preview_url,
            "Album": data.tracks.items[0].album.name
        };
        printObject(trackObj);
    });
}

function movieSearch(movieTitle) {
    var queryUrl = "http://www.omdbapi.com/?t=" + movieTitle + "&y=&plot=short&apikey=40e9cece";
    request(
        queryUrl,
        function(error, response, body) {
            if (!error && response.statusCode === 200) {
                var obj = JSON.parse(body);

                if (obj.Title !== undefined) {
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
                } else {
                    console.log('Your search didn\'t produce any results. Please try another term.');
                }

                printObject(movieObj);

            } else {
                console.log('error: ', error);
            }
        });
}

// log results to console and append to log.txt
function printObject(object) {
    var outputString = "";
    for (k in object) {
        console.log(k + ":", object[k]);
        outputString += k + ": " + object[k] + "\n";
    }
    append(outputString);
}

function twitterSearch() {
    client.get('statuses/user_timeline', params, function(error, tweets, response) {
        if (!error) {
            var tweetHistory = "";
            for (var i = 0; i < 20; i++) {
                console.log(tweets[i].created_at + " " + tweets[i].text)
                tweetHistory += tweets[i].created_at + " " + tweets[i].text + "\n";
            }
            append(tweetHistory);
        }
    });
}
// search api's with provided term or search with default term if user left it blank
function searchTermCheck(searchParameter, defaultTerm, searchFunction) {
    if (searchParameter[3] === undefined) {
        searchFunction(defaultTerm);
    } else {
        searchFunction(searchParameter.slice(3).join(' '));
    }
}
// Execute code
if (process.argv[2] === 'my-tweets') {
    twitterSearch();

} else if (process.argv[2] === 'spotify-this-song') {
    searchTermCheck(process.argv, 'the sign ace of base', spotifySearch);

} else if (process.argv[2] === 'movie-this') {
    searchTermCheck(process.argv, 'Mr. Nobody', movieSearch);

} else if (process.argv[2] === 'do-what-it-says') {
    fs.readFile('random.txt', 'utf8', function(err, data) {

        if (err) {
            return console.log('ERROR!', err);
        }

        switch (data.split(',')[0]) {
            case 'my-tweets':
                twitterSearch();
                break;

            case 'spotify-this-song':
                spotifySearch(data.split(',')[1].trim());
                break;

            case 'movie-this':
                movieSearch(data.split(',')[1].trim());
                break;
        }
    });

} else {
    console.log("Invalid search.  Use one of the following terms to search Liri: my-tweets, movie-this, spotify-this-song, do-what-it-says")
}