<?php

// Configuration file that includes the database host, user, and passwords
require '/home/uesp/secrets/maps.secrets';

if (array_key_exists('game' ,$_GET)) {
	$game = mysql_real_escape_string($_GET['formid']);
}
else {
	$game = 'sr';
}

$dbname = $game . '_map_data';
$limitcount = '50';

if (!$db = mysql_connect($uespMapsReadDBHost, $uespMapsReadUser, $uespMapsReadPW)) {
	echo '{ "error": "Could not connect to mysql!" }';
	exit;
}
if (!mysql_select_db($dbname, $db)) {
	echo '{ "error": "Could not select database" }';
	exit;
}
      // Date in the past
//header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); 
//header("Expires: " . gmdate("D, d M Y H:i:s", time()+86400*7) . " GMT");
header("Expires: 0");
header("Pragma: no-cache");
      // always modified
//header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
      // HTTP/1.1
header("Cache-Control: no-cache, no-store, must-revalidate");
//header("Cache-Control: post-check=0, pre-check=0", false);
      // HTTP/1.0
header("Pragma: no-cache");
      //XML Header
//header("content-type:text/html");
header("content-type: application/json");

	//Determine type content to return
if (array_key_exists('editorid' ,$_GET)) {
	$editorid =  mysql_real_escape_string($_GET['editorid']);
}
else {
	$editorid = null;
}

if (array_key_exists('formid' ,$_GET)) {
	$formid = mysql_real_escape_string($_GET['formid']);
}
else {
	$formid = null;
}

$query  = "SELECT formid, editorid, name, data ";
$query .= " FROM cellresource WHERE ";

if ($formid) {
	$query .= " formid=".$formid." ";
}
else if ($editorid) { 
	$query .= " editorid='".$editorid."' ";
}
else {
	$query = "SELECT editorid, name FROM cellresource ORDER BY name;";
	
	$query = mysql_query($query);
	$rowcount = mysql_num_rows($query);
	$count = 0;
	
	echo '{ "rowcount": '.$rowcount .', "resourcedata": [';
	
	while (($row=mysql_fetch_assoc($query))) {
		//echo '"editorid": '.$row['editorid'].', ';
		//echo '"name": "'.$row['name']. ', ';
		if ($count) echo ', ';
		echo '"'.$row['editorid'].'":"'.$row['name']. '"';
		$count++;
	}
	
	echo ' ], "listresources": 1 }';
	
	exit;
}

echo '{';

$query .= ';';
//echo '"query": "'. $query. '", ';
$query = mysql_query($query);
$rowcount = mysql_num_rows($query);
//echo '"rowcount": '. $rowcount .', ';

if (($row=mysql_fetch_assoc($query))) {
    echo '"formid": '.$row['formid'].', ';
    echo '"editorid": "'.$row['editorid'].'", ';
    echo '"name": "'.$row['name'].'", ';
    echo '"data": '.$row['data'].', ';
}
else {
	echo '"error": "No resource found!", ';
	if ($formid) echo '"formid": '. $formid .' ';
	else if ($editorid) echo '"editorid": "'. $editorid .'" ';
}

echo ' "listresources": 0 }';

?>
