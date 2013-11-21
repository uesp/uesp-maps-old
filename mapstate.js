
	// Default map states
var umDefaultShowDisabled		= false;
var umDefaultShowResults		= false;
var umDefaultShowCells			= false;
var umDefaultShowSearch			= true;
var umDefaultDisableControls	= false;
var umDefaultShowEdit			= false;
var umDefaultShowInfo			= true;
var umDefaultCellResource       = "";


	// Map state class constructor
function CMapState(Center, Zoom, SearchText, NumResults, TotalResults, StartRow, Bounds) {
	this.Center				= Center;
	this.Zoom				= Zoom;
	this.SearchText			= SearchText;
	this.NumResults			= NumResults;
	this.TotalResults		= TotalResults;
	this.StartRow			= StartRow;
	this.MapBounds			= Bounds;
	this.ShowDisabled		= umDefaultShowDisabled;
	this.ShowResults		= umDefaultShowResults;
	this.ShowCells			= umDefaultShowCells;
	this.ShowSearch			= umDefaultShowSearch;
	this.DisableControls	= umDefaultDisableControls;
	this.ShowEdit			= umDefaultShowEdit;
	this.ShowInfo			= umDefaultShowInfo;
	this.CellResource       = umDefaultCellResource;
}


	// Is the map currently displaying search results
CMapState.prototype.HasSearch = function() {
	return (this.SearchText !== null && this.SearchText !== "");
};


	// Update the center/zoom from the current map
CMapState.prototype.Update = function(Map) {
	this.Center		= Map.getCenter();
	this.Zoom		= Map.getZoom();
	this.MapBounds	= Map.getBounds();
};


	// Sets the map center/zoom
CMapState.prototype.ZoomTo = function(Map, Center, Zoom) 
{
	umSkipUpdate = true;

	Map.panTo(Center);
	Map.setZoom(Zoom);
	
	umSkipUpdate = false;
	umUpdateDiffMarkers();
};


	// Sets the map center keeping the current zoom
CMapState.prototype.MoveTo = function(Map, Center) 
{
	Map.panTo(Center);
	this.Center = Center;
	this.MapBounds = Map.getBounds();
};


	// Reset the search results
CMapState.prototype.ResetSearch = function() {
	this.NumResults		= 0;
	this.StartRow		= 0;
	this.SearchText		= "";
	this.TotalResults	= 0;

	umClearSearchResults();
};

var umMapState = new CMapState(umMapDefaultCenter, umMapDefaultZoom, "", 0, 0, 0, umMapBounds);