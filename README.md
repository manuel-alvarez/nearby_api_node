# nearby_api_node
#Find nearby cities API#

This is an experimental server writen in NodeJS and using express that loads a JSON file with a bunch of cities and serves data in an API service.

Methods allowed are:

/cities/
 - GET: Shows a list of available cities
 - POST: Adds a new city to the cities list

/cities/:id
 - GET: Shows data stored for a given city
 - PUT: Updates city data
 - DELETE: Removes a city from the cities list

/cities/near/:coords
 - GET: Shows a list of cities within a radius of 500Km from the given point

/cities/nearby/:id
 - GET: Shows a list of cities within a radius of 500Km from the given city