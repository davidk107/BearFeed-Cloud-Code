var HEALTH_TYPE_DICT = 
{
	"#000000" : "",
	"#008000" : "VEGETARIAN",
	"#008040" : "VEGETARIAN",
	"#800040" : "VEGAN",
	"#800000" : "VEGAN",
	"#800080" : "VEGAN"
};

exports.MenuObject = function(htmlElements)
{
	// Save htmlElements
	this.htmlElements = htmlElements;

	// Begin parsing the data
	this.parseData();
}

exports.MenuObject.prototype.parseData = function() 
{
	// Get the htmlElements
	var htmlElements = this.htmlElements;

	// ----- CrossRoads ----- //
	this.crossroads = createMenuForLocation("Crossroads", htmlElements.breakfast[0], htmlElements.lunch[0], htmlElements.dinner[0]);

	// ----- Cafe 3 ----- //
	this.cafe3 = createMenuForLocation("Cafe 3", htmlElements.breakfast[1], htmlElements.lunch[1], htmlElements.dinner[1]);

	// ----- Foothill ----- //
	this.foothill = createMenuForLocation("Foothill", htmlElements.breakfast[2], htmlElements.lunch[2], htmlElements.dinner[2]);

	// Clark Kerr
	this.clarkKerr = createMenuForLocation("Clark Kerr", htmlElements.breakfast[3], htmlElements.lunch[3], htmlElements.dinner[3]);
};

exports.MenuObject.prototype.getAllMenuItems = function()
{
	// Results array
	var allItems = [];

	// Crossroads
	extendMenuItems(allItems, this.crossroads);

	// Cafe 3
	extendMenuItems(allItems, this.cafe3);

	// Foothill
	extendMenuItems(allItems, this.foothill);

	// Clark Kerr
	extendMenuItems(allItems, this.clarkKerr);

	return allItems;
};

// Returns a map of all items
// Map structure follows as ItemName -> [Locations]
exports.MenuObject.prototype.getAllMenuItemsMapped = function()
{
	// Get all the items first
	var allItems = this.getAllMenuItems();

	var mappedItems = {};
	
	// Loop through each item and map them
	for (var i = 0; i < allItems.length; ++i)
	{
		var item = allItems[i];
		if (item.name in mappedItems && (mappedItems[item.name].indexOf(item.location) == -1))
		{
			mappedItems[item.name].push(item.location);
		}
		else
		{
			mappedItems[item.name] = [item.location];
		}
	}
	return mappedItems;
}

function extendMenuItems(result, location)
{
	result.push.apply(result, location.breakfast);
	result.push.apply(result, location.lunch);
	result.push.apply(result, location.dinner);
}

function createMenuForLocation(location, breakfastElements, lunchElements, dinnerElements)
{
	var result = {}
	// Store location name
	result.location = location;

	// ----- Breakfast ----- //
	result.breakfast = createMenuListForMeal("Breakfast", breakfastElements, location);

	// ----- Lunch ----- //
	result.lunch = createMenuListForMeal("Lunch", lunchElements, location);
	
	// ----- Dinner ----- //
	result.dinner = createMenuListForMeal("Dinner", dinnerElements, location);
	return result;
}

function createMenuListForMeal(meal, htmlElements, location)
{
	// Check if closed
	if (htmlElements.em != null && htmlElements.em == "Closed")
	{
		return [];
	}

	// Get the list of items
	var htmlItemsArray = htmlElements.a;

	// Results array
	var result = [];

	for (var i = 0; i < htmlItemsArray.length; ++i)
	{
		// Get the a element
		var element = htmlItemsArray[i];

		var foodItem = 
		{
			url: element.href,
			name: element.font.content.trim(),
			recNumber: getRecNumberForItem(element.href),
			healthType: getHealthType(element),
			location: location
		};

		result.push(foodItem);
	}
	return result;
}

// When passed in a url from a food item
// it will return the internal REC number
// used by CalDining's services
function getRecNumberForItem(urlString)
{
	recNumber = "RecNumAndPort".replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + recNumber + "=([^&#*]{6})");
    var results = regex.exec(urlString);
    return results == null ? null : decodeURIComponent(results[1].replace("/\+/g", " ")).trim();
}

// Gets if the health type is normal(""), Vegetarian, or Vegan
function getHealthType(htmlElement)
{
	var type = HEALTH_TYPE_DICT[htmlElement.font.color];
	if (type == null)
	{
		type = "";
	}
	return type;
}
