	//Define the map game name
var umGame = "tamrielrebuilt";

	// File and path names
var umOorMapTile	= "images/troutofrange.jpg"; //
var umZoomIcon		= "images/zoomicon.gif";
var umWikiPageIcon	= "images/iconwikipage.png";
var umUpArrowIcon	= "images/uparrows.gif";
var umDownArrowIcon	= "images/downarrows.gif";
var umBasePath		= "/";
var umGameDir		= "";
var umGamePath		= umBasePath + umGameDir + "/";
var umTilePathPrefix = "/zoom";

	// Live paths
var umImagePath		= "//tamrielrebuilt.uesp.net/trmap/";
var umMapURL		= "//tamrielrebuilt.uesp.net/trmap/";

	// Default script locations
var umGetMapURL = "../getmaplocs.php";
var umSetMapURL = "../setmaplocs.php";

	// Map properties and constants

var umMapDefaultCenter		= new google.maps.LatLng(89.8640441895, -179.7280883789);
var umMapBounds				= new google.maps.LatLngBounds(new google.maps.LatLng(89.7418213, -179.994507), new google.maps.LatLng(89.9972534, -179.478149));
var umMapDefaultZoom		= 11;
var umMapLinkZoomedValue	= 16;
var umMinMapZoom			= 10;
var umMaxMapZoom			= 17;
var umBaseMapZoom			= 16;		//zoom level where one tile = one game cell *Must be 16 due to umConvertXLocToLng and related equations in map2.js
var umCellSize				= 8192.0;
var umNumMapTilesX			= 96;  //Maximum # of tiles in X direction -Fixed 
var umNumMapTilesY			= 96;  //Maximum # of tiles in Y direction
var umCellOffsetX			= 44.0; // Used to get 0,0 location on maps (in BaseMapZoom )
var umCellOffsetY			= 34.0; // Used to get 0,0 location on maps (in BaseMapZoom )
var umLocationIDCounter		= 0;
var umNoInitialGetMarkers	= false;
var umWikiNameSpace			= "Morrowind";
var umGamePrefix			= "vvardenfell";
var umMapImagePrefix		= "TR";
var umRegionName			= "Vvardenfell";
var umMinCellX				= -43; // Range for drawing GRID (MinCellX,Y MaxCellX,Y)
var umMinCellY				= -60; //
var umMaxCellX				= 51;  //
var umMaxCellY				= 33;  //
var umCellGridLabelSpacing	= 5;	// Spacing of cell grid labels, don't make too small (<10) or map performance is slow
var umMinZoomCellLabels		= 13;	// Zoom level the cell labels will be shown if enabled
var umEnableNightMap		= false;
var umEnableSimpleMap		= false;

var umEncodeURI = false;


	// Get map marker icon image file
