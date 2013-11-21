	// Global map objects
var umMap;
var umCustomMapType;
var umMapTileLayer;
var umLocations = [];
var umCellGridLines = [];
var umCellGridLabels = [];
var umCreatedCellGrid = false;
var umLastGridLabelUpdate = false;
var umWaitingForReponse = 0;
var umSkipUpdate = false;


	// Define the custom options for the game map
var umMapTypeOptions = 
{
		getTileUrl:	umGetMapTile,
		tileSize:	new google.maps.Size(256, 256),
		maxZoom:	umMaxMapZoom,
		minZoom:	umMinMapZoom,
		name:		"Day",
};

	// Create the game map type object
var umCustomMapType = new google.maps.ImageMapType(umMapTypeOptions);
umCustomMapType.projection = new CEuclideanProjection();

var umNightMapTypeOptions = 
{
		getTileUrl:	umGetNightMapTile,
		tileSize:	new google.maps.Size(256, 256),
		maxZoom:	umMaxMapZoom,
		minZoom:	umMinMapZoom,
		name:		"Night",
};

var umCustomNightMapType = new google.maps.ImageMapType(umNightMapTypeOptions);
umCustomNightMapType.projection = new CEuclideanProjection();

var umSimpleMapTypeOptions = 
{
		getTileUrl:	umGetSimpleMapTile,
		tileSize:	new google.maps.Size(256, 256),
		maxZoom:	umMaxMapZoom,
		minZoom:	umMinMapZoom,
		name:		"Simple",
};

var umCustomSimpleMapType = new google.maps.ImageMapType(umSimpleMapTypeOptions);
umCustomSimpleMapType.projection = new CEuclideanProjection();

	// Main map setup function
function umSetupMap() {
	
	var EnableMapControl = umEnableNightMap || umEnableSimpleMap;
	var MapTypes = [ "Day"];
	
	if (umEnableNightMap) MapTypes.push("Night");
	if (umEnableSimpleMap) MapTypes.push("Simple");
	
	var mapOptions = {
			center:	umMapDefaultCenter,
			zoom:	umMapDefaultZoom,
			streetViewControl: false,
			disableDoubleClickZoom: true,
			
			overviewMapControl: true,		// No current way of adjusting zoom level of overview map
			overviewMapControlOptions: {
				position: google.maps.ControlPosition.BOTTOM_RIGHT,
				opened: false
			},
			
			mapTypeControl: EnableMapControl,
			mapTypeControlOptions: {
				mapTypeIds: MapTypes
			},

			panControl: true,
			panControlOptions: {
				position: google.maps.ControlPosition.TOP_RIGHT
			},

			zoomControl: true,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.LARGE,
				position: google.maps.ControlPosition.TOP_RIGHT
			},

			scaleControl: false,
			scaleControlOptions: {
				position: google.maps.ControlPosition.TOP_LEFT
			},
	};
	
	umMap = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	umMap.mapTypes.set(umWikiNameSpace, umCustomMapType);
	umMap.setMapTypeId(umWikiNameSpace);
	
	umMap.mapTypes.set("Day", umCustomMapType);
	if (umEnableSimpleMap) umMap.mapTypes.set("Simple", umCustomSimpleMapType);
	if (umEnableNightMap)  umMap.mapTypes.set("Night",  umCustomNightMapType);
	umMap.setMapTypeId('Day');
	
	var InputValues = umGetInputValues();
	
	google.maps.event.addListener(umMap,'bounds_changed', function() { 
		umUpdateDiffMarkers(); 
		umUpdateCellGridLabelsZoom(); 
	} );
	
	google.maps.event.addListener(umMap,'center_changed', function() {
		umCheckMapBounds();
	});
	
	google.maps.event.addListener(umMap,'zoom_changed', function() { 
		umUpdateCellGridLabelsZoom();
	});
	
	google.maps.event.addListener(umMap,'dblclick', umCenterMapOnClick);
	
	google.maps.event.addListenerOnce(umMap, 'idle', function(){
		umUpdateMapFromInput(InputValues);
		umUpdateShowHideCellGrid();
		umGetMarkers();
		umUpdateLink();
		umSetupEditMap();
	});
	
}


function umCenterMapOnClick (MouseEvent)
{
	if (MouseEvent.latLng !== undefined && MouseEvent.latLng !== null) umMap.panTo(MouseEvent.latLng);
}


	// Creates the grid of cell lines
