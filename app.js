var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var app = express();

// This seems to be needed to parse the body in JSON format in post routes
app.use(bodyParser.json());

var cities = {};  // cities is going to be a JS object
var earth_radius = 6371;  // Kilometers


var distance = function(start, end) {
	// Method to calculate the distance between two points. Both points should have attributes lat and lon
	// convert degrees to radians
	start_lat = start.lat * Math.PI / 180
    start_lon = start.lon * Math.PI / 180
    end_lat = end.lat * Math.PI / 180
    end_lon = end.lon * Math.PI / 180

    delta_lon = Math.abs(start_lon - end_lon);

    // Calculate angle in the inner center of the sphere (earth). This does not have in mind the different angles depending on latitude, but it will be ok for this project.
    central_angle = Math.acos((Math.sin(start_lat) * Math.sin(end_lat)) + (Math.cos(start_lat) * Math.cos(end_lat) * Math.cos(delta_lon)));
    dist = earth_radius * central_angle;
    
    return dist;
};

var cities_near = function(point, max_distance=500) {
	// Method that iterates over cities array and looks for any city that is nearer than max_distance. 
	// Default value for max_distance is 500Km.
	var nearby_cities = {};

	console.log('Calculating distances from :');
	console.log(point);
	
	// Iterate over the list (hash) of cities to find the nearest ones
	for (var key in cities) {
		var city = cities[key];
		var dist = distance(city, point);
		if (dist <= max_distance) {  // Don't exclude the city itself when applies. Just to check that distance is 0.
			city['dist'] = dist;
			nearby_cities[key] = city;
		}
	};
	return nearby_cities;
};

// Root API route

app.get('/', function(req, res) {
	res.json({
		status: 'ok',
		text: 'This is an API to find nearby cities'
	});
});

// cities collection API
// The more 'complicated' the first

app.get('/cities/nearby/:id', function(req, res) {
	// This is basically the same method that the next one, but starting from a city, which simplifies the process. 
	var city = cities[req.params.id];
	if (city != null) {
		res.json({
			status: 'ok',
			city: [city],
			results: cities_near(city)
		});
	} else {
		res.json({
			status: 'error',
			text: 'City not found'
		})
	}
});

app.get('/cities/near/:coords', function(req, res) {
	// Method that looks for the cities within a max distance of 500Km of a given point. This point should be composed by two numbers, separated by a comma.
	var coords = req.params.coords.split(',');
	if (coords.length == 2) {
		// Remember, latitude first
		point = {
			lat: coords[0],
			lon: coords[1]
		}
		res.json({
			status: 'ok',
			results: cities_near(point)
		});
	} else {
		res.json({
			status: 'error',
			text: 'Coordinates not valid'
		})
	}
})

app.get('/cities/:id', function(req, res) {
	// Looks for a given city (key). If does not exist, it will return an error
	var city = cities[req.params.id];

	if (city != null) {
		res.json({
			status: 'ok',
			results: [city]
		});
	} else {
		res.json({
			status: 'error',
			text: 'City not found'
		})
	}
})

app.get('/cities', function(req, res) {
	// Shows a list of all cities available in the API
	res.json({
		status: 'ok',
		results: cities
	});
});

app.post('/cities', function(req, res) {
	// Adds a city to the list of available cities
	// WARNING: Note that this city will not remain once the server is restarted
	var city = req.body;
	console.log('New city:');
	console.log(city);
	name = city.city;
	if (name == null) {
		res.json({
			status: 'error',
			text: 'Bad formatted city. You need to provide a "city" attribute with the city name.'
		})
		return;
	}
	if (city.lat == null || city.lon == null) {
		res.json({
			status: 'error',
			text: 'Bad formatted city. You need to provide "lat" and "lon" attributes with city coordinates.'
		});
		return;
	}
	key = name.toLowerCase();
	current_city = cities[key];
	if (current_city != null) {
		res.json({
			status: 'error',
			text: 'City with that key already exists, please change its name'
		})
		return
	};
	cities[key] = city;
	res.json({
		status: 'ok',
		city: city
	});
});

app.put('/cities/:id', function(req, res) {
	// Updates a city with new data provided in POST body
	// WARNING: Remember that changes are not permanent and original data will be restores once the server is restarted
	var cityToUpdate = cities[req.params.id];
	var city = req.body;

	if (cityToUpdate != null) {
		cityToUpdate = city;
		cities[req.params.id] = cityToUpdate;

		res.json({
			status: 'ok',
			city: cityToUpdate
		});
	} else {
		res.json({
			status: 'error',
			text: 'City not found'
		})
	}
});

app.delete('/cities/:id', function(req, res) {
	// Removes a city from the cities list. 
	// WARNING: Remember that this method will not cause permanent changes and original list will be restored upon restart
	var city = cities[req.params.id];

	if (city != null) {
		delete cities[req.params.id];

		res.json({
			status: 'ok',
			city: city
		});
	} else {
		res.json({
			status: 'error',
			text: 'City not found'
		})
	}
});

// start app
// First, load JSON from github gist. On callback, start server (only if cities are loaded, there won't be much data to use in any other case)
request.get({
	url: 'https://gist.githubusercontent.com/manuel-alvarez/20a7e013765a4361de9c3ae621a7efe2/raw/0ee93d11990f1291fd14ac2773935d7c0269f941/cities-of-the-world',
	json: true
}, function (error, res, body) {
	if (!error && res.statusCode == 200) {
		cities = body;
		console.log('Cities loaded, starting server');
		app.listen('3000', function() {
			// Show the user that the server is ready, just in case the connection is slow
			console.log("Server ready at http://localhost:3000")
		});
	} else {
		console.log('Unable to read cities, please check your internet connection.');
	}
})

