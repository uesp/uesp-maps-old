var umNextLocationID = 111;

	// Map location class constructor
function CMapLocation(LocData) 
{
	if (LocData !== undefined && LocData !== null) {
		this.ID = parseInt(LocData.getAttribute("id"), 10);
		this.X = Math.round(parseFloat(LocData.getAttribute("X")));
		this.Y = Math.round(parseFloat(LocData.getAttribute("Y")));
		this.Z = Math.round(parseFloat(LocData.getAttribute("Z")));
		this.Name = decodeURIComponent(LocData.getAttribute("name"));
		
		this.EditorID = decodeURIComponent(LocData.getAttribute("edid"));
		if (this.EditorID === null || this.EditorID === 'null' || this.EditorID === undefined) this.EditorID = '';
		
		this.Worldspace = decodeURIComponent(LocData.getAttribute("ws"));
		this.Type = parseInt(LocData.getAttribute("type"), 10);
		this.Namespace = decodeURIComponent(LocData.getAttribute("ns"));
		this.Region = decodeURIComponent(LocData.getAttribute("region"));
		this.DisplayLevel = parseInt(LocData.getAttribute("level"), 10);
		this.LabelPosition = parseInt(LocData.getAttribute("labpos"), 10);
		this.WikiPage = decodeURIComponent(LocData.getAttribute("page"));
		this.Tags = decodeURIComponent(LocData.getAttribute("tags"));
		
		if (this.NameSpace === '' || this.Namespace === null || this.Namespace === undefined || this.Namespace === 'null') this.Namespace = umWikiNameSpace;
		if (this.Region === '' || this.Region === null || this.Region === undefined || this.Region === 'null') this.Region = umRegionName;
		
		var ShowPos = parseInt(LocData.getAttribute("en"), 10);
		this.Show = ShowPos !== 0;
	}
	else {
		this.ID = this.X = this.Y = this.Z = 0;
		this.Name = this.EditorID = this.Region = this.WikiPage = '';
		this.Tags = '';
		this.Namespace = umWikiNameSpace;
		this.Region = this.Worldspace = umRegionName;
		this.Type = 0;
		this.LabelPosition = 8;
		this.DisplayLevel = 16;
		this.Show = true;
	}

	this.MapPoint = umConvertLocToLatLng(this.X, this.Y);
	this.Label = null;
	this.ResultElement = null;
}


	// Delete all currently displayed map locations
function umDeleteLocations() 
{
	var Index;

	for (Index = 0; Index < umLocations.length; ++Index) {
		if (umLocations[Index].Label) umRemoveMapLabel(umLocations[Index].Label);
	}

	umLocations = [];
}


	// Updates all locations when the map moves (not currently used in favor of the more efficient diff update)
function umUpdateMarkers() {
	umUpdateLink();

	if (umMapState.HasSearch()) return;
	if (umWaitingForReponse) return;

	umMapState.ResetSearch();
	umDeleteLocations();

	umGetMarkers();
}


	// Makes a get query request string from a map state and oblivion bounding box
function umMakeGetQueryBounds(MapState, SWX, SWY, NEX, NEY) 
{
	var QueryStr = umGetMapURL + "?game=" + umGame + "&zoom=" + MapState.Zoom + "&BottomLeftX=" + Math.round(SWX) + "&BottomLeftY=" + Math.round(SWY) + "&TopRightX=" + Math.round(NEX) + "&TopRightY=" + Math.round(NEY);

	if (MapState.HasSearch()) {
		QueryStr += "&SearchText=" + encodeURIComponent(umMapState.SearchText);
	}

	if (MapState.StartRow) {
		QueryStr += "&StartRow=" + encodeURIComponent(umMapState.StartRow);
	}

	if (MapState.ShowDisabled) {
		QueryStr += "&ShowDisabled=2";
	}

	return QueryStr;
}


	// Uses an XmlHttpRequest to get map locations using the input information
function umGetMarkers() 
{
	var Request = new XMLHttpRequest();

	MapBounds = umMap.getBounds();
	if (MapBounds === null) MapBounds = umMapBounds;

	var BottomLeftX = umConvertLngToLocX(MapBounds.getSouthWest().lng());
	var BottomLeftY = umConvertLatToLocY(MapBounds.getSouthWest().lat());
	var TopRightX   = umConvertLngToLocX(MapBounds.getNorthEast().lng());
	var TopRightY   = umConvertLatToLocY(MapBounds.getNorthEast().lat());

	var QueryStr = umMakeGetQueryBounds(umMapState, BottomLeftX, BottomLeftY, TopRightX, TopRightY);
	Request.open('GET', QueryStr, true);

	Request.onreadystatechange = function () {
		if (Request.readyState == 4) {
			umParseGetMapRequest(Request);
		}
	};

	umWaitingForReponse = 1;
	Request.send(null);
}


	// Parse out locations from a get location request