function umCreateCellGrid(ShowGrid)
{
	var X;
	var Y;
	var MapX;
	var MapY;
	var CellX;
	var CellY;
	var StartLatLng;
	var EndLatLng;
	var LinePoints;
	var LineOptions;
	var Line;
	
	ShowGrid = typeof ShowGrid !== 'undefined' ? ShowGrid : umMapState.ShowCells;
	
	var DefaultLineOptions = {
		strokeColor :	"#ffff00",
		strokeOpacity :	0.5,
		strokeWeight :	1,
		clickable :		false,
		draggable :		false,
		editable :		false,
		geodesic :		false,
		map :			umMap,
		visible :		true,
		zIndex :		100,
	};

	var DefaultLabelOptions = {
		boxStyle: {
			border:		"none",
			textAlign:	"left",
			fontSize:	"8pt",
			color:		"#ffff00",
			opacity:	0.5,
			zIndex:		500,
		},
		disableAutoPan :	true,
		pixelOffset :		new google.maps.Size(0, -2),
		closeBoxURL :		"",
		isHidden :			true,
		pane :				"mapPane",
		enableEventPropagation : true,
	};

		// Create the vertical cell grid lines
	for (CellX = umMinCellX; CellX <= umMaxCellX; CellX++) {
		X = CellX * umCellSize;
		MapX = umConvertXLocToLng(X);
		StartLatLng = new google.maps.LatLng(umMapBounds.getSouthWest().lat(), MapX);
		EndLatLng = new google.maps.LatLng(umMapBounds.getNorthEast().lat(), MapX);
		LinePoints = new google.maps.MVCArray([StartLatLng, EndLatLng]);
		
		LineOptions = DefaultLineOptions;
		LineOptions.path = LinePoints;
		Line = new google.maps.Polyline(LineOptions);
		
		umCellGridLines.push(Line);
	}
	
		// Create the horizontal cell grid lines
	for (CellY = umMinCellY; CellY <= umMaxCellY; CellY++) {
		Y = CellY * umCellSize;
		MapY = umConvertYLocToLat(Y);
		StartLatLng = new google.maps.LatLng(MapY, umMapBounds.getSouthWest().lng());
		EndLatLng = new google.maps.LatLng(MapY, umMapBounds.getNorthEast().lng());
		LinePoints = new google.maps.MVCArray([StartLatLng, EndLatLng]);
		
		LineOptions = DefaultLineOptions;
		LineOptions.path = LinePoints;
		Line = new google.maps.Polyline(LineOptions);
		
		umCellGridLines.push(Line);
	}
	
		// Create the cell labels
	for (CellY = Math.ceil(umMinCellY/umCellGridLabelSpacing)*umCellGridLabelSpacing; CellY <= umMaxCellY; CellY += umCellGridLabelSpacing) {
		Y = (CellY + 1) * umCellSize;
		MapY = umConvertYLocToLat(Y);
		
		for (CellX = Math.ceil(umMinCellX/umCellGridLabelSpacing)*umCellGridLabelSpacing; CellX <= umMaxCellX; CellX += umCellGridLabelSpacing) {
			X = CellX * umCellSize;
			MapX = umConvertXLocToLng(X);
			var LabelLatLng = new google.maps.LatLng(MapY, MapX);
			
			var LabelOptions = DefaultLabelOptions;
			LabelOptions.position = LabelLatLng;
			LabelOptions.content  = CellX + "," + (CellY);
			var CellLabel = new InfoBox(LabelOptions);
			CellLabel.open(umMap);
			
			umCellGridLabels.push(CellLabel);
		}
	}
	
	umCreatedCellGrid = true;
}


	// Changes the class name of a DOM object
function umChangeClass(object, oldClass, newClass)
{
		// remove
	var regExp = new RegExp('(?:^|\\s)' + oldClass + '(?!\\S)', 'g');
	object.className = object.className.replace( regExp, '');
	
		// replace
	//var regExp = new RegExp('(?:^|\\s)' + oldClass + '(?!\\S)', 'g');
	//object.className = object.className.replace( regExp , newClass );
	
		// add
	object.className += " " + newClass;
}


	// UI onClick() event
function umOnShowHideCellGrid(Element)
{
	umMapState.ShowCells = !umMapState.ShowCells;
	umUpdateShowHideCellGrid(Element);
	umUpdateLink();
}


	// Updates the cell grid UI state
