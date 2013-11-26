	//Define the map game name
var umGame = "sr";

	// File and path names
//var umOorMapTile	    = "images/" + umGame + "outofrange-color.jpg";
//var umOorNightMapTile = "images/" + umGame + "outofrange-night-color.jpg";
var umOorMapTile	  = "srmap/color/nullimage.jpg";
var umOorNightMapTile = "srmap/night/nullimage.jpg";
var umOorSimpleMapTile = "srmap/simple/nullimage.jpg";
var umZoomIcon		  = "images/zoomicon.gif";
var umWikiPageIcon	  = "images/iconwikipage.png";
var umUpArrowIcon	  = "images/uparrows.gif";
var umDownArrowIcon	  = "images/downarrows.gif";
var umBasePath		  = "/";
var umGameDir		  = umGame + "map";
var umGamePath		  = umBasePath + umGameDir + "/";
var umTilePathPrefix  = "/color/zoom";

	//Test/development paths only
//umBasePath = "/maps2/";
//var umImagePath	= "http://content3.uesp.net" + umBasePath;
//var umMapURL	= umGame + "map.html";

	// Live paths
var umImagePath		= "http://maps.uesp.net/";
var umMapURL		= "http://srmap.uesp.net/";

	// Default script locations
var umGetMapURL = "getmaplocs.php";
var umSetMapURL = "setmaplocs.php";
var umGetResourceURL = "getcellresources.php";

	// Map properties and constants
var umMapDefaultCenter		= new google.maps.LatLng(89.87, -179.575);
var umMapBounds				= new google.maps.LatLngBounds(new google.maps.LatLng(89.739, -179.99999), new google.maps.LatLng(89.989, -179.335));
var umMapDefaultZoom		= 11;
var umMapLinkZoomedValue	= 15;
var umMinMapZoom			= 10;
var umMaxMapZoom			= 17;
var umBaseMapZoom			= 15;	// this is the zoom level at which one tile = one game cell
var umCellSize				= 4096.0;
var umNumMapTilesX			= 64;
var umNumMapTilesY			= 64;
var umCellOffsetX			= 57.0;	// offset at BaseMapZoom
var umCellOffsetY			= 51.0;	// offset at BaseMapZoom
var umLocationIDCounter		= 0;
var umNoInitialGetMarkers	= false;
var umWikiNameSpace			= "Skyrim";
var umGamePrefix			= "skyrim";
var umMapImagePrefix		= "skyrim";
var umRegionName			= "Tamriel";
var umMinCellX				= -57;
var umMinCellY				= -44;
var umMaxCellX				= 64;
var umMaxCellY				= 47;
var umCellGridLabelSpacing	= 5;	// Spacing of cell grid labels, don't make too small (<10) or map performance is slow
var umMinZoomCellLabels		= 13;	// Zoom level the cell labels will be shown if enabled
var umEnableNightMap		= true;
var umEnableSimpleMap		= false;


	// Get map marker icon image file
function umGetMapMarkerIcon(MarkerType) 
{
	var Icon = "Unknown";
	
	switch (MarkerType) {
		case 0:		Icon = "None"; break;
		case 1:		Icon = "City"; break;
		case 2:		Icon = "Town"; break;
		case 3:		Icon = "Settlement"; break;
		case 4:		Icon = "Cave"; break;
		case 5:		Icon = "Camp"; break;
		case 6:		Icon = "Fort"; break;
		case 7:		Icon = "NordicRuin"; break;
		case 8:		Icon = "DwemerRuins"; break;
		case 9:		Icon = "Shipwreck"; break;
		case 10:	Icon = "Grove"; break;
		case 11:	Icon = "Landmark"; break;
		case 12:	Icon = "DragonLair"; break;
		case 13:	Icon = "Farm"; break;
		case 14:	Icon = "WoodMill"; break;
		case 15:	Icon = "Mine"; break;
		case 16:	Icon = "ImperialCamp"; break;
		case 17:	Icon = "StormcloakCamp"; break;
		case 18:	Icon = "Doomstone"; break;
		case 19:	Icon = "WheatMill"; break;
		case 20:	Icon = "Other"; break;
		case 21:	Icon = "Stable"; break;
		case 22:	Icon = "ImperialTower"; break;
		case 23:	Icon = "Clearing"; break;
		case 24:	Icon = "Pass"; break;
		case 25:	Icon = "Other"; break;
		case 26:	Icon = "Other"; break;
		case 27:	Icon = "Lighthouse"; break;
		case 28:	Icon = "OrcStronghold"; break;
		case 29:	Icon = "GiantCamp"; break;
		case 30:	Icon = "Shack"; break;
		case 31:	Icon = "NordicTower"; break;
		case 32:	Icon = "NordicDwelling"; break;
		case 33:	Icon = "Docks"; break;
		case 34:	Icon = "Shrine"; break;
		case 35:	Icon = "RiftenCastle"; break;
		case 36:	Icon = "RiftenCapitol"; break;
		case 37:	Icon = "WindhelmCastle"; break;
		case 38:	Icon = "WindhelmCapitol"; break;
		case 39:	Icon = "WhiterunCastle"; break;
		case 40:	Icon = "WhiterunCapitol"; break;
		case 41:	Icon = "SolitudeCastle"; break;
		case 42:	Icon = "SolitudeCapitol"; break;
		case 43:	Icon = "MarkarthCastle"; break;
		case 44:	Icon = "MarkarthCapitol"; break;
		case 45:	Icon = "WinterholdCastle"; break;
		case 46:	Icon = "WinterholdCapitol"; break;
		case 47:	Icon = "MorthalCapitol"; break;
		case 48:	Icon = "MorthalCapitol"; break;
		case 49:	Icon = "FalkreathCastle"; break;
		case 50:	Icon = "FalkreathCapitol"; break;
		case 51:	Icon = "DawnstarCastle"; break;
		case 52:	Icon = "DawnstarCapitol"; break;
		case 60:	Icon = "Door"; break;
		case 61:	Icon = "Shrine"; break;
		case 62:	Icon = "Other"; break;
		case 63:	Icon = "DragonLair"; break;
		case 100:
			/* fall through */
		default: 	Icon = "Other";
	}

	return umImagePath + "icons/sricon" + Icon + ".png";
}

	// Get a map marker description text
