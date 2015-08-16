// Parse Item Class
var Item = Parse.Object.extend("Item");


// Given a list of current menu items, find any new items that are not in the database, and save those items
// Parameters:
// 		allItems: {items:{rec -> item}, recNumbers:[...]}
// Outputs:
// 		Nothing
// TODO: FINISH THIS FUNCTION
exports.updateItemsDatabase = function(allItems) {	
	var promise = new Parse.Promise();

	// Get the rec numbers and sort them in ascending order
	var recNumbers = allItems.recNumbers;
	recNumbers.sort();

	// Query for items that are contained in recNumbers based on the recNumber field
	var itemsQuery = new Parse.Query(Item);
	itemsQuery.containedIn("recNumber", recNumbers);
	itemsQuery.ascending("recNumber");
	itemsQuery.find().then(function(items) {
		promise.resolve(0);
	});

	return promise;
}

//  =========================================== HELPER FUNCTIONS =========================================== //


// Takes in the list of items from the current menu
// Fetch all the existing catalog items
// Compares and find if there are any new items that need to be saved
function checkForNewItems(currentMenuItems) {
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


// Takes in currentItems and existing Items
// Returns an array of new items from currentItems that
// are not in exisiting Items
// currentItems and existingItems are two sorted array
function findNewItems(currentItems, existingItems) {
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
function saveNewParseItem(itemObject) {
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

