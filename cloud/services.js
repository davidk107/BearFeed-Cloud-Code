// This file houses the heavy lifting functions that are abstracted away from the controllers(jobs.js)

// Imports
var QUERY = require('cloud/query.js');
var DATA_PARSER = require('cloud/dataParser.js');
var ITEMS_DATA = require('cloud/itemsData.js');
var LOCATIONS_DATA = require('cloud/locationsData.js');

// Main service function that will do the heavy lifting of
// querying for data, saving new items, and updating locations
exports.updateData = function(isSummer) {

    var promise = new Parse.Promise();
    var parsedData = null;
    var numNewItems = 0;

    // Query the data
    QUERY.queryForMenuData().then(function(rawMenuData) {
        // Determine which parsing function to use
        var dataParsingFunction = isSummer ? DATA_PARSER.parseRawDataSummer : DATA_PARSER.parseRawDataRegular;

        // Parse the data into a usuable format for further processing
        parsedData = dataParsingFunction(rawMenuData);

        // Identify any new menu items and save them to our databases
        return ITEMS_DATA.updateItemsDatabase(parsedData.allItems);

    }).then(function(result) {
        // Save the number of new items that were saved
        numNewItems = result;
        
        // Update our locations data
        return LOCATIONS_DATA.updateLocationsData(parsedData);

    }).then(function() {

        promise.resolve(numNewItems + (numNewItems == 1 ? "new item!" : " new items!"));

    }, function(error) {
        console.warn("ERROR w/ updateDataSummer: " + error.message);
        promise.reject();
    });

    return promise;
}