function umUpdateShowHideCellGrid(Element)
{
	Element = typeof Element !== 'undefined' ? Element : document.getElementById('umShowCellGrid');
	
	umShowHideCellGrid(umMapState.ShowCells);
	
	if (Element === null) return;
	
	if (umMapState.ShowCells) {
		Element.innerHTML = "Hide Cell Grid";
		umChangeClass(Element, "umCellGridHidden", "umCellGridVisible");
	}
	else {
		Element.innerHTML = "Show Cell Grid";
		umChangeClass(Element, "umCellGridVisible", "umCellGridHidden");
	}
	
}


	// Show/hide the grid labels based on current map zoom level
function umUpdateCellGridLabelsZoom()
{
	var ShowGridLabel = umMapState.ShowCells && umMapState.Zoom >= umMinZoomCellLabels;
	if (umLastGridLabelUpdate == ShowGridLabel) return;
	
	for (var i = 0; i < umCellGridLabels.length; i++) {
		if (ShowGridLabel)
			umCellGridLabels[i].show();
		else
			umCellGridLabels[i].hide();
	}
	
	umLastGridLabelUpdate = ShowGridLabel;
}


	// Show or hide the cell grid and labels
function umShowHideCellGrid(ShowGrid)
{
	if (!umCreatedCellGrid) {
		if (!ShowGrid) return;
		umCreateCellGrid(ShowGrid);
	}
	
	for (var i = 0; i < umCellGridLines.length; i++) {
		umCellGridLines[i].setVisible(ShowGrid);
	}
	
	umUpdateCellGridLabelsZoom();
}


	// Parses input parameters and returns them in an array
function umGetInputValues()
{
	var InputValues = [];
	
	var RawInputParams = umSplitURLParams();
	
	InputValues.lat = umGetURLParam('lat');
	InputValues.lng = umGetURLParam("lng");
	InputValues.zoom = umGetURLParam("zoom");
	InputValues.locx = umGetURLParam("locx");
	
	if (!InputValues.locx || InputValues.locx === "") {
		InputValues.locx = umGetURLParam("oblocx");
	}
	
	InputValues.locy = umGetURLParam("locy");
	
	if (!InputValues.locy || InputValues.locy === "") {
		InputValues.locy = umGetURLParam("oblocy");
	}
	
	InputValues.cellx = umGetURLParam("cellx");
	InputValues.celly = umGetURLParam("celly");
	InputValues.search = umGetURLParam("search");
	InputValues.startsearch = umGetURLParam("startsearch");
	InputValues.centeron = umGetURLParam("centeron");
	InputValues.showresults = umGetURLParam("showresults");
	InputValues.showcells = umGetURLParam('showcells');
	InputValues.showsearch = umGetURLParam('showsearch');
	InputValues.showdisabled = umGetURLParam('showdisabled');
	InputValues.showinfo = umGetURLParam('showinfo');
	InputValues.disablecontrols = umGetURLParam('disablecontrols');
	InputValues.edit = umGetURLParam('edit');
	InputValues.cellresource = umGetURLParam('cellresource');
	
	return InputValues;
}


	// Unsures the map stays in bounds when moving/zooming around
function umCheckMapBounds() 
{
	allowedBounds = umMapBounds;
	
	if( !allowedBounds.contains(umMap.getCenter()) ) {
		var C = umMap.getCenter();
		var X = C.lng();
		var Y = C.lat();

		var AmaxX = allowedBounds.getNorthEast().lng();
		var AmaxY = allowedBounds.getNorthEast().lat();
		var AminX = allowedBounds.getSouthWest().lng();
		var AminY = allowedBounds.getSouthWest().lat();

		if (X < AminX) {X = AminX;}
		if (X > AmaxX) {X = AmaxX;}
		if (Y < AminY) {Y = AminY;}
		if (Y > AmaxY) {Y = AmaxY;}

		umMap.setCenter(new google.maps.LatLng(Y,X));
	}
}


	// Convert a game location to a map longitude
function umConvertXLocToLng(X) 
{
	var Lng = -180.0 + ((X/umCellSize + umCellOffsetX)/65536.0 * 360.0);
	return Lng;
}


	// Convert a game location to a map latitude
function umConvertYLocToLat(Y) 
{
	var Lat = 90.0 - ((umCellOffsetY - Y/umCellSize)/65536.0 * 180.0);
	return Lat;
}


	// Convert a game location to a map latitude/longitude
