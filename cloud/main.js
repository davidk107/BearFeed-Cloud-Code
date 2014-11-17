var menuData = require('cloud/menuData.js')
var locationData = require('cloud/locationsData.js');
var menuObjectFile = require('cloud/menuObject.js');


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
		menuObject = new menuObjectFile.MenuObject(result);

		// Get all the items
		currentMenuItems = menuObject.getAllMenuItems();
		
		// Check for new items and adds them to the catalog if found
		return menuData.updateMenuData(currentMenuItems);

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
		response.error("ERROR: " + error.message);
	});
});