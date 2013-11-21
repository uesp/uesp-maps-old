var umNewLocClickListener = null;


function umSetupEditMap() 
{
	if (!umMapState.ShowEdit) return;
	
	umAddEditNewLocationLink();
}


function umOnEditNewLocation(Element)
{
	
	if (umNewLocClickListener !== null) {
		google.maps.event.removeListener(umNewLocClickListener);
		umNewLocClickListener = null;
		Element.innerHTML = 'New Location';
		Element.style.backgroundColor = '';
		Element.style.textColor = '';
		umMap.setOptions({draggableCursor: ''});
		return;
	}

	Element.innerHTML = 'Click Map To Add...';
	Element.style.backgroundColor = '#cc0000';
	Element.style.textColor = '#cccccc';
	umMap.setOptions({draggableCursor: 'crosshair'});
	
	umNewLocClickListener = google.maps.event.addListenerOnce(umMap, 'click', umOnClickAddLocation);
}


function umOnClickAddLocation(MouseEvent)
{
	var AddLocButton = document.getElementById('umEditAddLocButton');
	
	if (AddLocButton !== null) {
		AddLocButton.innerHTML = 'New Location';
		AddLocButton.style.backgroundColor = '';
		AddLocButton.style.textColor = '';
		umMap.setOptions({draggableCursor: ''});
	}
	
	var NewLocation = new CMapLocation();
	NewLocation.ID = -1;
	
	var XPos = umConvertLngToLocX(MouseEvent.latLng.lng());
	var YPos = umConvertLatToLocY(MouseEvent.latLng.lat());
	
	NewLocation.X = XPos;
	NewLocation.Y = YPos;
	NewLocation.MapPoint = new google.maps.LatLng(MouseEvent.latLng.lat(), MouseEvent.latLng.lng());
	NewLocation.Show = true;
	umLocations.push(NewLocation);
	
	var Label = umCreateMapLabel(NewLocation);
	var Content = umMakeEditLocationInfoContent(NewLocation, Label.locationinfoid);
	Label.infowindow.setOptions({disableAutoPan:true});
	Label.infowindow.setContent(Content);
	Label.infowindow.open(umMap, Label.marker);
	
	umAddSearchResult(NewLocation);
}


function umAddEditNewLocationLink ()
{
	if (!umMapState.ShowEdit) return;
	
	var Element = document.getElementById('umMenuLinksRight');
	if (Element === null) return;
	if (Element.children.length <= 0) return;
	
	var List = Element.children[0];
	var FirstNode = List.nodeName.toLowerCase();
	if (FirstNode !== 'ol') return;
	
	var NewEntry = document.createElement('li');
	NewEntry.id = 'umEditAddLocButton';
	NewEntry.className = 'umMenuItem';
	NewEntry.style.right = "25px";
	NewEntry.onclick = function() { umOnEditNewLocation(NewEntry); };
	NewEntry.appendChild(document.createTextNode('New Location'));
	
	List.insertBefore(NewEntry, List.getElementsByTagName("li")[0]);
}


