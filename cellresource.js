var umCellResourceObjects = [];
var umCurrentCellResource = "";
var umCurrentResourceData = null;
var umCellResourceCellX1 = -57;
var umCellResourceCellX2 = 61;
var umCellResourceCellY1 = -43;
var umCellResourceCellY2 = 50;


var umDefaultCellBoxOptions_Base = {
	clickable: 		false,
	draggable:		false,
	editable:		false,
	fillOpacity:	0.4,
	strokeColor:	"#000000",
	strokeOpacity:	0.5,
	strokeWeight:	1,
	visible:		true,
	zIndex:			960
};

var umDefaultCellBoxOptions_Green = umClone(umDefaultCellBoxOptions_Base);
umDefaultCellBoxOptions_Green.fillColor = "#00ff00";

var umDefaultCellBoxOptions_Red = umClone(umDefaultCellBoxOptions_Base);
umDefaultCellBoxOptions_Red.fillColor = "#ff0000";
		
var umDefaultCellBoxOptions_Yellow = umClone(umDefaultCellBoxOptions_Base);
umDefaultCellBoxOptions_Yellow.fillColor = "#ffff00";

var umDefaultCellBoxOptions_Blue = umClone(umDefaultCellBoxOptions_Base);
umDefaultCellBoxOptions_Blue.fillColor = "#0000ff";

var umDefaultCellBoxOptions_Purple = umClone(umDefaultCellBoxOptions_Base);
umDefaultCellBoxOptions_Purple.fillColor = "#ff00ff";

var umDefaultCellBoxOptions_Orange = umClone(umDefaultCellBoxOptions_Base);
umDefaultCellBoxOptions_Orange.fillColor = "#ff6633";


function umOnShowCellResource(Element)
{
	if (typeof Element === 'undefined' || Element === null) return false;
	var Resource = Element.options[Element.selectedIndex].value;
	
	umCreateCellResources(Resource);
	
	return false;
}


function umShowCellResourceGuide (Visible)
{
	var Element = document.getElementById('umCellResourceGuide');
	if (Element === null) return;
	
	if (Visible)
		Element.style.visibility = 'visible';
	else
		Element.style.visibility = 'hidden';
}


function umCreateCellBox(BaseOptions, CellX, CellY)
{
	var MapX1 = umConvertXLocToLng(CellX*umCellSize);
	var MapY1 = umConvertYLocToLat(CellY*umCellSize);
	var MapX2 = umConvertXLocToLng(CellX*umCellSize + umCellSize);
	var MapY2 = umConvertYLocToLat(CellY*umCellSize + umCellSize);
	var LatLng1 = new google.maps.LatLng(MapY1, MapX1);
	var LatLng2 = new google.maps.LatLng(MapY2, MapX2);
	
	var BoxOptions = BaseOptions;
	BoxOptions.bounds = new google.maps.LatLngBounds(LatLng1, LatLng2);
	
	NewBox = new google.maps.Rectangle(BoxOptions);
	NewBox.setMap(umMap);
	umCellResourceObjects.push(NewBox);	
}


function umCreateCellResources(Resource)
{
	umClearCellResources();
	umCurrentCellResource = Resource;
	umMapState.CellResource = Resource;
	umUpdateLink();
	
	if (Resource === '') {
		umShowCellResourceGuide(false);
		return;
	}
	
	switch (Resource)
	{
		case 'test1': umCreateCellResourcesTest1(); break;
		case 'test2': umCreateCellResourcesTest2(); break;
		case 'test3': umCreateCellResourcesTest3(); break;
		default: umGetCellResourceData(Resource); break;
	}
	
}


function umGetCellResourceData(ResourceEditorID) 
{
	if (ResourceEditorID === '') {
		umShowCellResourceGuide(false);
		return;
	}
	
	var Request = new XMLHttpRequest();
	var QueryStr = umGetResourceURL + '?game=' + umGame + '&editorid=' + ResourceEditorID;
	Request.open('GET', QueryStr, true);

	Request.onreadystatechange = function () {
		if (Request.readyState == 4) {
			umParseGetCellResourceRequest(Request);
		}
	};

	Request.send(null);
}


function umParseGetCellResourceRequest(Request) 
{
	var JsonData = Request.responseText;
	
	//console.debug("JsonData: " + JsonData);

	if (JsonData === null) {
		umShowCellResourceGuide(false);
		return;
	}
	
	umCurrentResourceData = JSON.parse(JsonData);
	umUpdateCellResourceView(umCurrentResourceData);
}


