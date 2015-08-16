var DiningLocation = Parse.Object.extend("DiningLocation");

//  =========================================== PUBLIC FUNCTIONS =========================================== //

// Updates diningLocations data for each of the respective locations
exports.updateLocationsData = function(parsedData) {
	var promise = new Parse.Promise();

	// List of locations
	var locationKeys = ["crossroads", "cafe3", "clarkKerr", "foothill"];
	var locationNames = ["Crossroads", "Cafe 3", "Clark Kerr", "Foothill"];
	var updateLocationPromises = [];

	// Update each location
	for (var i = 0 ; i < locationKeys.length; ++i) {
		var locationKey = locationKeys[i];
		var locationName = locationNames[i];
		updateLocationPromises.push(updateLocation(parsedData[locationKey], locationName));
	}

	// Resolve when updates are done
	Parse.Promise.when(updateLocationPromises).then(function() {
		promise.resolve();
		
	}, function(error) {
		promise.reject();
	});

	return promise;
}

//  =========================================== HELPER FUNCTIONS =========================================== //

// Updates the location that corresponds to locationData
function updateLocation(locationMenuData, locationName) {
	// Create promise
	var promise = new Parse.Promise();

	// Get the parse location object
	var locationQuery = new Parse.Query(DiningLocation);
	locationQuery.equalTo("locationName", locationName);
	locationQuery.first().then(function(locationObject) {
		
		// If location object does not exist, then create new one
		if (locationObject == null) {
			locationObject = new DiningLocation();
			locationObject.set("locationName", locationName);
		}

		// Update menuObject
		locationObject.set("menuData", stripLocationMenuData(locationMenuData));

		// Save
		return locationObject.save();

	}).then(function() {
		promise.resolve();

	}, function(error) {
		console.warn("ERROR w/ updateLocation: " + error.message);
		promise.reject();
	});

	return promise;
}

// Strips down the parsed location menu data into just name and healthType
function stripLocationMenuData(locationMenuData) {
	var result = {};

	// Convert
	result.breakfast = stripItemArray(locationMenuData.breakfast);
	result.lunch = stripItemArray(locationMenuData.lunch);
	result.dinner = stripItemArray(locationMenuData.dinner);

	return result;
}

function stripItemArray(fullItemArray) {
	var strippedItems = [];
	for (var i = 0; i < fullItemArray.length; ++i) {
		var fullItem = fullItemArray[i];
		var strippedItem = {
			name: fullItem.name,
			healthType: fullItem.healthType
		};
		strippedItems.push(strippedItem);
	}
	return strippedItems;
}