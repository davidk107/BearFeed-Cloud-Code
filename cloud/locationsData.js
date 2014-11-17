var DiningLocation = Parse.Object.extend("DiningLocation");

// Updates diningLocations data for each of the respective locations
exports.updateLocationsData = function(menuObject)
{
	var promise = new Parse.Promise();

	// List of locations
	var locations = ["crossroads", "cafe3", "clarkKerr", "foothill"];
	var updateLocationPromises = [];

	// Update each location
	for (var i = 0 ; i < locations.length; ++i)
	{
		var location = locations[i];
		updateLocationPromises.push(updateLocation(menuObject[location]));
	}

	// Resolve when updates are done
	Parse.Promise.when(updateLocationPromises).then(function()
	{
		promise.resolve();
	},
	// Error handler
	function(error)
	{
		promise.reject();
	});

	return promise;
}

// Updates the location that corresponds to locationData
function updateLocation(locationData)
{
	// Create promise
	var promise = new Parse.Promise();

	// Get menu data 
	var menuData = convertLocationDataToMenuData(locationData);

	// Get the parse location object
	var locationQuery = new Parse.Query(DiningLocation);
	locationQuery.equalTo("locationName", locationData.location);
	locationQuery.first().then(function(locationObject)
	{
		// If location object does not exist, then create new one
		if (locationObject == null)
		{
			locationObject = new DiningLocation();
			locationObject.set("locationName", locationData.location);
		}

		// Update menuObject
		locationObject.set("menuData", menuData);

		// Save
		return locationObject.save();

	}).then(function()
	{
		// console.log(locationData.location + " has been updated!");
		promise.resolve();
	},
	// Error handler
	function(error)
	{
		console.log("ERROR w/ updateLocation: " + error.message);
		promise.reject("ERROR w/ updateLocation");
	});

	return promise;
}

// Converts a JS object for a location into just a JS object with menu details
function convertLocationDataToMenuData(locationData)
{	
	// Breakfast
	var breakfastArray = getArrayOfMenuItems(locationData, "breakfast");

	// Lunch
	var lunchArray = getArrayOfMenuItems(locationData, "lunch");

	// Dinner
	var dinnerArray = getArrayOfMenuItems(locationData, "dinner");	

	return {
		"breakfast" : breakfastArray,
		"lunch" : lunchArray,
		"dinner" : dinnerArray
	}
	
}

// Create array of items for given menu type(breakfast, lunch, dinner)
function getArrayOfMenuItems(locationData, menuType)
{
	var result = []
	var sourceArray = locationData[menuType];
	for (var i = 0; i < sourceArray.length; ++i)
	{
		// Get the item
		var item = sourceArray[i];

		// Create JS object from it with just item name and health type
		var itemObject = {
			name : item.name,
			healthType : item.healthType
		}

		result.push(itemObject);
	}
	return result;
}