function umMakeSaveLocQuery(Location, LocForm)
{
	var EditName = LocForm.umEditLocInfoName;
	var EditType = LocForm.umEditLocInfoType;
	var EditWikiPage = LocForm.umEditLocInfoWikiPage;
	var EditTags = LocForm.umEditLocInfoTags;
	var EditDisplayLevel = LocForm.umEditLocInfoDisplayLevel;
	var EditLabelPosition = LocForm.umEditLocInfoLabelPosition;
	var EditEditorID = LocForm.umEditLocInfoEditorID;
	var EditWorldSpace = LocForm.umEditLocInfoWorldspace;
	var EditNamespace = LocForm.umEditLocInfoNamespace;
	var EditRegion = LocForm.umEditLocInfoRegion;
	var EditShow = LocForm.umEditLocInfoShow;
	var EditX = LocForm.umEditLocInfoX;
	var EditY = LocForm.umEditLocInfoY;
	var EditZ = LocForm.umEditLocInfoZ;
	
	var Query = '?';
	
	if (Location)
		Query += 'id=' + Location.ID;
	else
		Query += '?id=-1';

	if (EditName) {
		if (Location) Location.Name = EditName.value;
		Query += '&name=' + escape(EditName.value) + '';
	}

	if (EditWikiPage) {
		if (Location) Location.WikiPage = EditWikiPage.value;
		Query += '&page=' + escape(EditWikiPage.value) + '';
	}

	if (EditX) {
		var X = parseFloat(EditX.value);
		if (Location) Location.X = X;
		Query += '&x=' + X  + '';
	}

	if (EditY) {
		var Y = parseFloat(EditY.value);
		if (Location) Location.Y = Y;
		Query += '&y=' + Y + '';
	}

	if (EditZ) {
		var Z = parseFloat(EditZ.value);
		if (Location) Location.Z = Z;
		Query += '&z=' + Z + '';
	}

	if (Location) Location.MapPoint = umConvertLocToLatLng(Location.X, Location.Y);

	if (EditType) {
		var Type = parseInt(EditType.value, 10);
		if (Location) Location.Type = Type;
		Query += '&type=' + Type + '';
	}

	if (EditDisplayLevel) {
		var Display = parseInt(EditDisplayLevel.value, 10);
		if (Location) Location.DisplayLevel = Display;
		Query += '&display=' + Display + '';
	}

	if (EditLabelPosition) {
		var Label = parseInt(EditLabelPosition.value, 10);
		if (Location) Location.LabelPosition = Label;
		Query += '&labpos=' + Label + '';
	}

	if (EditWorldSpace) {
		if (Location) Location.Worldspace = EditWorldSpace.value;
		Query += '&ws=' + escape(EditWorldSpace.value) + '';
	}
	
	if (EditEditorID) {
		if (Location) Location.EditorID = EditEditorID.value;
		Query += '&editid=' + escape(EditEditorID.value) + '';
	}

	if (EditRegion) {
		if (Location) Location.Region = EditRegion.value;
		Query += '&region=' + escape(EditRegion.value) + '';
	}

	if (EditNamespace) {
		if (Location) Location.Namespace = EditNamespace.value;
		Query += '&ns=' + escape(EditNamespace.value) + '';
	}
	
	if (EditTags) {
		if (Location) Location.Tags = EditTags.value;
		Query += '&tags=' + escape(EditTags.value) + '';
	}

	if (EditShow) {
		var Value = 0;
		if (EditShow.checked) Value = 1;
		if (Location) Location.Show = Value;
		Query += '&show=' + Value + '';
	}

	return Query;
}


function umOnOpenEditLocationInfo(Element, ID)
{
	var Location = umFindLocationByInfoID(ID);
	if (Location === null) return;
	
	var Content = umMakeEditLocationInfoContent(Location, ID);
	
	Location.Label.infowindow.setContent(Content);
}


function umOnCloseEditLocationInfo(Element, ID)
{
	var Location = umFindLocationByInfoID(ID);
	if (Location === null) return;
	
	if (Location.ID < 0) {
		umDeleteLocation(Location);
	}
	else {	
		var Content = umMakeLocationInfoContent(Location, ID);
		Location.Label.infowindow.setContent(Content);
		Location.Label.infowindow.close();
	}
	
}


function umParseSetMapRequest(Request, LocForm, LocID)
{
	var xmlDoc = Request.responseXML;
	var Results = xmlDoc.documentElement.getElementsByTagName("result");
	var Location = umFindLocationByInfoID(LocID);

	if (Results.length) {
		var Msg = unescape(Results[0].getAttribute("msg")) + " -- " +  unescape(Results[0].getAttribute("id"));
		var ErrorValue = parseInt(Results[0].getAttribute("value"), 10);
		
		if (ErrorValue === 0) {
			umOutputEditLocationError(LocID, Msg);
			return;
		}
		else {
			umOutputEditLocationNotice(LocID, Msg);
		}
		
		if (Location !== null && Location.ID < 0) {
			var NewID = parseInt(Results[0].getAttribute("id"), 10);
			if (NewID > 0) Location.ID = NewID;
		}
	}
	else {
		umOutputEditLocationError(LocID, "Unknown error updating location!");
		return;
	}
	
	if (Location !== null) {
		var Label = umUpdateMapLabel(Location);
		umUpdateSearchResult(Location);
		//if (Label !== null) Label.infowindow.open(umMap, Label.marker);
	}
}


function umSaveLocation(Location, LocForm, LocID)
{
	if (LocForm === null || LocID === null) return false;
	umOutputEditLocationNotice(LocID, "Saving...");
	
	var SaveQuery = umMakeSaveLocQuery(Location, LocForm);
	var SetScript = umSetMapURL + SaveQuery;
	
	var Request = new XMLHttpRequest();

	Request.open('GET', SetScript, true);
	
	Request.onreadystatechange = function () {
		if (Request.readyState == 4) {
			umParseSetMapRequest(Request, LocForm, LocID);
		}
	};

	Request.send(null);
	
	return true;
}


