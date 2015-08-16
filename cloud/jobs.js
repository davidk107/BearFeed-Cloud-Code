// This file contains all the controllers(endpoints)

// Importing services
var SERVICES = require('cloud/services.js');

// Main Function that will be called to update the menu 
// Ideally only high level logic is done in this function
// i.e Config checking, error handling, returning results
// Logic flow is
//      Check configs --> Call Service --> Report success/failured
Parse.Cloud.job("updateData", function(request, response) {

    // Check configs to see if currently summer session or not
    // We do this because during the summer, the menu is displayed differently 
    // compared to the rest of the school year, thus requiring different logic to process it
    Parse.Config.get().then(function (config) {
        var isSummer = config.get("isSummer");
        return SERVICES.updateData(isSummer);

    }).then(function (resultMessage) {
        response.success(resultMessage);

    }, function(error) {
        console.warn("ERROR w/ updateData: " + error.message);
        response.error();
    });
});

// Function call to send out push notifications for subscribed items
// TODO: FINISH THIS FUNCTION
Parse.Cloud.job("sendFoodNotifications", function(request, response) {
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