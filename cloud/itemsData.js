// Parse Item Class
var Item = Parse.Object.extend("Item");

// Given a list of current menu items, find any new items that are not in the database, and save those items
// Parameters:
// 		allItems: {items:{rec -> item}, recNumbers:[...]}
// Outputs:
// 		Nothing
exports.updateItemsDatabase = function(allItems) {	
	var promise = new Parse.Promise();

	// Get the rec numbers and sort them in ascending order
	var recNumbers = allItems.recNumbers;
	recNumbers.sort();

	// Query for items that are contained in recNumbers based on the recNumber field
	var itemsQuery = new Parse.Query(Item);
	itemsQuery.limit(1000);
	itemsQuery.containedIn("recNumber", recNumbers);
	itemsQuery.ascending("recNumber");
	itemsQuery.select("recNumber");
	itemsQuery.find().then(function(existingItems) {

		// Find any new items and save them
		var newItemRecNumbers = findNewItems(recNumbers, existingItems);
		return saveNewItems(allItems, newItemRecNumbers);

	}).then(function(result) {
		promise.resolve(result);
	
	}, function(error) {
		console.warn("ERROR w/ updateItemsDatabase: " + error.message);
		promise.reject();
	}); 

	return promise;
}

//  =========================================== HELPER FUNCTIONS =========================================== //
// Takes in our parsed data of allItems and an array of new recNumbers.
// Maps the recNumbers to their data and creates a new Item class to be saved to the DB
function saveNewItems(allItems, newItemRecNumbers) {
	var promise = new Parse.Promise();
	var newItemPromises = [];

	for (var i = 0; i < newItemRecNumbers.length; ++i) {
		// Retreive our new item data
		var recNumber = newItemRecNumbers[i];
		var itemData = allItems.items[recNumber];

		// Null check
		if (!itemData) {
			continue;
		}

		// Create a new item and save it
		var newItem = new Item();
		newItem.set("recNumber", recNumber);
		newItem.set("name", itemData.name);
		newItem.set("healthType", itemData.healthType);
		newItemPromises.push(newItem.save());
	}

	Parse.Promise.when(newItemPromises).then(function() {
		promise.resolve(newItemPromises.length + "");
	
	}, function(error) {
		console.warn("ERROR w/ saveNewItems: " + error.message);
		promise.reject();
	});

	return promise;
}
// Takes in currentItems and existing Items
// Returns an array of new items from currentItems that
// are not in exisiting Items
// currentItems and existingItems are two sorted array
// currentItems is just an array of recNumbers
// existingItems contains Parse Objects with an attribute recNumber
function findNewItems(currentItems, existingItems) {
	// Base cases, if no more potential new items
	if (currentItems.length == 0) {
		return [];
	}
	
	// Existing items have all been looked through, rest of currentItems are all new items
	else if (existingItems.length == 0) {
		return currentItems;
	}

	// If found, eliminate element from both lists
	else if (currentItems[0] == existingItems[0].get("recNumber")) {
		currentItems.splice(0,1);
		existingItems.splice(0,1);
		return findNewItems(currentItems, existingItems);
	}

	// If currentItem < existingItem, then it is new item,
	// Add to result and continue processing the list
	else if (currentItems[0] < existingItems[0].get("recNumber")) {
		var result = [currentItems.splice(0,1)];
		result.push.apply(result, findNewItems(currentItems, existingItems));
		return result;
	}

	// Else currentItem > existingItem, then continue going down existingItems
	else {
		existingItems.splice(0,1);
		return findNewItems(currentItems, existingItems);
	}
}