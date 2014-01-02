	//Define the map game name
var umGame = "db";

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
var umMapURL		= "http://dbmap.uesp.net/";

	// Default script locations
var umGetMapURL = "../getmaplocs.php";
var umSetMapURL = "../setmaplocs.php";

	// Map properties and constants
var umMapDefaultCenter		= new google.maps.LatLng(89.68, -179.68);
var umMapBounds				= new google.maps.LatLngBounds(new google.maps.LatLng(89.618, -179.808), new google.maps.LatLng(89.728, -179.533));
var umMapDefaultZoom		= 13;
var umMapLinkZoomedValue	= 16;
var umMinMapZoom			= 10;
var umMaxMapZoom			= 17;
var umBaseMapZoom			= 17;		// this is the zoom level at which one tile = one game cell
var umCellSize				= 4096.0;
var umNumMapTilesX			= 256;
var umNumMapTilesY			= 512;
var umCellOffsetX			= 45.0;		// offset at BaseMapZoom
var umCellOffsetY			= 129.0;	// offset at BaseMapZoom
var umLocationIDCounter		= 0;
var umNoInitialGetMarkers	= false;
var umWikiNameSpace			= "Dragonborn";
var umGamePrefix			= "solstheim";
var umMapImagePrefix		= "solstheim";
var umRegionName			= "Dragonborn";
var umMinCellX				= -10;
var umMinCellY				= -10;
var umMaxCellX				= 40;
var umMaxCellY				= 30;
var umCellGridLabelSpacing	= 10;	// Spacing of cell grid labels, don't make too small (<10) or map performance is slow
var umMinZoomCellLabels		= 13;	// Zoom level the cell labels will be shown if enabled
var umEnableNightMap		= false;
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
 		case 43:	Icon = "MarkarthCapitol"; break;
 		case 44:	Icon = "MarkarthCapitol"; break;
 		case 45:	Icon = "WinterholdCastle"; break;
 		case 46:	Icon = "WinterholdCapitol"; break;
 		case 47:	Icon = "MorthalCastle"; break;
 		case 48:	Icon = "MorthalCapitol"; break;
 		case 49:	Icon = "FalkreathCastle"; break;
 		case 50:	Icon = "FalkreathCapitol"; break;
 		case 51:	Icon = "DawnstarCastle"; break;
 		case 52:	Icon = "DawnstarCapitol"; break;
			//New Dragonborn marker types
		case 53:	Icon = "TempleMiraak"; break;
		case 54:	Icon = "RavenRock"; break;
		case 55:	Icon = "StandingStone"; break;
		case 56:	Icon = "TelvanniTower"; break;
		case 57:	Icon = "ToSkyrim"; break;
		case 58:	Icon = "ToSolstheim"; break;
		case 59:	Icon = "CastleKarstaag"; break;

		case 60:        Icon = "Door"; break;
		case 61:        Icon = "Shrine"; break;
		case 62:        Icon = "Other"; break;
		case 63:        Icon = "DragonLair"; break;
		case 100:
		default: Icon = "Other";
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
 		case 7:		Icon = "Nordic Ruins"; break;
 		case 8:		Icon = "Dwemer Ruins"; break;
 		case 9:		Icon = "Shipwreck"; break;
 		case 10:	Icon = "Grove"; break;
 		case 11:	Icon = "Landmark"; break;
 		case 12:	Icon = "Dragon Lair"; break;
 		case 13:	Icon = "Farm"; break;
 		case 14:	Icon = "Wood Mill"; break;
 		case 15:	Icon = "Mine"; break;
 		case 16:	Icon = "Imperial Camp"; break;
 		case 17:	Icon = "Stormcloak Camp"; break;
 		case 18:	Icon = "Doomstone"; break;
 		case 19:	Icon = "Wheat Mill"; break;
 		case 20:	Icon = "Smelter"; break;
 		case 21:	Icon = "Stable"; break;
 		case 22:	Icon = "Imperial Tower"; break;
 		case 23:	Icon = "Clearing"; break;
 		case 24:	Icon = "Pass"; break;
 		case 25:	Icon = "Altar"; break;
 		case 26:	Icon = "Rock"; break;
 		case 27:	Icon = "Lighthouse"; break;
 		case 28:	Icon = "Orc Stronghold"; break;
 		case 29:	Icon = "Giant Camp"; break;
 		case 30:	Icon = "Shack"; break;
 		case 31:	Icon = "Nordic Tower"; break;
 		case 32:	Icon = "Nordic Dwelling"; break;
 		case 33:	Icon = "Dock"; break;
 		case 34:	Icon = "Shrine"; break;
 		case 35:	Icon = "Riften Castle"; break;
 		case 36:	Icon = "Riften Capitol"; break;
 		case 37:	Icon = "Windhelm Castle"; break;
 		case 38:	Icon = "Windhelm Capitol"; break;
 		case 39:	Icon = "Whiterun Castle"; break;
 		case 40:	Icon = "Whiterun Capitol"; break;
 		case 41:	Icon = "Solitude Castle"; break;
 		case 42:	Icon = "Solitude Capitol"; break;
 		case 43:	Icon = "Markarth Castle"; break;
 		case 44:	Icon = "Markarth Capitol"; break;
 		case 45:	Icon = "Winterhold Castle"; break;
 		case 46:	Icon = "Winterhold Capitol"; break;
 		case 47:	Icon = "Morthal Castle"; break;
 		case 48:	Icon = "Morthal Capitol"; break;
 		case 49:	Icon = "Falkreath Castle"; break;
 		case 50:	Icon = "Falkreath Capitol"; break;
 		case 51:	Icon = "Dawnstar Castle"; break;
 		case 52:	Icon = "Dawnstar Capitol"; break;
			//Dragonborn marker types
		case 53:	Icon = "Temple"; break;
		case 54:	Icon = "Town"; break;
		case 55:	Icon = "Stone"; break;
		case 56:	Icon = "Tower"; break;
		case 57:	Icon = "Teleport"; break;
		case 58:	Icon = "Teleport"; break;
		case 59:	Icon = "Castle"; break;

		case 60:        Icon = "Door"; break;
		case 61:        Icon = "Shrine"; break;
		case 62:        Icon = "Ore Vein"; break;
		case 63:        Icon = "Dragon Mound"; break;
		case 100:
		default: return "Other";
	}

	return Icon;
}

