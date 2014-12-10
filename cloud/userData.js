var UserClass = Parse.Object.extend("UserClass");

// This function takes in an installationID and creates a new UserClass instance of it
// UserClass instance is used to anonymize logins and allows Parse to identify devices 
Parse.Cloud.define("createNewUser", function(request, response)
{
	// Get the installationID
	var installationID = request.params.installationID;

	// Create new UserClass
	var user = new UserClass();
	user.set("installationID", installationID);
	user.set("subscribedItems", []);
	user.save().then(function()
	{
		// user saved
		response.success("New user created!");
	},
	// Error handler
	function(error)
	{
		response.error("Error creating new user");
	});
});

Parse.Cloud.define("isInstallationIdRegistered", function(request, response)
{
	// Get the installationID
	var installationID = request.params.installationID;

	// Query for any userObjects that are correlated with the installation id
	var userQuery = new Parse.Query(UserClass);
	userQuery.equalTo("installationID", installationID);
	userQuery.find().then(function(results)
	{
		// Return true if no results found, meaning not registered, else false
		response.success(results.length != 0);
	},
	// Error handler
	function(error)
	{
		response.error("Error checking for exisiting registrations");
	});
});

// Will add a specific item name to a UserClass
// Takes in installationID and itemName
Parse.Cloud.define("subscribeToItem", function(request, response)
{
	// Get the installation id
	var installationID = request.params.installationID;

	// Get the name of the food that is requested
	var itemName = request.params.itemName;

	// Get the UserClass object that corresponds to the installationID
	var userQuery = new Parse.Query(UserClass);
	userQuery.equalTo("installationID", installationID);
	userQuery.first().then(function(userObject)
	{
		// If no corresponding user object found, then error
		if (userObject == null)
		{
			throw "No user found";
		}

		// Else add itemName to the subscribedArray
		userObject.addUnique("subscribedItems", itemName);
		return userObject.save();
	}).then(function()
	{
		response.success(itemName + " has been subscribed to!");
	},
	// Error handler
	function(error)
	{
		response.error("Error with subscribeToItem");
	});
});

// Unsubscribe from a given item
Parse.Cloud.define("unsubscribeFromItem", function(request, response)
{
	// Get the installation id
	var installationID = request.params.installationID;

	// Get the name of the food that is requested
	var itemName = request.params.itemName;

	// Get the UserClass object that corresponds to the installationID
	var userQuery = new Parse.Query(UserClass);
	userQuery.equalTo("installationID", installationID);
	userQuery.first().then(function(userObject)
	{
		// If no corresponding user object found, then error
		if (userObject == null)
		{
			 throw "No user found";
		}

		// Else add itemName to the subscribedArray
		userObject.remove("subscribedItems", itemName);
		return userObject.save();
	}).then(function()
	{
		response.success(itemName + " has been unsubscribed from!");
	},
	// Error handler
	function(error)
	{
		response.error("Error with unsubscribeFromItem");
	});
})