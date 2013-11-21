	//Define the map game name
var umGame = "si";

	// File and path names
var umOorMapTile	= "images/" + umGame + "outofrange.jpg";
var umZoomIcon		= "images/zoomicon.gif";
var umWikiPageIcon	= "images/iconwikipage.png";
var umUpArrowIcon	= "images/uparrows.gif";
var umDownArrowIcon	= "images/downarrows.gif";
var umBasePath		= "/";
var umGameDir		= umGame + "map";
var umGamePath		= umBasePath + umGameDir + "/";
var umTilePathPrefix = "/zoom";

	//Test/development paths only
//var umImagePath	= "http://content3.uesp.net" + umBasePath;
//var umMapURL	= umGame + "map.html";

	// Live paths
//var umImagePath	= "http://maps.uesp.net/";
//var umMapURL		= "http://www.uesp.net" + umGamePath + umGame + "map.shtml";
var umImagePath		= "http://maps.uesp.net/";
//var umImagePath		= "http://www.uesp.net/maps2/";
var umMapURL		= "http://simap.uesp.net/";

	// Default script locations
var umGetMapURL = "getmaplocs.php";
var umSetMapURL = "setmaplocs.php";

	// Map properties and constants
var umMapDefaultCenter		= new google.maps.LatLng(89.9, -179.8);
var umMapBounds				= new google.maps.LatLngBounds(new google.maps.LatLng(89.824, -179.9999), new google.maps.LatLng(89.9999, -179.648));
var umMapDefaultZoom		= 12;
var umMapLinkZoomedValue	= 15;
var umMinMapZoom			= 10;
var umMaxMapZoom			= 16;
var umBaseMapZoom			= 16;	// this is the zoom level at which one tile = one game cell
var umCellSize				= 4096.0;
var umNumMapTilesX			= 64;
var umNumMapTilesY			= 64;
var umCellOffsetX			= 30.0;	// offset at BaseMapZoom
var umCellOffsetY			= 35.0;	// offset at BaseMapZoom
var umLocationIDCounter		= 0;
var umNoInitialGetMarkers	= false;
var umWikiNameSpace			= "Shivering";
var umGamePrefix			= "seworld";
var umMapImagePrefix		= "seworld";
var umRegionName			= "Shivering";
var umMinCellX				= -30;
var umMinCellY				= -29;
var umMaxCellX				= 34;
var umMaxCellY				= 35;
var umCellGridLabelSpacing	= 10;	// Spacing of cell grid labels, don't make too small (<10) or map performance is slow
var umMinZoomCellLabels		= 13;	// Zoom level the cell labels will be shown if enabled
var umEnableNightMap		= false;
var umEnableSimpleMap		= false;


// Get map marker icon image file
function umGetMapMarkerIcon(MarkerType)
{
	var Icon = "Other"
		
	switch (MarkerType) {
		case  0: Icon = "None"; break;
		case  1: Icon = "Camp"; break;
		case  2: Icon = "Cave"; break;
		case  3: Icon = "City"; break;
		case  4: Icon = "Ayleid"; break;	
		case  5: Icon = "Fort"; break;
		case  6: Icon = "Mine"; break;
		case  7: Icon = "Landmark"; break;
		case  9: Icon = "Town"; break;
		case 40: Icon = "Door"; break;	
		case 41: Icon = "House"; break;	
		case 42: Icon = "Shop"; break;	
		case 44: Icon = "Tavern"; break;	
		case 100:
		default: Icon = "Other";
	}
	
	return umImagePath + "icons/icon" + Icon + ".gif";
}


	// Get a map marker description text
function umGetMapMarkerType(MarkerType)
{

	switch(MarkerType) {
		case  0: return "None";
		case  1: return "Camp";
		case  2: return "Cave";
		case  3: return "City";
			//used for ordered Door to Cyrodiil
		case  4: return "Door";
		case  5: return "Ruin";
		case  7: return "Landmark";
		case  9: return "Settlement";
		case 25: return "Obelisk of Order";
		case 31: return "Treasure";
		case 32: return "Crystal Chest";
		case 40: return "Door";
		case 41: return "House";
		case 42: return "Shop";
		case 43: return "Chapel";
		case 44: return "Tavern";
		case 46: return "Castle";
		case 100:
		default: return "Other";
	}

	return "Other";
}