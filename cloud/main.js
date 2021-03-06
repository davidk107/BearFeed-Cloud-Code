var menuData = require('cloud/menuData.js')
var locationData = require('cloud/locationsData.js');
var Menu = require('cloud/Menu.js');
var pushActionsFiles = require('cloud/pushActions.js');
require('cloud/userData.js');

// Main Function that will be called to update the menu twice a day
Parse.Cloud.job("updateData", function(request, response)
{
	// Local Variables
	var menuObject = null;
	var currentMenuItems = null;
	var successString;

	// Fetch the newest queried data from the website
	menuData.fetchMenuDetails().then(function(result)
	{
		// Convert result into MenuObject
		menuObject = new Menu.MenuObject(result);

		// Get all the items
		currentMenuItems = menuObject.getAllMenuItems();
		
		// Check for new items and add them to the catalog if found
		return menuData.updateMenuDatabase(currentMenuItems);

	// Successfully updated the list of items
	}).then(function(updateMenuResult)
	{
		successString = updateMenuResult;

		// Update the locations
		return locationData.updateLocationsData(menuObject);

	}).then(function()
	{
		response.success(successString);
	},
	// Error Handler
	function(error)
	{
		console.warn(error);
		response.error("ERROR w/ updateData");
	});
});

// Function call to send out push notifications for subscribed items
Parse.Cloud.job("sendFoodNotifications", function(request, response)
{
	// Local Variables
	var menuObject = null;
	var currentMenuItems = null;

	// Fetch the newest queried data from the website
	menuData.fetchMenuDetails().then(function(result)
	{
		// Convert result into MenuObject
		menuObject = new Menu.MenuObject(result);

		// Get the map of all items
		currentMappedMenuItems = menuObject.getAllMenuItemsMapped();

		// Process food reminders
		return pushActionsFiles.processFoodReminders(currentMappedMenuItems);
	}).then(function()
	{
		response.success("Food notifications successfully sent");
	},
	// Error handler
	function(error)
	{
		console.warn(error);
		response.error("ERROR w/ sendFoodNotifications");
	});

});