function umParseGetMapLocations(xmlDoc, Locations) {
	var RowCountData = xmlDoc.documentElement.getElementsByTagName("rowcount");
	var TotalRowCount = 0;
	var RowCount = 0;
	var StartRow = 0;

	if (RowCountData.length > 0) {
		TotalRowCount = parseInt(RowCountData[0].getAttribute("totalrows"), 10);
		RowCount      = parseInt(RowCountData[0].getAttribute("rowcount"), 10);
		StartRow      = parseInt(RowCountData[0].getAttribute("startrow"), 10);
	}

	umMapState.StartRow      = StartRow;
	umMapState.TotalResults  = TotalRowCount;
	umMapState.NumResults    = RowCount;

	umParseMapLocations(xmlDoc, Locations);
	
	var Link = "<center>";

		// Previous link
	if (StartRow > 0) {
		var NewStart = StartRow - 50;
		if (NewStart < 0) NewStart = 0;
		Link += "<a href='' onClick='umSearchFunction(" + NewStart + "); return(false);'><b>Prev</b></A> &nbsp; &nbsp; &nbsp;";
	}
	
		// Next link
	if (StartRow + RowCount + 1 < TotalRowCount) {
		var NewStart = StartRow + RowCount;
		if (NewStart > TotalRowCount) NewStart = TotalRowCount - 1;
		if (NewStart < 0) NewStart = 0;
		Link += "<a href='' onClick='umSearchFunction(" + NewStart + "); return(false);'><b>Next</b></a>";
	}
	
	Link += "</center>";
	var SearchControlBottom = document.getElementById("umSearchControlBottom");
	var SearchControlTop    = document.getElementById("umSearchControlTop");
	if (SearchControlTop) SearchControlTop.innerHTML = Link;
	if (SearchControlBottom) SearchControlBottom.innerHTML = Link;
}


	// Parse a response from a get location request
function umParseGetMapRequest(Request) 
{
	var xmlDoc = Request.responseXML;

	if (xmlDoc === null || xmlDoc.documentElement === null) {
		umUpdateResultsText();
		umWaitingForReponse = 0;
		return;
	}

	var Locations = xmlDoc.documentElement.getElementsByTagName("location");

	if (Locations !== null && Locations.length) {
		umParseGetMapLocations(xmlDoc, Locations);
		umUpdateResultsText();
	}
	else {
		umUpdateResultsText();
	}

	umWaitingForReponse = 0;
}


	// Parse and return a new location from raw data
function umCreateMapLocation (LocData) {
	var Loc = new CMapLocation(LocData);
	return Loc;
}


	// Find a current location by its ID
function umFindCurrentLocation (ID) {
	var Index;

	for (Index = 0; Index < umLocations.length; ++Index) {
		if (umLocations[Index].ID == ID) return umLocations[Index];
	}

	return null;
}


	// Parse out locations from a get location request
function umParseMapLocations(xmlDoc, Locations) 
{
	var Count = 0;

	for (var i = 0; i < Locations.length; i++) {
		var Location = umCreateMapLocation(Locations[i]);

		if (umFindCurrentLocation(Location.ID) === null) {
			umLocations.push(Location);
			umCreateMapLabel(Location);
			umAddSearchResult(Location);
			++Count;
		}
	}

	return Count;
}


function umCreateUniqueLocationID()
{
	var NewID = "locinfo" + umNextLocationID;
	umNextLocationID++;
	return NewID;
}


function umOnExpandLocationInfo(Element, ID)
{
	var Location = umFindLocationByInfoID(ID);
	if (Location === null) return;
	
	var Content = umMakeExtLocationInfoContent(Location, ID);
	
	Location.Label.infowindow.setContent(Content);
}


function umOnShrinkLocationInfo(Element, ID)
{
	var Location = umFindLocationByInfoID(ID);
	if (Location === null) return;
	
	var Content = umMakeLocationInfoContent(Location, ID);
	
	Location.Label.infowindow.setContent(Content);
}