function umGetMapMarkerType(MarkerType) 
{
	switch(MarkerType) {
		case 0:		Icon = "None"; break;
		case 1:		Icon = "City"; break;
		case 2:		Icon = "Town"; break;
		case 3:		Icon = "Settlement"; break;
		case 4:		Icon = "Cave"; break;
		case 5:		Icon = "Camp"; break;
		case 6:		Icon = "Fort"; break;
		case 7:		Icon = "Nordic Ruin"; break;
		case 8:		Icon = "Dwarven Ruin"; break;
		case 9:		Icon = "Shipwreck"; break;
		case 10:	Icon = "Grove"; break;
		case 11:	Icon = "Landmark"; break;
		case 12:	Icon = "Dragon Lair"; break;
		case 13:	Icon = "Farm"; break;
		case 14:	Icon = "Wood Mill"; break;
		case 15:	Icon = "Mine"; break;
		case 16:	Icon = "Imperial Camp"; break;
		case 17:	Icon = "Stormcloak Camp"; break;
		case 18:	Icon = "Standing Stone"; break;
		case 19:	Icon = "Wheat Mill"; break;
		case 20:	Icon = "Smelter"; break;
		case 21:	Icon = "Stable"; break;
		case 22:	Icon = "Watchtower"; break;
		case 23:	Icon = "Clearing"; break;
		case 24:	Icon = "Pass"; break;
		case 25:	Icon = "Altar"; break;
		case 26:	Icon = "Rock"; break;
		case 27:	Icon = "Lighthouse"; break;
		case 28:	Icon = "Orc Stronghold"; break;
		case 29:	Icon = "Giant Camp"; break;
		case 30:	Icon = "Shack"; break;
		case 31:	Icon = "Nordic Tower"; break;
		case 32:	Icon = "Ruin"; break;
		case 33:	Icon = "Dock"; break;
		case 34:	Icon = "Daedric Shrine"; break;
		case 35:	Icon = "Riften Castle"; break;
		case 36:	Icon = "Riften"; break;
		case 37:	Icon = "Windhelm Castle"; break;
		case 38:	Icon = "Windhelm"; break;
		case 39:	Icon = "Whiterun Castle"; break;
		case 40:	Icon = "Whiterun"; break;
		case 41:	Icon = "Solitude Castle"; break;
		case 42:	Icon = "Solitude"; break;
		case 43:	Icon = "Markarth Castle"; break;
		case 44:	Icon = "Markarth"; break;
		case 45:	Icon = "Winterhold Castle"; break;
		case 46:	Icon = "Winterhold"; break;
		case 47:	Icon = "Morthal Castle"; break;
		case 48:	Icon = "Morthal"; break;
		case 49:	Icon = "Falkreath Castle"; break;
		case 50:	Icon = "Falkreath"; break;
		case 51:	Icon = "Dawnstar Castle"; break;
		case 52:	Icon = "Dawnstar"; break;
		case 60:	Icon = "Door"; break;
		case 61:	Icon = "Shrine"; break;
		case 62:	Icon = "Ore Vein"; break;
		case 63:	Icon = "Dragon Mound"; break;
		case 100:
			/* fall through */
		default: return "Other";
	}

	return Icon;
}