function umUpdateCellResourceView(ResourceData) 
{
	umClearCellResources();
	
	if (typeof ResourceData === 'undefined') return;
	if (ResourceData === null) return;
	if (typeof ResourceData.data === 'undefined') return;
	if (ResourceData.data === null) return;
	
	umShowCellResourceGuide(true);
	
	for (var X = umCellResourceCellX1; X <= umCellResourceCellX2; X++) 
	{
		for (var Y = umCellResourceCellY1; Y <= umCellResourceCellY2; Y++)
		{
			ResourceCount = ResourceData.data[X - umCellResourceCellX1][Y - umCellResourceCellY1];
			
			if (typeof ResourceCount === 'undefined') continue;
			if (ResourceCount === null) continue;
			
			if (ResourceCount == 0) 
			{
				//do nothing
			}
			else if (ResourceCount <= 2)
			{
				umCreateCellBox(umDefaultCellBoxOptions_Purple, X, Y);
			}
			else if (ResourceCount <= 5)
			{
				umCreateCellBox(umDefaultCellBoxOptions_Blue, X, Y);
			}
			else if (ResourceCount <= 10)
			{
				umCreateCellBox(umDefaultCellBoxOptions_Green, X, Y);
			}
			else if (ResourceCount <= 20)
			{
				umCreateCellBox(umDefaultCellBoxOptions_Yellow, X, Y);
			}
			else if (ResourceCount <= 50) 
			{
				umCreateCellBox(umDefaultCellBoxOptions_Orange, X, Y);
			}
			else
			{
				umCreateCellBox(umDefaultCellBoxOptions_Red, X, Y);
			}
		}
		
	}
}


function umSetCellResourceList(Resource)
{
	var ResourceList = document.getElementById('umCellResourceList');
	if (ResourceList === null) return;
		
	ResourceList.value = Resource;
	console.debug("Setting resource " + Resource);
}


function umClearCellResources()
{
	for (var i = 0; i < umCellResourceObjects.length; ++i)
	{
		umCellResourceObjects[i].setMap(null);
	}
	
	umCellResourceObjects = [];
}

//All functions below here are for testing and can eventually be deleted

function umCreateCellResourcesTest1()
{
	umCreateCellBox(umDefaultCellBoxOptions_Blue, 0, 0);
	umCreateCellBox(umDefaultCellBoxOptions_Blue, 1, 0);
	umCreateCellBox(umDefaultCellBoxOptions_Red,  2, 2);
	umCreateCellBox(umDefaultCellBoxOptions_Red,  1, 2);
	umCreateCellBox(umDefaultCellBoxOptions_Red,  2, 3);
	umCreateCellBox(umDefaultCellBoxOptions_Red,  3, 2);
	umCreateCellBox(umDefaultCellBoxOptions_Green, 1, 1);
	umCreateCellBox(umDefaultCellBoxOptions_Green, 2, 1);
	umCreateCellBox(umDefaultCellBoxOptions_Yellow, -1, 0);
	umCreateCellBox(umDefaultCellBoxOptions_Yellow, -1, 1);
	umCreateCellBox(umDefaultCellBoxOptions_Yellow, 3, 1);
	umShowCellResourceGuide(true);
}

function umCreateCellResourcesTest2()
{
	umCreateCellBox(umDefaultCellBoxOptions_Blue,    10, 20);
	umCreateCellBox(umDefaultCellBoxOptions_Blue,    11, 20);
	umCreateCellBox(umDefaultCellBoxOptions_Red,     12, 22);
	umCreateCellBox(umDefaultCellBoxOptions_Red,     11, 22);
	umCreateCellBox(umDefaultCellBoxOptions_Red,     12, 23);
	umCreateCellBox(umDefaultCellBoxOptions_Red,     13, 22);
	umCreateCellBox(umDefaultCellBoxOptions_Green,   11, 21);
	umCreateCellBox(umDefaultCellBoxOptions_Green,   12, 21);
	umCreateCellBox(umDefaultCellBoxOptions_Yellow,  14, 20);
	umCreateCellBox(umDefaultCellBoxOptions_Yellow,  14, 21);
	umCreateCellBox(umDefaultCellBoxOptions_Yellow,  14, 21);
	umShowCellResourceGuide(true);
}

var umSimpleRandSeed = 123456789;

function umSimpleRand()
{
	umSimpleRandSeed = (1103515245 * umSimpleRandSeed + 12345) % 4294967296;
	return umSimpleRandSeed;
}


function umCreateCellResourcesTest3()
{
	umSimpleRandSeed = 42;
	
	for (var i = 0; i < 1000; ++i)
	{
		var BoxType = Math.floor((umSimpleRand() / 1000) % 6);
		var CellX = Math.floor((umSimpleRand()/100) % 75 - 37);
		var CellY = Math.floor((umSimpleRand()/100) % 60 - 30);
		
		switch (BoxType) {
			case 0: umCreateCellBox(umDefaultCellBoxOptions_Blue,   CellX, CellY); break;
			case 1: umCreateCellBox(umDefaultCellBoxOptions_Green,  CellX, CellY); break;
			case 2: umCreateCellBox(umDefaultCellBoxOptions_Red,    CellX, CellY); break;
			case 3: umCreateCellBox(umDefaultCellBoxOptions_Yellow, CellX, CellY); break;
			case 4: umCreateCellBox(umDefaultCellBoxOptions_Purple, CellX, CellY); break;
			case 5: umCreateCellBox(umDefaultCellBoxOptions_Orange, CellX, CellY); break;
			default: umCreateCellBox(umDefaultCellBoxOptions_Red,   CellX, CellY); break;
		}
	}
	
	umShowCellResourceGuide(true);
}