function umMakeInnerLocationInfoContent(Location, ID)
{
	var Content ="";
	
	Content += "<div class='umLocationInfoName'>" + Location.Name + "</div>";
	
	if (Location.Type) {
		Content += "<div class='umLocationInfoType'>" + umGetMapMarkerType(Location.Type) + "</div>";
	}
	
	Content += "<div class='umLocationInfoPos'>Location: " + Location.Region + " (" + Location.X + ", " + Location.Y + ", " + Location.Z + ")</div>";
	if (Location.EditorID !== '') { Content += "<div class='umLocationInfoEdId'>EditorID: " + Location.EditorID + "</div>"; }
	//Content += "<div class='umLocationInfoPos'>LabelPos: " + Location.LabelPosition + "</div>";

	if (Location.WikiPage) {
		Content += "<div class='umLocationInfoLink'><a href=\"//www.uesp.net/wiki/" + Location.Namespace + ":" + encodeURIComponent(Location.WikiPage) + "\">" + Location.Namespace + ":" + Location.WikiPage + "</a></div>";
	}
	
	return Content;
}


	// Makes a location content for a popup info window
function umMakeLocationInfoContent(Location, ID)
{
	var Content;
	
	ID = typeof ID !== 'undefined' ? ID : umCreateUniqueLocationID();
	if (ID === null) ID = umCreateUniqueLocationID();

	Content  = "<div class='umLocationInfo' id='" + ID + "'>";
	Content += umMakeInnerLocationInfoContent(Location, ID);
	
	if (umMapState.ShowEdit) {
		Content += "<div class='umLocationExpandEdit' onClick='umOnOpenEditLocationInfo(this, &quot;" + ID + "&quot;);'>Edit...</div>";
	}
	else {
		Content += "<div class='umLocationExpand' onClick='umOnExpandLocationInfo(this, &quot;" + ID + "&quot;);'>More...</div>";		
	}
		
	Content += "</div>";
	return Content;
}


function umMakeExtLocationInfoContent(Location, ID)
{
	var Content;
	
	ID = typeof ID !== 'undefined' ? ID : umCreateUniqueLocationID();
	if (ID === null) ID = umCreateUniqueLocationID();

	Content  = "<div class='umLocationInfoLarge' id='" + ID + "'>";
	Content += umMakeInnerLocationInfoContent(Location, ID);
	
	Content += "<div class='umLocationInfoPos'>&nbsp;</div>";
	Content += "<div class='umLocationInfoPos'>Label Position: " + umGetLabelPositionLabel(Location.LabelPosition) + " (" + Location.LabelPosition + ")</div>";
	Content += "<div class='umLocationInfoPos'>Display Level: " + Location.DisplayLevel + "</div>";
	Content += "<div class='umLocationInfoPos'>Tags: " + Location.Tags + "</div>";
	Content += "<div class='umLocationInfoPos'>World Space: " + Location.Worldspace + "</div>";
	Content += "<div class='umLocationInfoPos'>Internal ID: " + Location.ID + "</div>";
	
	Content += "<div class='umLocationExpand' onClick='umOnShrinkLocationInfo(this, &quot;" + ID + "&quot;);'>Less...</div>";
	Content += "</div>";
	return Content;
}


// Updates an existing map label
function umUpdateMapLabel(Location) 
{
	if (!Location) return null;

		// Remove an existing label
	if (Location.Label) {
		umRemoveMapLabel(Location.Label);
		Location.Label = null;
	}

	return umCreateMapLabel(Location);
}


function umFindLocationByInfoID (ID)
{
	for (var i =0; i < umLocations.length; i++) {
		if (umLocations[i].Label === null) continue;
		if (umLocations[i].Label.locationinfoid === ID) return umLocations[i];
	}
	
	return null;
}


function umDeleteLocation(Location, Index)
{
	if (Location === null || Location === undefined) return;
	
	if (Location.Label) Location.Label.marker.setMap(null);
	if (Location.LabelListener) google.maps.event.removeListener(Location.LabelListener);

	if (Location.ResultElement) {
		var SearchResults = document.getElementById("umSearchResults");
		if (SearchResults !== null) SearchResults.removeChild(Location.ResultElement);
	}
	
	if (Index === null || Index === undefined) {
		Index = umLocations.indexOf(Location);
	}
	
	umLocations.splice(Index, 1);
	--umMapState.NumResults;
	--umMapState.TotalResults;
}