function umOnSubmitEditLocation(Element, ID)
{
	var Location = umFindLocationByInfoID(ID);
	
	var LocForm = document.getElementById(ID + "form");
	
	if (LocForm === null) {
		umOutputEditLocationError(ID, 'Error saving location!<br />Could not find form with element ID "' + ID  + '"!');
		return false;
	}
	
	if (Location === null) {
		umOutputEditLocationError(ID, 'Error saving location!<br />Could not find location with element ID "' + ID  + '"!');
		return false;
	}
	
	umSaveLocation(Location, LocForm, ID);
	return false;
}


function umOutputEditLocationMsg(LocID, Msg, MsgColor)
{
	if (LocID === null) return;
	var OutputDiv = document.getElementById('LocEditResult' + LocID);
	if (OutputDiv === null) return;
	
	OutputDiv.innerHTML = Msg;
	OutputDiv.style.backgroundColor = MsgColor;
}


function umOutputEditLocationError(LocID, ErrorMsg)
{
	umOutputEditLocationMsg(LocID, ErrorMsg, "#ff6666");
}


function umOutputEditLocationWarning(LocID, ErrorMsg)
{
	umOutputEditLocationMsg(LocID, ErrorMsg, "#ffff66");
}


function umOutputEditLocationNotice(LocID, ErrorMsg)
{
	umOutputEditLocationMsg(LocID, ErrorMsg, "#ffffff");
}


function umMakeLocationLabelPosCombo(ElementName, CurrentValue)
{
	var Output = "";
	
	Output += '<select name="' + ElementName + '">';
	
	for (var i = 1; i <= 9; i++) {
		var LabelText = umGetLabelPositionLabel(i);
		Output += '<option value="' + i + '" ' + (CurrentValue == i ? 'selected' : '') + '>' + LabelText + ' (' + i + ')</option>';
	}
	
	Output += '</select>';
	return Output;
}


function umMakeLocationTypeCombo(ElementName, CurrentValue, OnChangeEvent)
{
	var Output = "";
	var MaxType = 64;
	var SelectedIndex = -1;
	
	switch (umGame) {
		case 'sr': MaxType = 64; break;
		case 'db': MaxType = 64; break;
		case 'si': MaxType = 48; break;
		case 'mw': MaxType = 35; break;
		case 'ob': MaxType = 48; break;
	}
	
	Output += '<select name="' + ElementName + '" ';
	if (OnChangeEvent !== null) Output += ' onChange="' + OnChangeEvent + '" onKeyUp="' + OnChangeEvent + '" ';
	Output += '>';
	
	for (var i = 0; i <= MaxType; i++) {
		var TypeString = umGetMapMarkerType(i);
		if (TypeString === 'Other') continue;
		Output += '<option value="' + i + '" ' + (CurrentValue == i ? 'selected' : '') + '>' + TypeString + ' (' + i + ')</option>';
		if (CurrentValue == i) SelectedIndex = i;
	}
	
	Output += '<option value="' + 100 + '" ' + (CurrentValue == 100 ? 'selected' : '') + '>Other (100)</option>';
	if (CurrentValue == 100) SelectedIndex = 100;
	
	if (SelectedIndex < 0) {
		Output += '<option value="' + CurrentValue + '" selected>' + Unknown + ' (' + CurrentValue + ')</option>';
	}

	Output += '</select>';
	return Output;
}


function umOnLocEditTypeChange (Element, LocIconID)
{
	var LocIcon = document.getElementById(LocIconID);
	if (Element === null || LocIcon === null) return;
	
	var TypeValue = Element.options[Element.selectedIndex].value;
	var IconURL = umGetMapMarkerIcon(parseInt(TypeValue, 10));
	
	LocIcon.style.backgroundImage = 'url(' + IconURL + ')';
}


	// Creates the location info DIV for an editable location