function umGetMapMarkerIcon(MarkerType)
{
	var Icon = "Unknown"
	switch (MarkerType) {
		case 0: Icon = "None"; break;
		case 1: Icon = "City"; break;
		case 2: Icon = "Town"; break;
		case 3: Icon = "Village"; break;
		case 4: Icon = "Settlements"; break;
		case 5: Icon = "Citadel"; break;
		case 6: Icon = "House"; break;
		case 7: Icon = "Ashlander Camp"; break;
		case 8: Icon = "Fort"; break;
		case 9: Icon = "Dunmer-Stronghold"; break;
		case 10: Icon = "Daedric-Ruin"; break;
		case 11: Icon = "Dwemer-Ruin"; break;
		case 12: Icon = "Ancestral Tomb"; break;
		case 13: Icon = "Barrow"; break;
		case 14: Icon = "Velothi Tower"; break;
		case 15: Icon = "Grotto"; break;
		case 16: Icon = "Landmark"; break;
		case 17: Icon = "Outpost"; break;
		case 18: Icon = "Telvanni Tower"; break;
		case 19: Icon = "Temple Shrine"; break;
		case 20: Icon = "Temple"; break;
		case 30: Icon = "Cave"; break;
		case 31: Icon = "Mine"; break;
		case 32: Icon = "Diamond-Mine"; break;
		case 33: Icon = "Ebony-Mine"; break;
		case 34: Icon = "Egg-Mine"; break;
		case 35: Icon = "Glass-Mine"; break;
		case 40: Icon = "Guilds"; break;
		case 41: Icon = "Fighters-Guild"; break;
		case 42: Icon = "Mages-Guild"; break;
		case 43: Icon = "Imperial-Cult"; break;
		case 44: Icon = "Morag-Tong"; break;
		case 45: Icon = "Thieves Guild"; break;
		case 50: Icon = "House-Hlaalu"; break;
		case 51: Icon = "House-Redoran"; break;
		case 52: Icon = "House-Telvanni"; break;
		case 60: Icon = "Shops"; break;
		case 61: Icon = "Alchemist"; break;
		case 62: Icon = "Bookseller"; break;
		case 63: Icon = "Clothier"; break;
		case 64: Icon = "Enchanter"; break;
		case 65: Icon = "Healer"; break;
		case 66: Icon = "Pawnbroker"; break;
		case 67: Icon = "Smith"; break;
		case 68: Icon = "Spellmaker"; break;
		case 69: Icon = "Slave Market"; break;
		case 70: Icon = "Tavern"; break;
		case 71: Icon = "Trader"; break;
		case 80: Icon = "Transportation"; break;
		case 81: Icon = "Gondolier"; break;
		case 82: Icon = "Ship"; break;
		case 83: Icon = "Silt-Strider"; break;
		case 100: Icon = "Miscellaneous"; break;
		case 101: Icon = "Blank"; break;
		case 102: Icon = "Corpse"; break;
		case 103: Icon = "Creature"; break;
		case 104: Icon = "Door"; break;
		case 105: Icon = "Geographical"; break;
		case 106: Icon = "Guard-Tower"; break;
		case 107: Icon = "Loot"; break;
		case 108: Icon = "Monument"; break;
		case 109: Icon = "NPC"; break;
		case 110: Icon = "Plant"; break;
		case 111: Icon = "Propylon"; break;
		case 112: Icon = "Ruins"; break;
		default: Icon = "Blank";
	}

	return umImagePath + "icons/iconMW" + Icon + ".gif";
}

	// Get a map marker description text
function umGetMapMarkerType(MarkerType)
{
	switch(MarkerType) {
		case 0: return "None";
		case 1: return "City";
		case 2: return "Town";
		case 3: return "Village";
		case 4: return "Settlement";
		case 5: return "Citadel";
		case 6: return "House";
		case 7: return "Ashlander Camp";
		case 8: return "Imperial Fort";
		case 9: return "Dunmer Stronghold";
		case 10: return "Daedric Shrine";
		case 11: return "Dwemer Ruin";
		case 12: return "Ancestral Tomb";
		case 13: return "Nordic Barrow";
		case 14: return "Velothi Tower";
		case 15: return "Grotto";
		case 16: return "Landmark";
		case 17: return "Outpost";
		case 18: return "Telvanni Tower";
		case 19: return "Temple Shrine";
		case 20: return "Temple";
		case 30: return "Cave";
		case 31: return "Mine";
		case 32: return "Diamond Mine";
		case 33: return "Ebony Mine";
		case 34: return "Egg Mine";
		case 35: return "Glass Mine";
		case 40: return "Guilds";
		case 41: return "Fighters Guild";
		case 42: return "Mages Guild";
		case 43: return "Imperial Cult";
		case 44: return "Morag Tong";
		case 45: return "Thieves Guild";
		case 50: return "House Hlaalu";
		case 51: return "House Redoran";
		case 52: return "House Telvanni";
		case 60: return "Shop";
		case 61: return "Alchemist";
		case 62: return "Bookseller";
		case 63: return "Clothier";
		case 64: return "Enchanter";
		case 65: return "Healer";
		case 66: return "Pawnbroker";
		case 67: return "Smith";
		case 68: return "Spellmaker";
		case 69: return "Slave Market";
		case 70: return "Tavern";
		case 71: return "Trader";
		case 80: return "Transportation";
		case 81: return "Gondolier";
		case 82: return "Ship";
		case 83: return "Silt-Strider";
		case 100: return "Miscellaneous";
		case 101: return "Blank";
		case 102: return "Corpse";
		case 103: return "Creature";
		case 104: return "Door";
		case 105: return "Geographical";
		case 106: return "Guard-Tower";
		case 107: return "Loot";
		case 108: return "Monument";
		case 109: return "NPC";
		case 110: return "Plant";
		case 111: return "Propylon";
		case 112: return "Ruins";
		default: return "Other";
	}

	return "Other";
}


