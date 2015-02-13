// var menuObjectFile = require('cloud/Menu.js');
var privateData = require('cloud/privateData.js');

// Parse Item Class
var Item = Parse.Object.extend("Item");

//  =========================================== MENU DATA PUBLIC FUNCTIONS =========================================== //

// Fetches data from CalDining's Menu Website via YQL 
// Query selects for the 3 <tr> elements that make up the actual menu portion of the page source
// Then parses the data into an JS object
// JS Object has attributes breakfast, lunch, and dinner 
// that are linked to arrays of <td> html elements
// Parameters:
// 		Nothing
// Outputs:
// 		JS Object with attributes breakfast, lunch, and dinner
exports.fetchMenuDetails = function()
{
	// Create Parse Promise
	var promise = new Parse.Promise();

	// YQL URL
	var yqlURL = privateData.yqlURL;

	// We will attempt to perform 5 request attempts
	var requests = [];
	var numRequestAttempts = 5;
	for (var i = 0; i < numRequestAttempts; ++i)
	{
		requests.push(performYQLRequest(yqlURL));
	}

	Parse.Promise.when(requests).then(function()
	{
		// Loop through the arguments and find one that returns a valid result(not null)
		for (var i = 0; i < arguments.length; ++i)
		{
			var checkResult = arguments[i];
			if (checkResult != null)
			{
				// promise.resolve(checkResult);
				return Parse.Promise.as(checkResult);
			}
		}
		// Else no results found, throw error
		return Parse.Promise.error("All YQL requests were unsuccessful");
	
	}).then(function(result)
	{
		promise.resolve(result);
	},
	// Error handler
	function(error)
	{
		console.warn("ERROR w/ fetchMenuDetails");
		console.warn(error);
		promise.reject("All YQL requests were unsuccessful");
	});

	return promise;
}

// Given a list of current menu items, find any new items that are not in the database, and save those items
// Parameters:
// 		[FoodItems] - an array of JS Dicts representing each item (look to Menu.js for FoodItem implementation)
// Outputs:
// 		Nothing
exports.updateMenuDatabase = function(currentMenuItems)
{	
	var promise = new Parse.Promise();
	var newItems = [];

	// Fetch data from the query
	checkForNewItems(currentMenuItems).then(function(results)
	{
		newItems = results;

		// Save any new items
		var savePromises = [];
		for (var i = 0; i < newItems.length; ++i)
		{
			savePromises.push(saveNewParseItem(newItems[i]));
		}

		return Parse.Promise.when(savePromises);

	}).then(function()
	{
		promise.resolve("Menu database updated with " + newItems.length + " new items!");
	},
	function(error)
	{
		console.log("ERROR w/ updateMenuData: " + error);
		promise.reject("ERROR w/ updateMenuData");
	});

	return promise;
}

//  =========================================== HELPER FUNCTIONS =========================================== //

// This function will perform the actual httpRequest to retreive YQL results and performs null checks. 
// If query result is invalid in anyways, then it will return null
function performYQLRequest(yqlURL)
{
	var promise = new Parse.Promise();

	// Fetch data from the query
	Parse.Cloud.httpRequest(
	{
		url: yqlURL,

	}).then(function(response)
	{
		var websiteElements = JSON.parse(response.text);

		// Get array of <tr> elements
		try 
		{
			var trArray = websiteElements.query.results.results.tr;			
		}
		catch(error)
		{
			console.warn("ERROR w/ fetching trArray");
			return Parse.Promise.error("Invalid YQL result returned");
		}

		// Isolate the breakfast, lunch and dinner trs and store into result object
		var result = {};
		result.breakfast = trArray[0].td;
		result.lunch = trArray[1].td;
		result.dinner = trArray[2].td;

		return Parse.Promise.as(result);
	}).then(function(result)
	{
		// Return results
		promise.resolve(result);
	},
	// Error Handler
	function(error)
	{
		console.warn("ERROR w/ performYQLRequest: ");
		console.warn(error);
		promise.resolve(null);
	});

	return promise;
}

// Takes in the list of items from the current menu
// Fetch all the existing catalog items
// Compares and find if there are any new items that need to be saved
function checkForNewItems(currentMenuItems)
{
	// Create promise
	var promise = new Parse.Promise();

	// Get the items already added to the catalog
	var itemsQuery = new Parse.Query(Item);
	itemsQuery.ascending("name");
	itemsQuery.limit(1000);

	// Limit query to a list of only the names of current menu items 
	var listOfCurrentItemNames = currentMenuItems.map(function (item) { return item.name});
	itemsQuery.containedIn("name",listOfCurrentItemNames);

	// Execute the query
	itemsQuery.find().then(function(existingItems)
	{
		// Sort the list of current items for use in comparison function
		currentMenuItems.sort(compareItems);

		// Return any new Items
		promise.resolve(findNewItems(currentMenuItems, existingItems));
	},
	// Error Handler
	function (error)
	{
		console.log("ERROR w/ checkForNewItems: " + error.message);
		promise.reject("ERROR w/ checkForNewItems");
	});

	return promise;
}

// Function used to sort JS item objects by their name attribute
function compareItems(itemA, itemB)
{
	// Get the names
	var nameA = itemA.name;
	var nameB = itemB.name;

	// Compare
	if (nameA == nameB)
	{
		return 0;		
	}
	else if (nameA < nameB)
	{
		return -1;
	}
	return 1;
}

// Takes in currentItems and existing Items
// Returns an array of new items from currentItems that
// are not in exisiting Items
// currentItems and existingItems are two sorted array
function findNewItems(currentItems, existingItems)
{
	// Base cases, if no more potential new items
	if (currentItems.length == 0)
	{
		return [];
	}
	// Skip duplicates
	else if (currentItems.length >= 2 && currentItems[0].name == currentItems[1].name)
	{
		currentItems.splice(0,1);
		return findNewItems(currentItems, existingItems);
	}
	// Existing items have all been looked through, rest of currentItems are all new items
	else if (existingItems.length == 0)
	{
		var result = [currentItems.splice(0,1)[0]];
		result.push.apply(result, findNewItems(currentItems, existingItems));
		return result;
	}
	// If found, eliminate element from both lists
	else if (currentItems[0].name == existingItems[0].get("name"))
	{
		currentItems.splice(0,1);
		existingItems.splice(0,1);
		return findNewItems(currentItems, existingItems);
	}
	// If currentItem < existingItem, then it is new item,
	// Add to result and continue processing the list
	else if (currentItems[0].name < existingItems[0].get("name"))
	{
		var result = [currentItems.splice(0,1)[0]];
		result.push.apply(result, findNewItems(currentItems, existingItems));
		return result;
	}
	// Else currentItem > existingItem, then continue going down existingItems
	else
	{
		existingItems.splice(0,1);
		return findNewItems(currentItems, existingItems);
	}
}

// Takes in a JS representation of an item
// and converts it to a Parse Object and saves it
function saveNewParseItem(itemObject)
{
	var promise = new Parse.Promise();

	// Create the new item
	var newItem = new Item();
	newItem.set("name", itemObject.name);
	newItem.set("url", itemObject.url);
	newItem.set("recNumber", itemObject.recNumber);
	newItem.set("healthType", itemObject.healthType);

	// Save the new item
	newItem.save().then(function()
	{
		promise.resolve();
	},
	function(error)
	{
		promise.reject();
	});

	return promise;
}

