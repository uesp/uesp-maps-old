

	// Class constructor for a label to be displayed on the map
var CLabelClass = function() {
	this.id = "";
	this.content = "";
	this.marker = null;
	this.listeners = [];
	this.anchorLatLng = new google.maps.LatLng(0,0);
	this.markerOffset = new google.maps.Size(0,0);
	this.anchorPoint = "topLeft";
	this.percentOpacity = 100;
	this.infowindow = null;
	this.locationinfoid = null;
};


	// Adds a new map label using the given information
function umCreateMapLabel (Location)
{
	var label = new CLabelClass();
	var LabelTextAlign = 'left';
	var LabelWidth = Location.Name.length*6 + 2;

	label.id = 'Label' + umLocations.length + umLocationIDCounter;
	label.anchorLatLng = Location.MapPoint;
	label.anchorPoint = 'topLeft';
	label.markerOffset = new google.maps.Size(8,8);
	label.percentOpacity = 100;

		// position of entire label box relative to anchor point
		// anchorPoint sets the corner of the label box where anchor (lat/long point) is located
		//  (note this name is position of anchor relative to label;
		//   on edit box, the name is the position of the label relative to the anchor and 
		//   therefore is the reverse)
		// markerOffset specifies where relative to that corner the exact center of the anchor
		// (i.e., center of 16x16 map marker icon) is located
	switch (Location.LabelPosition) {
			case 1:
				label.anchorPoint = 'topLeft';
				LabelTextAlign = 'left';
				label.markerOffset = new google.maps.Point(8, 4);
				break;
			case 2:
				label.anchorPoint = 'topCenter';
				LabelTextAlign = 'center';
				label.markerOffset = new google.maps.Point(LabelWidth/2, 4);
				break;
			case 3:
				label.anchorPoint = 'topRight';
				LabelTextAlign = 'right';
				label.markerOffset = new google.maps.Point(LabelWidth*0.9+5, 4);
				break;
			case 4:
				label.anchorPoint = 'midRight';
				LabelTextAlign = 'right';
				label.markerOffset = new google.maps.Point(LabelWidth*0.9+5, 16);
				break;
			case 5:
				label.anchorPoint = 'bottomRight';
				LabelTextAlign = 'right';
				label.markerOffset = new google.maps.Point(LabelWidth*0.9+5, 26);
				break;
			case 6:
				label.anchorPoint = 'bottomCenter';
				LabelTextAlign = 'center';
				label.markerOffset = new google.maps.Point(LabelWidth/2, 26);
				break;
			case 7:
				label.anchorPoint = 'bottomLeft';
				LabelTextAlign = 'left';
				label.markerOffset = new google.maps.Point(8, 26);
				break;
			case 9:
				label.anchorPoint = 'center';
				LabelTextAlign = 'center';
				label.markerOffset = new google.maps.Point(LabelWidth/2, 16);
				break;
			case 8:
				/* fall through */
			default:
				label.anchorPoint = 'midLeft';
				LabelTextAlign = 'left';
				label.markerOffset = new google.maps.Point(-8, 16);
				break;
	}
	
	var MarkerOptions = {
			position: Location.MapPoint,
			draggable: false,
			clickable: umMapState.ShowInfo,
			map: umMap,
			optimized: false,
			flat: true,
			icon: umGetMapMarkerIcon(Location.Type),
			labelClass: (Location.Show ? "labels" : "labelsdisabled"),
			labelStyle: { opacity: 1, textAlign: LabelTextAlign, width: LabelWidth },
			labelContent: Location.Name,
			labelAnchor: label.markerOffset,
	};
	
	var marker = new MarkerWithLabel(MarkerOptions);
	
	var iw = new google.maps.InfoWindow({ disableAutoPan: umMapState.DisableControls });
	
	label.locationinfoid = umCreateUniqueLocationID();
	label.content = umMakeLocationInfoContent(Location, label.locationinfoid);
	iw.setContent(label.content);
	iw.locationinfoid = label.locationinfoid;
	label.infowindow = iw;
	
	label.marker = marker;
	label.listeners.push(google.maps.event.addListener(marker, 'click', function (e) { iw.open(umMap, marker); }));
	label.listeners.push(google.maps.event.addListener(marker, 'dblclick', umCenterMapOnClick));

	++umLocationIDCounter;
	Location.Label = label;

	return label;
}


	// Removes the specified label from the map
function umRemoveMapLabel (Label)
{
	for (var i = 0; i < Label.listeners.length; i++) {
		google.maps.event.removeListener(Label.listeners[i]);
	}
	
	Label.listeners = [];
	Label.marker.setMap(null);
}


function umGetLabelPositionLabel(LabelPosition)
{
	switch (LabelPosition) {
		case 1: return 'Bottom Right';
		case 2: return 'Bottom Center';
		case 3: return 'Bottom Left';
		case 4: return 'Middle Left';
		case 5: return 'Top Left';
		case 6: return 'Top Center';
		case 7: return 'Top Right';
		case 8: return 'Middle Right';
		case 9: return 'Center';
	}
}


