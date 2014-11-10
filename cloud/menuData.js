var menuObjectFile = require('cloud/menuObject.js');
var privateData = require('cloud/privateData.js');

// Parse Item Class
var Item = Parse.Object.extend("Item");

// Fetches data from CalDining's Menu Website via YQL 
// Query selects for the 3 <tr> elements that make up the actual menu portion of the page source
Parse.Cloud.job("updateMenuData", function(request, response)
{	
	var menuObject = null;
	var currentMenuItems = null;
	var newItems = [];

	// Fetch data from the query
	fetchMenuDetails().then(function(result)
	{
		// Convert result into MenuObject
		menuObject = new menuObjectFile.MenuObject(result);

		// Get all the items
		currentMenuItems = menuObject.getAllMenuItems();
		
		// Check for new items and adds them to the catalog if found
		return checkForNewItems(currentMenuItems);

	}).then(function(results)
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
		response.success("Menu Data Updated with " + newItems.length + " new items!");
	},
	function(error)
	{
		console.log("ERROR w/ updateMenuData: " + error);
		response.error("ERROR w/ updateMenuData");
	});
});

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

	itemsQuery.find().then(function(existingItems)
	{
		// Sort the list of current items for use in comparison function
		currentMenuItems.sort(function(a,b){return a.name.localeCompare(b.name)});

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

// Takes in currentItems and existing Items
// Returns an array of new items from currentItems that
// are not in exisiting Items
function findNewItems(currentItems, existingItems)
{
	// Base cases, if no more potential new items
	if (currentItems.length == 0)
	{
		return [];
	}
	// Skip duplicates
	else if (currentItems.length >= 2 && currentItems[0].name.localeCompare(currentItems[1].name) == 0)
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
	else if (currentItems[0].name.localeCompare(existingItems[0].get("name")) == 0)
	{
		currentItems.splice(0,1);
		existingItems.splice(0,1);
		return findNewItems(currentItems, existingItems);
	}
	// If currentItem < existingItem, then it is new item,
	// Add to result and continue processing the list
	else if (currentItems[0].name.localeCompare(existingItems[0].get("name")) == -1)
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

// Does the actual HTTP Request on the YQL URL
// Then parses the data into an JS object
// JS Object has attributes breakfast, lunch, and dinner 
// that are linked to arrays of <td> html elements
function fetchMenuDetails()
{
	// Create Parse Promise
	var promise = new Parse.Promise();

	// YQL URL
	var yqlURL = privateData.yqlURL;
	
	// Fetch data from the query
	Parse.Cloud.httpRequest(
	{
		url: yqlURL,

	}).then(function(response)
	{
		var websiteElements = JSON.parse(response.text);

		// Get array of <tr> elements
		var trArray = websiteElements.query.results.results.tr;

		// Isolate the breakfast, lunch and dinner trs and store into result object
		var result = {};
		result.breakfast = trArray[0].td;
		result.lunch = trArray[1].td;
		result.dinner = trArray[2].td;

		// Return results
		promise.resolve(result);
	},
	// Error Handler
	function(error)
	{
		console.log(error);
		promise.reject("ERROR w/ fetchMenuDetails: " + error.status);
	});

	return promise;
}