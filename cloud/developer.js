var Item = Parse.Object.extend("Item");

// Function call to remove all duplicate entries in the Item DB. 
// Function will only be used for database maintenance. 
Parse.Cloud.define("purgeDuplicateEntries", function(request, response) {
    var itemsToRemove = [];

    Parse.Config.get().then(function(config) {
        var isDebugEnabled = config.get("isDebugEnabled");
        // Debug not enabled
        if (!isDebugEnabled) {
            return Parse.Promise.error({message:"DEBUG MODE IS NOT ENABLED."});
        }

        return checkEntriesWithSkip(0, itemsToRemove);
    }).then(function() {
        return Parse.Object.destroyAll(itemsToRemove);
    }).then(function() {
        response.success(itemsToRemove.length + " Item(s) have been removed!");
    }, function(error) {
        console.warn("ERROR w/ purgeDuplicateEntries: " + error.message);
        response.error();
    });    
});

// Recursive call that checks Items DB 500 items at a time
function checkEntriesWithSkip(skipAmount, itemsToRemove) {
    var promise = new Parse.Promise();

    var duplicateItems = {};
    var itemQuery = new Parse.Query(Item);
    itemQuery.limit(500);
    itemQuery.ascending("recNumber");
    itemQuery.select("recNumber");
    itemQuery.skip(skipAmount);
    itemQuery.find().then(function(results) {
        // No Items to check, we are done. Return to caller
        if (results.length == 0) {
            return Parse.Promise.as();
        } 
        // Check the list for duplicate values and add them to itemsToRemove
        var prevDupeItemAdded = null;
        for (var i = results.length-1; i > 1; --i) {
            var recNumberCurrent = results[i].get("recNumber");
            var recNumberNext = results[i-1].get("recNumber");
            if (recNumberCurrent == recNumberNext) {
                itemsToRemove.push(results[i]);
            }
        }
        // console.log(itemsToRemove.length);
        // Check next 500 entries
        return checkEntriesWithSkip(skipAmount + 500, itemsToRemove);
    }).then(function(result) {
        promise.resolve();
    }, function(error) {
        console.log("ERROR w/ checkEntriesWithSkip: " + error.message);
        promise.reject();
    });

    return promise;
}