function umConvertLocToLatLng(X, Y) 
{
	var Lng = -180.0 + ((X/umCellSize + umCellOffsetX)/65536.0 * 360.0);
	var Lat = 90.0 - ((umCellOffsetY - Y/umCellSize)/65536.0 * 180.0);
	return new google.maps.LatLng(Lat, Lng);
}


	// Convert a longitude to an game X location
function umConvertLngToLocX(Lng) 
{
	if (Lng > 0) Lng = -180.0;
	if (Lng < umMapBounds.getSouthWest().lng()) Lng = umMapBounds.getSouthWest().lng();
	if (Lng > umMapBounds.getNorthEast().lng()) Lng = umMapBounds.getNorthEast().lng();
	return (((Lng + 180.0) * 65536.0 / 360.0 - umCellOffsetX) * umCellSize);
}


	// Convert a latitude to a game Y location
function umConvertLatToLocY(Lat) 
{
	if (Lat < 0) Lat = 90.0;
	if (Lat < umMapBounds.getSouthWest().lat()) Lat = umMapBounds.getSouthWest().lat();
	if (Lat > umMapBounds.getNorthEast().lat()) Lat = umMapBounds.getNorthEast().lat();
	return (((90.0 - Lat) * 65536.0 / 180.0  - umCellOffsetY) * - umCellSize);
}


	// Custom map image tile function
function umGetMapTile(coord, zoom)
{
	if (zoom >= umMinMapZoom && zoom <= umMaxMapZoom) {
		var MaxX = Math.floor(umNumMapTilesX/Math.pow(2, umBaseMapZoom - zoom));
		var MaxY = Math.floor(umNumMapTilesY/Math.pow(2, umBaseMapZoom - zoom));

		if (coord.x < MaxX && coord.y < MaxY && coord.x >= 0 && coord.y >= 0) {
			return umImagePath + umGameDir + umTilePathPrefix + zoom + "/" + umMapImagePrefix +  "-" + coord.x + "-" + coord.y + "-" + zoom + ".jpg";
		}
	}

	return umImagePath + umOorMapTile;
}


function umGetNightMapTile(coord, zoom)
{
	if (zoom >= umMinMapZoom && zoom <= umMaxMapZoom) {
		var MaxX = Math.floor(umNumMapTilesX/Math.pow(2, umBaseMapZoom - zoom));
		var MaxY = Math.floor(umNumMapTilesY/Math.pow(2, umBaseMapZoom - zoom));

		if (coord.x < MaxX && coord.y < MaxY && coord.x >= 0 && coord.y >= 0) {
			return umImagePath + umGameDir + "/night/zoom" + zoom + "/" + umMapImagePrefix +  "-" + coord.x + "-" + coord.y + "-" + zoom + ".jpg";
		}
	}

	return umImagePath + umOorNightMapTile;
}


function umGetSimpleMapTile(coord, zoom)
{
	if (zoom >= umMinMapZoom && zoom <= umMaxMapZoom) {
		var MaxX = Math.floor(umNumMapTilesX/Math.pow(2, umBaseMapZoom - zoom));
		var MaxY = Math.floor(umNumMapTilesY/Math.pow(2, umBaseMapZoom - zoom));

		if (coord.x < MaxX && coord.y < MaxY && coord.x >= 0 && coord.y >= 0) {
			return umImagePath + umGameDir + "/simple/zoom" + zoom + "/" + umMapImagePrefix +  "-" + coord.x + "-" + coord.y + "-" + zoom + ".jpg";
		}
	}

	return umImagePath + umOorSimpleMapTile;
}


	// Updates the 'linkto' anchor on the page
function umUpdateLink() 
{
	umMapState.Update(umMap);
	
	var newLinkTo = umCreateLink(umMap.getCenter());
	var LinkTo    = document.getElementById("umMapLink");
	if (LinkTo) LinkTo.href = newLinkTo;
	
	return newLinkTo;
}


	// Create a map link using a location and custom zoom level
