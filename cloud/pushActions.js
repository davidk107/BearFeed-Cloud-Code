var UserClass = Parse.Object.extend("UserClass");

// Takes in a map of food items
// Items are mapped to an array of location names
exports.processFoodReminders = function(mappedMenuItems)
{
	var promise = new Parse.Promise();

	var itemPushPromises = [];

	// For each item, send pushes
	for (var item in mappedMenuItems) 
	{
		if (mappedMenuItems.hasOwnProperty(item)) 
		{
			itemPushPromises.push(sendPushForItem(item, mappedMenuItems[item]));
		}
	}

	Parse.Promise.when(itemPushPromises).then(function()
	{
		promise.resolve();
	},
	function(error)
	{
		promise.reject();
	});
	return promise;
}

// Sends a push out to any users who are subscribed to this item
function sendPushForItem(item, locations)
{
	var promise = new Parse.Promise();

	// Query for all users who have this item in their subscribed
	var userQuery = new Parse.Query(UserClass);
	userQuery.equalTo("subscribedItems", item);
	userQuery.select("installationID");
	userQuery.find().then(function(subscribedUsers)
	{
		// If no subscribers, then exit
		if (subscribedUsers.length == 0)
		{
			return;
		}

		// Generate a list of installationIDs from the list of subscribed users
		var listOfInstallationIDs = [];
		for (var i = 0; i < subscribedUsers.length; ++i)
		{
			listOfInstallationIDs.push(subscribedUsers[i].get("installationID"));
		}

		// Generate a string message for the push
		var pushMessage = item + " is being served today at ";
		for (var i = 0; i < locations.length; ++i)
		{
			pushMessage += locations[i];

			// if last location, then just add !
			if (i + 1 >= locations.length)
			{
				pushMessage += "!";
			}
			// Else add " and " if second to last, else stick add ", " 
			else
			{
				pushMessage += (i+1 == locations.length-1 ? " and " : ", ");
			}
		}

		// Get installation query
		var installationQuery = new Parse.Query(Parse.Installation);
		installationQuery.containedIn("installationId",listOfInstallationIDs);

		// Send the pushes
		return Parse.Push.send(
		{
			where: installationQuery,
			data:
			{
				alert:pushMessage
			}
		});

	}).then(function()
	{
		promise.resolve();
	},
	// Error handler
	function(error)
	{
		promise.reject(error);
	});
	return promise;
}