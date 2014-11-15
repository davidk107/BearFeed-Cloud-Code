var HEALTH_TYPE_DICT = 
{
	"#000000" : "",
	"#008000" : "VEGETARIAN",
	"#800040" : "VEGAN"
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
	result.breakfast = createMenuListForMeal("Breakfast", breakfastElements);

	// ----- Lunch ----- //
	result.lunch = createMenuListForMeal("Lunch", lunchElements);
	
	// ----- Dinner ----- //
	result.dinner = createMenuListForMeal("Dinner", dinnerElements);
	return result;
}

function createMenuListForMeal(meal, htmlElements)
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
			healthType: getHealthType(element)
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
	return HEALTH_TYPE_DICT[htmlElement.font.color];
}
