	//Define the map game name
var umGame = "mw";

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
var umImagePath		= "http://maps.uesp.net/";
var umMapURL		= "http://mwmap.uesp.net/";

	// Default script locations
var umGetMapURL = "../getmaplocs.php";
var umSetMapURL = "../setmaplocs.php";

	// Map properties and constants

var umMapDefaultCenter		= new google.maps.LatLng(89.92, -179.815);
var umMapBounds				= new google.maps.LatLngBounds(new google.maps.LatLng(89.8243, -179.9999), new google.maps.LatLng(89.9999, -179.6483));
var umMapDefaultZoom		= 12;
var umMapLinkZoomedValue	= 16;
var umMinMapZoom			= 10;
var umMaxMapZoom			= 17;
var umBaseMapZoom			= 16;		// this is the zoom level at which one tile = one game cell
var umCellSize				= 8192.0;
var umNumMapTilesX			= 64;
var umNumMapTilesY			= 64;
var umCellOffsetX			= 34.0; // offset at BaseMapZoom
var umCellOffsetY			= 37.0; // offset at BaseMapZoom
var umLocationIDCounter		= 0;
var umNoInitialGetMarkers	= false;
var umWikiNameSpace			= "Morrowind";
var umGamePrefix			= "vvardenfell";
var umMapImagePrefix		= "vvardenfell";
var umRegionName			= "Vvardenfell";
var umMinCellX				= -34;
var umMinCellY				= -27;
var umMaxCellX				= 30;
var umMaxCellY				= 37;
var umCellGridLabelSpacing	= 10;	// Spacing of cell grid labels, don't make too small (<10) or map performance is slow
var umMinZoomCellLabels		= 13;	// Zoom level the cell labels will be shown if enabled
var umEnableNightMap		= false;
var umEnableSimpleMap		= false;


	// Get map marker icon image file
function umGetMapMarkerIcon(MarkerType)
{
	var Icon = "Unknown"
	switch (MarkerType) {
		case  0: Icon = "None"; break;
		case  1: Icon = "City"; break;
		case  2: Icon = "Town"; break;
		case  3: Icon = "House"; break;	
		case  4: Icon = "House"; break;	
		case  5: Icon = "Door"; break;	
		case  6: Icon = "Shop"; break;	
		case  7: Icon = "Tavern"; break;	
		case 10: Icon = "Camp"; break;
		case 11: /* fall through */
		case 12: /* fall through */
		case 13: /* fall through */
		case 21: Icon = "Cave"; break;
		case 14: Icon = "Daedric"; break;
		case 15: /* fall through */
		case 18: /* fall through */
		case 19: /* fall through */
		case 20: Icon = "Mine"; break;
		case 16: /* fall through */
		case 22: /* fall through */
		case 26: Icon = "Fort"; break;
		case 17: Icon = "Ayleid"; break;
		case 23: /* fall through */
		case 24: Icon = "Landmark"; break;
		case 25: Icon = "Ship"; break;
		case 32: Icon = "Corpse"; break;
		case 100: /* fall through */
		default: Icon = "Other";
	}

	return umImagePath + "icons/icon" + Icon + ".gif";
}

	// Get a map marker description text
function umGetMapMarkerType(MarkerType)
{
	switch(MarkerType) {
		case  0: return "None";
		case  1: return "City";
		case  2: return "Town";
		case  3: return "House";
		case  4: return "Settlement";
		case  5: return "Door";
		case  6: return "Shop";
		case  7: return "Tavern";
		case  8: return "Temple";
		case  9: return "Guild";
		case 10: return "Ashlander Camp";
		case 11: return "Ancestral Tomb";
		case 12: return "Barrow";
		case 13: return "Cave";
		case 14: return "Daedric Shrine";
		case 15: return "Diamond Mine";
		case 16: return "Dunmer Stronghold";
		case 17: return "Dwemer Ruin";
		case 18: return "Ebony Mine";
		case 19: return "Egg Mine";
		case 20: return "Glass Mine";
		case 21: return "Grotto";
		case 22: return "Imperial Fort";
		case 23: return "Landmark";
		case 24: return "Monument";
		case 25: return "Ship";
		case 26: return "Velothi Tower";
		case 30: return "NPC";
		case 31: return "Transport";
		case 32: return "Corpse";
		case 33: return "Creature";
		case 100: /* fall through */
		default: return "Other";
	}

	return "Other";
}


