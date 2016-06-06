	//Define the map game name
var umGame = "ob";

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
var umImagePath 	= "http://maps.uesp.net/";
var umMapURL		= "http://obmap.uesp.net/";

	// Default script locations
var umGetMapURL = "../getmaplocs.php";
var umSetMapURL = "../setmaplocs.php";

	// Map properties and constants
var umMapDefaultCenter		= new google.maps.LatLng(89.85, -179.63);
var umMapBounds				= new google.maps.LatLngBounds(new google.maps.LatLng(89.67, -179.99999), new google.maps.LatLng(89.99999, -179.297));
var umMapDefaultZoom		= 11;
var umMapLinkZoomedValue	= 15;
var umMinMapZoom			= 9;
var umMaxMapZoom			= 16;
var umBaseMapZoom			= 16;	// this is the zoom level at which one tile = one game cell
var umCellSize				= 4096.0;
var umNumMapTilesX			= 133;
var umNumMapTilesY			= 129;
var umCellOffsetX			= 64.0;	// offset at BaseMapZoom
var umCellOffsetY			= 60.0;	// offset at BaseMapZoom
var umLocationIDCounter		= 0;
var umNoInitialGetMarkers	= false;
var umWikiNameSpace			= "Oblivion";
var umGamePrefix			= "tamriel";
var umMapImagePrefix		= "tamriel";
var umRegionName			= "Oblivion";
var umMinCellX				= -64;
var umMinCellY				= -60;
var umMaxCellX				= 64;
var umMaxCellY				= 60;
var umCellGridLabelSpacing	= 10;	// Spacing of cell grid labels, don't make too small (<10) or map performance is slow
var umMinZoomCellLabels		= 13;	// Zoom level the cell labels will be shown if enabled
var umEnableNightMap		= false;
var umEnableSimpleMap		= false;


	// Get map marker icon image file
function umGetMapMarkerIcon(MarkerType)
{
	var Icon = "Other";
		
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
		case 10: Icon = "Daedric"; break;
		case 11: Icon = "Oblivion"; break;
		case 30: Icon = "Nirnroot"; break;
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
		case  4: return "Elven Ruin";
		case  5: return "Fort Ruin";
		case  6: return "Mine";
		case  7: return "Landmark";
		case  9: return "Settlement";
		case 10: return "Daedric Shrine";
		case 11: return "Oblivion Gate";
			// 12 missing because it used to be unknown
		case 20: return "Ayleid Well";
		case 21: return "Doom Stone";
		case 22: return "Rune Stone";
		case 23: return "Wayshrine";
		case 30: return "Nirnroot";
		case 31: return "Treasure";
		case 40: return "Door";
		case 41: return "House";
		case 42: return "Shop";
		case 43: return "Chapel";
		case 44: return "Tavern";
		case 45: return "Guild";
		case 46: return "Castle";
		case 100:
		default: return "Other";
	}

	return "Other";
}