function umMakeEditLocationInfoContent(Location, ID)
{
	var Content;
	
	ID = typeof ID !== 'undefined' ? ID : umCreateUniqueLocationID();
	if (ID === null) ID = umCreateUniqueLocationID();

	Content  = '<div class="umLocationInfoEdit" id="' + ID + '">';
	Content += '<form id="' + ID + 'form" onSubmit="return false;">';
	
	Content += '<div class="umLocationInfoTitle">Editing Location #' + Location.ID + '</div>';
	
	Content += '<div class="umLocationEditTitle">Name</div> ';
	Content += '<div class="umLocationEditInput"><input type="text" autocomplete="off" name="umEditLocInfoName" value="' + umHtmlEncode(Location.Name) + '" maxlength="100"/></div>';
	
	Content += '<div class="umLocationEditTitle">Position</div> ';
	Content += '<div class="umLocationEditInputSmall"><input type="text" autocomplete="off" name="umEditLocInfoX" value="' + Location.X + '" maxlength="10" /></div> ';
	Content += '<div class="umLocationEditInputSmall"><input type="text" autocomplete="off" name="umEditLocInfoY" value="' + Location.Y + '" maxlength="10" /></div> ';
	Content += '<div class="umLocationEditInputSmall"><input type="text" autocomplete="off" name="umEditLocInfoZ" value="' + Location.Z + '" maxlength="10" /></div> ';
	
	Content += '<div class="umLocationEditTitle">Enabled</div> ';
	Content += '<div class="umLocationEditInput"><input type="checkbox"  autocomplete="off" name="umEditLocInfoShow" value="1" ' + (Location.Show ? 'checked="checked"' : '') + ' /></div>';
	
	var TypeIconID = ID + 'TypeIcon';
	var OnChangeEvent = 'umOnLocEditTypeChange(this, &quot;' + TypeIconID + '&quot;);';
	var IconURL = umGetMapMarkerIcon(Location.Type);
	var IconStyle = 'background-image: url(&quot;' + IconURL + '&quot;);';
	Content += '<div class="umLocationEditTitle">Type</div> ';
	Content += '<div class="umLocationEditInput">';
	Content += umMakeLocationTypeCombo('umEditLocInfoType', Location.Type, OnChangeEvent);
	Content += '<div class="umLocationEditTypeIcon" id="' + TypeIconID + '" style="' + IconStyle + '"></div>';
	Content += '</div> ';
	
	Content += '<div class="umLocationEditTitle">Wiki Page</div> ';
	Content += '<div class="umLocationEditInput"><input type="text" autocomplete="off" name="umEditLocInfoWikiPage" value="' + umHtmlEncode(Location.WikiPage) + '" maxlength="100" /></div>';
	
	Content += '<div class="umLocationEditTitle">Tags</div> ';
	Content += '<div class="umLocationEditInput"><input type="text" autocomplete="off" name="umEditLocInfoTags" value="' + umHtmlEncode(Location.Tags) + '" maxlength="100" /></div>';
	
	Content += '<div class="umLocationEditTitle">Display Level</div> ';
	Content += '<div class="umLocationEditInput"><input type="text" autocomplete="off" name="umEditLocInfoDisplayLevel" value="' + Location.DisplayLevel + '" maxlength="100" /></div>';
	
	Content += '<div class="umLocationEditTitle">Label Pos</div> ';
	Content += '<div class="umLocationEditInput">';
	Content += umMakeLocationLabelPosCombo('umEditLocInfoLabelPosition', Location.LabelPosition);
	Content += '</div> ';
	
	Content += '<div class="umLocationEditTitle">Editor ID</div> ';
	Content += '<div class="umLocationEditInput"><input type="text" autocomplete="off" name="umEditLocInfoEditorID" value="' + umHtmlEncode(Location.EditorID) + '" maxlength="100" /></div>';
	
	Content += '<div class="umLocationEditTitle">Worldspace</div> ';
	Content += '<div class="umLocationEditInput"><input type="text" autocomplete="off" name="umEditLocInfoWorldspace" value="' + umHtmlEncode(Location.Worldspace) + '" maxlength="100" /></div>';
	
	Content += '<div class="umLocationEditTitle">Namespace</div> ';
	Content += '<div class="umLocationEditInput"><input type="text" autocomplete="off" name="umEditLocInfoNamespace" value="' + umHtmlEncode(Location.Namespace) + '" maxlength="100" /></div>';
	
	Content += '<div class="umLocationEditTitle">Region</div> ';
	Content += '<div class="umLocationEditInput"><input type="text" autocomplete="off" name="umEditLocInfoRegion" value="' + umHtmlEncode(Location.Region) + '" maxlength="100" /></div>';
	
	Content += '<div class="umLocationEditButtons">';
	Content += '<input type="button" value="Save" onClick="umOnSubmitEditLocation(this, &quot;' + ID + '&quot;);" />'; 
	Content += '<input type="button" value="Cancel" onClick="umOnCloseEditLocationInfo(this, &quot;' + ID + '&quot;);" />';
	Content += '</div>';
	Content += '<div class="umLocationEditResult" id="LocEditResult' + ID + '"></div>';
	
	Content += '</form></div>';
	return Content;
}

