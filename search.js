
function umResetSearch()
{
	var InputBox = document.getElementById("umSearchInputText");
	if (InputBox) InputBox.value = "";

	umMapState.ResetSearch();
	umDeleteLocations();

	umGetMarkers(umMapState);
	umUpdateLink();
}


	// Clear any displayed search results
function umClearSearchResults() 
{
	var SearchResults = document.getElementById("umSearchResults");
	if (!SearchResults) return;
	
	var SearchControlBottom = document.getElementById("umSearchControlBottom");
	var SearchControlTop    = document.getElementById("umSearchControlTop");
	if (SearchControlTop) SearchControlTop.innerHTML = "";
	if (SearchControlBottom) SearchControlBottom.innerHTML = "";

	for (var Index = SearchResults.childNodes.length - 1; Index >= 0; --Index) {
		SearchResults.removeChild(SearchResults.childNodes[Index]);
	}
}


function umOnSearch()
{
	umSearchFunction(0, umMapState.ShowDisabled);
	return false;
}


	// Called to start a search for locations
function umSearchFunction(StartSearchRow, ShowDisabled) 
{
	umMapState.ResetSearch();
	umDeleteLocations();

	var InputBox = document.getElementById("umSearchInputText");

	if (InputBox) {
		var SearchText = InputBox.value;
		umMapState.SearchText = SearchText.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");
		InputBox.value = umMapState.SearchText;

		if (StartSearchRow) {
			umMapState.StartRow = parseInt(StartSearchRow, 10);
		}
		else {
			umMapState.StartRow = 0;
		}

		umGetMarkers(umMapState);
		umUpdateSearchResultsButton(true);
	}

	umUpdateLink();
}


function umOnShowHideSearchResults() 
{
	var SearchResults = document.getElementById("umSearchResultsArea");
	var SearchResultsButton = document.getElementById("umSearchResultsButton");
	
	if (SearchResults === null) return;
	if (SearchResultsButton === null) return;
	
	if (SearchResults.style.visibility == 'hidden') {
		umUpdateSearchResultsButton(true);
	}
	else {
		umUpdateSearchResultsButton(false);
	}
	
	umUpdateLink();	
}


function umUpdateSearchResultsButton(ShowResults)
{
	var SearchResults = document.getElementById("umSearchResultsArea");
	var SearchResultsButton = document.getElementById("umSearchResultsButton");
	var SearchContainer = document.getElementById("umSearchContainer");
	
	umMapState.ShowResults = ShowResults;
	if (SearchResults === null) return;
	if (SearchResultsButton === null) return;
	if (SearchContainer === null) return;
	
	if (ShowResults) {
		SearchResults.style.visibility = "visible";
		SearchResults.style.display = "block";
		SearchResultsButton.style.position = "absolute";
		SearchResultsButton.style.bottom = "40px";
		SearchResultsButton.innerHTML = "<img src='" + umImagePath + umUpArrowIcon + "' </img> Hide Search Results <img src='" + umImagePath + umUpArrowIcon + "' </img>";
		SearchContainer.style.height = '100%';
	}
	else {
		SearchResults.style.visibility = "hidden";
		SearchResults.style.display = "none";
		SearchResultsButton.style.position = "relative";
		SearchResultsButton.style.bottom = "0px";
		SearchResultsButton.innerHTML = "<img src='" + umImagePath + umDownArrowIcon + "' </img> Show Search Results <img src='" + umImagePath + umDownArrowIcon + "' </img>";
		SearchContainer.style.height = '40px';
	}
}


	// Add a text string to the end of the search result element
function umAddSearchResultText(Text, DivName) 
{
	var SearchResults = document.getElementById("umSearchResults");
	if (!SearchResults) return;

	var NewDiv = document.createElement("div");
	NewDiv.setAttribute("divname", DivName);
	NewDiv.innerHTML = Text;
	
	var Found = 0;
	
	for (var Index = 0; Index < SearchResults.childNodes.length; Index++) {
		var TName = SearchResults.childNodes[Index].getAttribute("divname");
		if (TName > DivName) {
			SearchResults.insertBefore(NewDiv, SearchResults.childNodes[Index]);
			Found = 1;
			break;
		}
	}
	
	if (!Found) {
		SearchResults.appendChild(NewDiv);
	}

	return NewDiv;
}


	// Updates the search form from input parameters
function umUpdateSearchFromInput(InputValues) 
{
	var SearchText = InputValues.search;
	var SearchBox;
	umMapState.SearchText = SearchText;

	if (SearchText && SearchText !== "")
	{
		umMapState.SearchText = decodeURIComponent(SearchText).replace(/\+/g, ' ');
		umMapState.StartRow   = parseInt(InputValues.startsearch, 10);
		var InputBox = document.getElementById("umSearchInputText");
		if (InputBox) InputBox.value = umMapState.SearchText;
	}
	
	if (umMapState.ShowSearch && !umMapState.DisableControls)
	{
		SearchBox = document.getElementById("umSearchContainer");
		SearchBox.style.display = "block";
	}
	else
	{
		SearchBox = document.getElementById("umSearchContainer");
		SearchBox.style.display = "none";
	}
}


function umCreateSearchResultText(Location)
{
	var TypeText = umGetMapMarkerType(Location.Type);
	var NewLink  = umCreateLink(Location.MapPoint);
	
	var NewText = "<div id='umResult'><div id='umResultLinkBox'><nobr><div id='umResultIconBox'><img id='umResultIcon' src='" + umGetMapMarkerIcon(Location.Type) + "' alt='[" + TypeText +"]' border='0' /></div> ";
	NewText += "<a id='umResultLink' href='" + NewLink + "' onClick='umShowLocation(" + Location.X + "," + Location.Y + "); return(false);'>" + Location.Name + "</A>";
	
	var NewLinkZoom = umCreateLinkZoom(Location.MapPoint, umMapLinkZoomedValue);
	NewText += " <a href='" + NewLinkZoom + "' id='umResultZoom' onClick='umShowLocationZoom(" + Location.X + "," + Location.Y + ", " + umMapLinkZoomedValue + "); return(false);'>";
	NewText += "<img width='16' height='16' id='umZoomIcon' src='" + umImagePath + umZoomIcon + "' alt='[zoomto]' border='0'></a>";
		
	if (Location.WikiPage) {
		NewText += "<a id='umResultWikiLink' href=\"http://www.uesp.net/wiki/" + Location.Namespace + ":" + encodeURIComponent(Location.WikiPage) + "\" >";
		NewText += "<img width='32' height='16' src='" + umImagePath + umWikiPageIcon +  "' border='0' alt='[Wiki Page]'/>";
		NewText += "</a>";
	}
	
	NewText += "</nobr>";
	NewText += "</div>";
	
	if (Location.Type) {
		NewText += " <div id='umResultLocType'>" + TypeText + ", </div>";
	}
	else {
		NewText += " <div id='umResultLocType'> </div>";
	}
	
	
	NewText += "<div id='umResultLoc'>" + Location.Region + " (" + Location.X + ", " + Location.Y + ")";
	
	NewText += "</div></div>";
	return NewText;
}


	// Add a location record to the end of the search results
function umAddSearchResult(Location) 
{
	var NewText = umCreateSearchResultText(Location);
	Location.ResultElement = umAddSearchResultText(NewText, Location.Name);
}


function umUpdateSearchResult(Location)
{
	if (Location === null || Location.ResultElement === null) return;
	var NewText = umCreateSearchResultText(Location);
	Location.ResultElement.innerHTML = NewText;
	
}