function umCreateLinkZoom(Loc, Zoom) 
{
	var newLinkTo = umMapURL + '?locx=' + umConvertLngToLocX(Loc.lng()).toFixed(0) + '&locy=' + umConvertLatToLocY(Loc.lat()).toFixed(0) + '&zoom=' + Zoom;

	if (umMapState.HasSearch()) {
		newLinkTo += "&search=" + escape(umMapState.SearchText);
		if (umMapState.StartRow > 0) newLinkTo += "&startsearch=" + escape(umMapState.StartRow);
	}
	
	if (umMapState.ShowResults		!= umDefaultShowResults)		newLinkTo += "&showresults=" + umMapState.ShowResults;
	if (umMapState.ShowCells		!= umDefaultShowCells)			newLinkTo += "&showcells=" + umMapState.ShowCells;
	if (umMapState.ShowEdit			!= umDefaultShowEdit)			newLinkTo += "&edit=" + umMapState.ShowEdit;
	if (umMapState.ShowSearch		!= umDefaultShowSearch)			newLinkTo += "&showsearch=" + umMapState.ShowSearch;
	if (umMapState.DisableControls	!= umDefaultDisableControls)	newLinkTo += "&disablecontrols=" + umMapState.DisableControls;
	if (umMapState.ShowDisabled		!= umDefaultShowDisabled)		newLinkTo += "&showdisabled=" + umMapState.ShowDisabled;
	if (umMapState.ShowInfo			!= umDefaultShowInfo)			newLinkTo += "&showinfo=" + umMapState.ShowInfo;
	if (umMapState.CellResource		!= umDefaultCellResource)		newLinkTo += "&cellresource=" + umMapState.CellResource;
	
	return newLinkTo;
}	


	// Create a map link using a custom location and the current zoom level
function umCreateLink(Loc) 
{
	return umCreateLinkZoom(Loc, umMap.getZoom());
}


function umSplitURLParams()
{
	var strHref = location.search.substring(1).toLowerCase();
	var Params = strHref.split("&");
	var ResultParams = [];
	
	for (var i = 0; i < Params.length; i++ ) {
		if ( Params[i].indexOf("=") > -1 ) {
			var aParam = Params[i].split("=");
			ResultParams[aParam[0]] = aParam[1];
		}
		else {
			ResultParams[Params[i]] = '';
		}
	}
	
	return ResultParams;
}


	// Retrieve a specific input parameter
function umGetURLParam(strParamName) 
{
	var strReturn = "";
	var strHref = location.search.substring(1);
	var aQueryString = strHref.split("&");
		
	for ( var iParam = 0; iParam < aQueryString.length; iParam++ ){
		if ( aQueryString[iParam].indexOf(strParamName + "=") === 0 ){
			var aParam = aQueryString[iParam].split("=");
			strReturn = aParam[1];
			break;
		}
	}
	
	return strReturn;
}


	// Updates all locations when the map moves
function umUpdateMarkers() 
{
	if (umSkipUpdate) return;
	umUpdateLink();

	if (umMapState.HasSearch()) return;
	if (umWaitingForReponse) return;

	umMapState.ResetSearch();
	umDeleteLocations();

	umGetMarkers(umMapState);
}


	// Only update markers in "new" regions of the map
function umUpdateDiffMarkers() 
{
	var SWX;
	var NEX;
	var SWY;
	var NEY;
	
	if (umSkipUpdate) return;

	if (umNoInitialGetMarkers) {
		umNoInitialGetMarkers = false;
		umMapState.Update(umMap);
		umGetMarkers(umMapState);
		return;
	}

	var OldBounds = umMapState.MapBounds;
	var OldZoom = umMapState.Zoom;

	var OldSWX = umConvertLngToLocX(OldBounds.getSouthWest().lng());
	var OldSWY = umConvertLatToLocY(OldBounds.getSouthWest().lat());
	var OldNEX = umConvertLngToLocX(OldBounds.getNorthEast().lng());
	var OldNEY = umConvertLatToLocY(OldBounds.getNorthEast().lat());

		// Update link and current map state
	umUpdateLink();

	if (umMapState.MapBounds === null) umMapState.Update(umMap);

	var NewSWX = umConvertLngToLocX(umMapState.MapBounds.getSouthWest().lng());
	var NewSWY = umConvertLatToLocY(umMapState.MapBounds.getSouthWest().lat());
	var NewNEX = umConvertLngToLocX(umMapState.MapBounds.getNorthEast().lng());
	var NewNEY = umConvertLatToLocY(umMapState.MapBounds.getNorthEast().lat());
	
	if (umMapState.HasSearch()) return;

	umDeleteLocationsFromArea(umMapState.MapBounds, umMapState.Zoom);

	if (umMapState.Zoom > OldZoom) {
		umAddMarkersBoundsZoom(umMapState, NewSWX, NewSWY, NewNEX, NewNEY, OldZoom);	
	}

		// Get more locations on the west side
	if (NewSWX < OldSWX) {
		SWX = NewSWX;
		NEX = OldSWX;
		SWY = NewSWY;
		NEY = NewNEY;
		umAddMarkersBounds(umMapState, SWX, SWY, NEX, NEY);
	}

		// Get more locations on the east side
	if (NewNEX > OldNEX) {
		SWX = OldNEX;
		NEX = NewNEX;
		SWY = NewSWY;
		NEY = NewNEY;
		umAddMarkersBounds(umMapState, SWX, SWY, NEX, NEY);
	}

		// Get more locations on the north side
	if (NewNEY > OldNEY) {
		SWX = NewSWX;
		NEX = NewNEX;
		SWY = OldNEY;
		NEY = NewNEY;
		umAddMarkersBounds(umMapState, SWX, SWY, NEX, NEY);
	}

		// Get more locations on the south side
	if (NewSWY < OldSWY) {
		SWX = NewSWX;
		NEX = NewNEX;
		SWY = NewSWY;
		NEY = OldSWY;
		umAddMarkersBounds(umMapState, SWX, SWY, NEX, NEY);
	}
	
}


	// Delete all locations no longer in the give map area
