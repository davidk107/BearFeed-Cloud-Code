// Dictionary to determine what type of category the food is (normal, vegetarian, or vegan)
var HEALTH_TYPE_DICT = {
    "#000000" : "",
    "#008000" : "VEGETARIAN",
    "#008040" : "VEGETARIAN",
    "#800040" : "VEGAN",
    "#800000" : "VEGAN",
    "#800080" : "VEGAN"
};

// ---------- SUMMER SCHEDULE LOGIC ---------- //
// Parses and converts the raw data from the query to a more usable structure
// Format is of type
//  {crossroads:{breakfast:[...], lunch:[...], dinner:[...]}, allItems:{items:{rec -> item}, recNumbers:[...]}}
exports.parseRawDataSummer = function(rawMenuData) {
    // Since only Crossroads in the summer, we can prepopulate result with empty results for the other locations
    // This makes for easy processing futher down 
    var result = {
        cafe3: {breakfast:[], lunch:[], dinner:[]},
        foothill: {breakfast:[], lunch:[], dinner:[]},
        clarkKerr: {breakfast:[], lunch:[], dinner:[]}
    };

    // All items 
    var allItems = {items:{}, recNumbers:[]};
    
    // Crossroads
    var crossroads = {};
    crossroads.breakfast = convertHTMLAnchorArray(rawMenuData.breakfast.a, "Crossroads", allItems);
    crossroads.lunch = convertHTMLAnchorArray(rawMenuData.lunch.a, "Crossroads", allItems);
    crossroads.dinner = convertHTMLAnchorArray(rawMenuData.dinner.a, "Crossroads", allItems);
    
    result.crossroads = crossroads;
    result.allItems = allItems;
    return result;
}


// ---------- SCHOOL YEAR LOGIC ---------- //
// TODO: FINISH THIS FUNCTION
exports.parseRawDataRegular = function() {

}

// ----------========== HELPER FUNCTIONS ==========---------- //

// Takes in an array of HTML anchor elements and parses it and converts it to an array of 
// JS "Item" objects consisting of url, name, recNumber, healthType, location
function convertHTMLAnchorArray(anchorElements, location, allItems) {
    if (!anchorElements) {
        return [];
    }
    var items = [];
    for (var i = 0; i < anchorElements.length; ++i) {
        var anchorElement = anchorElements[i];
        // Get only the data we want and add to our items array
        var item = {
            name: anchorElement.font.content.trim(),
            recNumber: getRecNumberForItem(anchorElement.href),
            healthType: getHealthType(anchorElement),
        }
        items.push(item);

        // Add to allItems and keep track of where this item is being served for use in push notifications later on
        var recNumber = item.recNumber;
        if (recNumber in allItems.items) {
            // Already added
            allItems.items[recNumber].locations.push(location);
        } else {
            // New Item
            item.locations = [location];
            allItems.items[recNumber] = item;
            allItems.recNumbers.push(recNumber);
        }
    }
    return items;
}

// When passed in a url from a food item
// it will return the internal REC number
// used by CalDining's services
function getRecNumberForItem(urlString) {
    recNumber = "RecNumAndPort".replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + recNumber + "=([^&#*]{6})");
    var results = regex.exec(urlString);
    return results == null ? null : decodeURIComponent(results[1].replace("/\+/g", " ")).trim();
}

// Gets if the health type is normal(""), Vegetarian, or Vegan
// Determined by looking at font color and matching that up with health type dict defined at the top
function getHealthType(htmlElement) {
    var type = HEALTH_TYPE_DICT[htmlElement.font.color];
    if (type == null) {
        type = "";
    }
    return type;
}