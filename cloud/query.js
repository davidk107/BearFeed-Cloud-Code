var PRIVATE_DATA = require('cloud/privateData.js');

// Parse Item Class
var Item = Parse.Object.extend("Item");

//  =========================================== MENU DATA PUBLIC FUNCTIONS =========================================== //

// Fetches data from CalDining's Menu Website via YQL 
// Query selects for the <tr> elements that make up the actual menu portion of the page source
// Then parses the data into an JS object
// JS Object has attributes breakfast, lunch, and dinner 
// that are linked to arrays of <td> html elements
// Parameters:
//      Nothing
// Outputs:
//      JS Object with attributes breakfast, lunch, and dinner
//      Ex: {breakfast: {a: [...]}, lunch: {a: [....]}, dinner: {a: [...]}}
exports.queryForMenuData = function() {
    // Create Parse Promise
    var promise = new Parse.Promise();

    // YQL URL
    var yqlURL = PRIVATE_DATA.yqlURL;

    // We will attempt to perform 10 request attempts
    var requests = [];
    var numRequestAttempts = 10;
    for (var i = 0; i < numRequestAttempts; ++i) {
        requests.push(performYQLRequest(yqlURL));
    }

    Parse.Promise.when(requests).then(function() {
        // Loop through the arguments and find one that returns a valid result(not null)
        for (var i = 0; i < arguments.length; ++i) {
            var checkResult = arguments[i];
            if (checkResult) {
                return Parse.Promise.as(checkResult);
            }
        }
        // Else no results found, throw error
        return Parse.Promise.error("All YQL requests were unsuccessful");
    
    }).then(function(result) {
        promise.resolve(result);
    
    }, function(error) {
        console.warn("ERROR w/ fetchMenuDetails: " + error.message);
        promise.reject("All YQL requests were unsuccessful");
    });

    return promise;
}

// Given a list of current menu items, find any new items that are not in the database, and save those items
// Parameters:
//      [FoodItems] - an array of JS Dicts representing each item (look to Menu.js for FoodItem implementation)
// Outputs:
//      Nothing
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
function performYQLRequest(yqlURL) {
    var promise = new Parse.Promise();

    // Fetch data from the query
    Parse.Cloud.httpRequest({
        url: yqlURL,

    }).then(function(response) {
        var websiteElements = JSON.parse(response.text);
        var result = {};
        try {
            // Get array of <tr> elements
            var trArray = websiteElements.query.results.results.tr;     

            // Isolate the breakfast, lunch and dinner trs and store into result object
            result.breakfast = trArray[0].td;
            result.lunch = trArray[1].td;
            result.dinner = trArray[2].td;    
        
        } catch(error) {
            console.warn("ERROR w/ fetching trArray: " + error);
            return Parse.Promise.error("Invalid YQL result returned");
        }

        return Parse.Promise.as(result);
    }).then(function(result) {
        
        // Return results
        promise.resolve(result);

    }, function(error) {
        console.warn("ERROR w/ performYQLRequest: " + error.message);
        promise.resolve(null);
    });

    return promise;
}