function umDeleteLocationsFromArea(Bounds, Zoom) 
{
	var Index;

	for (Index = umLocations.length-1; Index >= 0 ; --Index)
	{
		if (umLocations[Index].ID < 0) continue; // Ignore locations in the process of being created

		if (!Bounds.contains(umLocations[Index].MapPoint) || umLocations[Index].DisplayLevel > Zoom) {
			umDeleteLocation(umLocations[Index], Index);
		}
	}
	
	//alert(umMapState.NumResults + " of " + umMapState.TotalResults);
}

	// Uses an XmlHttpRequest to get map locations using the input information
function umAddMarkersBounds(MapState, SWX, SWY, NEX, NEY) 
{
	var Request = new XMLHttpRequest();

	QueryStr = umMakeGetQueryBounds(MapState, SWX, SWY, NEX, NEY);
	Request.open('GET', QueryStr, true);

	Request.onreadystatechange = function () {
		if (Request.readyState == 4) {
			umParseAddMapRequest(Request);
		}
	};

	umWaitingForReponse = 1;
	Request.send(null);
}


	// Uses an XmlHttpRequest to get map locations using the input information
function umAddMarkersBoundsZoom(MapState, SWX, SWY, NEX, NEY, MinZoom) 
{
	var Request = new XMLHttpRequest();

	QueryStr = umMakeGetQueryBounds(MapState, SWX, SWY, NEX, NEY);
	QueryStr += "&minzoom=" + escape(MinZoom);
	Request.open('GET', QueryStr, true);

	Request.onreadystatechange = function () {
		if (Request.readyState == 4) {
			umParseAddMapRequest(Request);
		}
	};

	umWaitingForReponse = 1;
	Request.send(null);
}


	//Parse a response from an add location request
function umParseAddMapRequest(Request) 
{
	var xmlDoc = Request.responseXML;

	var Locations = xmlDoc.documentElement.getElementsByTagName("location");
	var AddedCount = 0;

	if (Locations.length) {
		AddedCount = umParseMapLocations(xmlDoc, Locations);
	}

	var RowCountData = xmlDoc.documentElement.getElementsByTagName("rowcount");
	var TotalRowCount = 0;
	var RowCount = 0;
	var StartRow = 0;

	if (RowCountData.length > 0) {
		TotalRowCount	= parseInt(RowCountData[0].getAttribute("totalrows"), 10);
		RowCount		= parseInt(RowCountData[0].getAttribute("rowcount"), 10);
		StartRow		= parseInt(RowCountData[0].getAttribute("startrow"), 10);	
	}
	
	umMapState.StartRow		= StartRow;
	umMapState.TotalResults	+= TotalRowCount - (RowCount - AddedCount);
	umMapState.NumResults	+= AddedCount;

	umUpdateResultsText();
}


	//Sets the current results header text
function umUpdateResultsText() 
{
	var Header = document.getElementById("umSearchResultsHeader");
	var Text;

	if (!Header) return;

	if (umLocations.length > 0) {
		if (umMapState.HasSearch()) {
			Text = "<div id='umResultTitle'>Results <b>" + (umMapState.StartRow  + 1) + "-" + (umMapState.StartRow + umLocations.length) + "</b> of <b>" + umMapState.TotalResults  + "</b> matching locations for <B>" + umMapState.SearchText + "</B>.</div>";
		} else {
			Text = "<div id='umResultTitle'>Showing locations <b>" + (umMapState.StartRow  + 1) + "-" + (umMapState.StartRow + umLocations.length) + "</b> of <b>" + umMapState.TotalResults  + "</b> in current map area.</div>";
		}
	} 
	else if (umMapState.HasSearch()) {
		Text = "<div id='umResultTitle'>Found no matching locations for <b>" + umMapState.SearchText + "</b>.</div>";
	}
	else {
		Text = "<div id='umResultTitle'>Found no locations to display.</div>";
	}

	Header.innerHTML = Text;
}


	// Updates the map parameters from any input parameters
function umUpdateMapFromInput(InputValues) 
{
	var Lat				= InputValues.lat;
	var Lng				= InputValues.lng;
	var Zoom			= InputValues.zoom;
	var LocX			= InputValues.locx;
	var LocY			= InputValues.locy;
	var CellX			= InputValues.cellx;
	var CellY			= InputValues.celly;
	var CenterOn		= InputValues.centeron;
	var ShowResults		= InputValues.showresults;
	var ShowCells		= InputValues.showcells;
	var ShowSearch		= InputValues.showsearch;
	var DisableControls	= InputValues.disablecontrols;
	var ShowEdit		= InputValues.edit;
	var ShowDisabled	= InputValues.showdisabled;
	var ShowInfo		= InputValues.showinfo;
	var CellResource	= InputValues.cellresource;
	var ZoomB;
	var bShowResults;
	var bShowCells;
	
	if (Zoom === null || Zoom === "") {
		Zoom = umMapLinkZoomedValue;
		ZoomB = umMapDefaultZoom;
	}
	else {
		ZoomB = Zoom = parseInt(Zoom, 10);
	}

	if (Lat && Lat !== "") {
		umMapState.ZoomTo(umMap, new google.maps.LatLng(parseFloat(Lat), parseFloat(Lng)), Zoom);
	} 
	else if (LocX && LocX !== "") {
		umMapState.ZoomTo(umMap, umConvertLocToLatLng(parseFloat(LocX), parseFloat(LocY)), Zoom);
	}

	else if (CellX && CellX !== "") {
		var X = parseFloat(CellX) * umObCellSize;
		var Y = parseFloat(CellY) * umObCellSize;

		umMapState.ZoomTo(umMap, umConvertLocToLatLng(X, Y), Zoom);
	}
	else if (CenterOn && CenterOn !== "") {
		umMapState.ZoomTo(umMap, umMapDefaultCenter, umMapDefaultZoom);
		umGetCenterOnMarker(umMapState, unescape(CenterOn), Zoom);
		umNoInitialGetMarkers = true;
	}
	else {
		umMapState.ZoomTo(umMap, umMapDefaultCenter, ZoomB);
	}
	
	if (ShowResults !== null && ShowResults !== "") {
		bShowResults = (ShowResults === 'true');
		umUpdateSearchResultsButton(bShowResults);
	}
	else {
		umUpdateSearchResultsButton(umMapState.ShowResults);
	}
	
	if (ShowCells !== null && ShowCells !== "") {
		umMapState.ShowCells = (ShowCells === 'true');
	}
	
	if (ShowSearch !== null && ShowSearch !== "") {
		umMapState.ShowSearch = (ShowSearch === 'true');
	}
	
	if (ShowEdit !== null && ShowEdit !== "") {
		umMapState.ShowEdit = (ShowEdit === 'true');
	}
	
	if (ShowDisabled !== null && ShowDisabled !== "") {
		umMapState.ShowDisabled = (ShowDisabled === 'true');
	}
	
	if (ShowInfo !== null && ShowInfo !== "") {
		umMapState.ShowInfo = (ShowInfo === 'true');
	}
	
	if (CellResource !== null && CellResource !== "") {
		umMapState.CellResource = CellResource;
		umCreateCellResources(CellResource);
		umSetCellResourceList(CellResource);
	}
	
	if (DisableControls !== null && DisableControls !== "") {
		umMapState.DisableControls = (DisableControls === 'true');
	}
	
	if (umMapState.DisableControls) {
		var MenuBar = document.getElementById('umMenuBar');
		var MapContainer = document.getElementById('umMapContainer');
		
		if (MenuBar) MenuBar.style.display = 'none';
		if (MapContainer) MapContainer.style.top = '0px';
	}
	
	var mapOptions = {
			clickable: umMapState.ShowInfo,
			overviewMapControl: !umMapState.DisableControls,
			panControl: !umMapState.DisableControls,
			zoomControl: !umMapState.DisableControls,
			draggable: !umMapState.DisableControls,
			keyboardShortcuts: !umMapState.DisableControls,
			scrollwheel: !umMapState.DisableControls,
	};
	
	umMap.setOptions(mapOptions);
	
	umUpdateSearchFromInput(InputValues);
}


	// Set the map to a specific location at the current zoom level
function umShowLocation(X, Y) 
{
	var Point = umConvertLocToLatLng(X, Y);
	umMapState.MoveTo(umMap, Point);
}

	// Set the map to a specific location and zoom level
function umShowLocationZoom(X, Y, Zoom) 
{
	var Point = umConvertLocToLatLng(X, Y);
	umMapState.ZoomTo(umMap, Point, Zoom);
}


function umTestClick() 
{
	location.replace(umUpdateLink());
}


function umHelpEscKeyHandler (e) 
{
	if (e.keyCode == 27) onCloseHelp();
}


	// Shows the map help screen
function umOnShowHelp(Element)
{
	var Overlay = document.getElementById("umOverlayBottom");
	var OverlayContent = document.getElementById("umOverlayContent");
	if (Overlay === null) return;
	if (OverlayContent === null) return;
	
	Overlay.style.visibility = "visible";
	OverlayContent.style.visibility = "visible";
	
	document.addEventListener("keyup", umHelpEscKeyHandler, false);
}



function onCloseHelp(Element)
{
	var Overlay = document.getElementById("umOverlayBottom");
	var OverlayContent = document.getElementById("umOverlayContent");
	if (Overlay === null) return;
	if (OverlayContent === null) return;
	
	Overlay.style.visibility = "hidden";
	OverlayContent.style.visibility = "hidden";
	
	document.removeEventListener("keyup", umHelpEscKeyHandler);
}


	// Uses an XmlHttpRequest to get map locations using the input information
function umGetCenterOnMarker(MapState, CenterOn, Zoom)
{
	var Request = new XMLHttpRequest();

	QueryStr = umMakeGetQueryCenterOn(MapState, CenterOn);
	Request.open('GET', QueryStr, true);

	Request.onreadystatechange = function () {
		if (Request.readyState == 4) {
			umParseCenterOnMapRequest(Request, Zoom);
		}
	};

	umWaitingForReponse = 1;
	Request.send(null);
}


	// Makes a get query request string from a map state and centeron location
function umMakeGetQueryCenterOn (MapState, CenterOn)
{
	var QueryStr = umGetMapURL + "?game=" + umGame + "&centeron=" + escape(CenterOn);
	return QueryStr;
}


	// Parse a response from a centeron location request
function umParseCenterOnMapRequest(Request, Zoom)
{
	var xmlDoc = Request.responseXML;
	var Locations = xmlDoc.documentElement.getElementsByTagName("location");

	if (Locations.length) {
		var Location = umCreateMapLocation(Locations[0]);

		umLocations[umLocations.length] = Location;
		umCreateMapLabel(Location);
		umAddSearchResult(Location);

		umMapState.StartRow      = 0;
		umMapState.TotalResults  = 1;
		umMapState.NumResults    = 1;
		umUpdateResultsText();

		umMapState.ZoomTo(umMap, Location.MapPoint, Zoom);

		if (umMapState.HasSearch()) {
			umGetMarkers(umMapState);
		}
	}
	else {
		umGetMarkers(umMapState);
	}

	umUpdateLink();
}

function umHtmlEncode(s)
{
	var el = document.createElement("div");
	el.innerText = el.textContent = s;
	s = el.innerHTML;
	return s;
}

function umAddEvent(element, event, fn)
{
	if (element.addEventListener)
		element.addEventListener(event, fn, false);
	else if (element.attachEvent)
		element.attachEvent('on' + event, fn);
}

function umClone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = umClone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}


	// Automatically setup and display the map on page load
google.maps.event.addDomListener(window, 'load', umSetupMap);
