<?php

if (array_key_exists('game' ,$_GET)) 
{
	$game = preg_replace("/[^A-Za-z0-9_]/", '', $_GET['game']);
}
else 
{
	if (strpos($_SERVER['PHP_SELF'],"obmap")) {
		$game = "ob";
	}
	else if (strpos($_SERVER['PHP_SELF'],"srmap"))
	{
		$game = "sr";
	}
	else if (strpos($_SERVER['PHP_SELF'],"simap")) {
		$game = "si";
	}
	else if (strpos($_SERVER['PHP_SELF'],"mwmap")) {
		$game = "mw";
	}
	else if (strpos($_SERVER['PHP_SELF'],"dbmap")) {
		$game = "db";
	}
	else if (strpos($_SERVER['PHP_SELF'],"apmap")) {
		$game = "ap";
	}
	else if (strpos($_SERVER['PHP_SELF'],"trmap") || strpos($_SERVER['PHP_SELF'],"tamrielrebuilt")) {
		$game = "tamrielrebuilt";
	}
	else {
		$game = "sr";
	}
}

if ($game == "tamrielrebuilt")
{
	$dbname = "tamrielrebuilt";
	require '/home/uesp/secrets/tamrielrebuilt.secrets';
}
else
{
	$dbname = $game . '_map_data';
	require '/home/uesp/secrets/maps.secrets';
}

$db = new mysqli($uespMapsReadDBHost, $uespMapsReadUser, $uespMapsReadPW, $dbname);
if (!$db) die("Could not connect to mysql database '$dbname'!");

      // Date in the past
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
header("content-type:text/xml");

	//Determine type content to return
if (array_key_exists('zoom' ,$_GET)) {
	$zoom =  $db->real_escape_string($_GET['zoom']);
}
else {
	$zoom = null;
}

if (array_key_exists('minzoom' ,$_GET)) {
	$minzoom =  $db->real_escape_string($_GET['minzoom']);
}
else {
	$minzoom = null;
}

if (array_key_exists('BottomLeftX' ,$_GET)) {
	$swx  = $db->real_escape_string($_GET['BottomLeftX']);
}
else {
	$swx = null;
}

if (array_key_exists('BottomLeftY' ,$_GET)) {
	$swy  = $db->real_escape_string($_GET['BottomLeftY']);
}
else {
	$swy = null;
}

if (array_key_exists('TopRightX' ,$_GET)) {
	$nex  = $db->real_escape_string($_GET['TopRightX']);
}
else {
	$nex = null;
}

if (array_key_exists('TopRightY' ,$_GET)) {
	$ney  = $db->real_escape_string($_GET['TopRightY']);
}
else {
	$ney = null;
}

if (array_key_exists('SearchText' ,$_GET)) {
	$search = $db->real_escape_string($_GET['SearchText']);
}
else {
	$search = null;
}

if (array_key_exists('StartRow' ,$_GET)) {
	$startrow = intval($db->real_escape_string($_GET['StartRow']));
}
else {
	$startrow = 0;
}

if (array_key_exists('ShowDisabled' ,$_GET)) {
	$showdisabled = $db->real_escape_string($_GET['ShowDisabled']);
}
else {
	$showdisabled = null;
}

if (array_key_exists('centeron' ,$_GET)) {
	$centeron = $db->real_escape_string($_GET['centeron']);
}
else {
	$centeron = null;
}

$limitcount = '50';

if ($minzoom == null) {
	$minzoom = 8;
}

$query = "SELECT SQL_CALC_FOUND_ROWS ID, ObLocX, ObLocY, ObLocZ, Name, MarkerType, DisplayLevel, LabelPosition, WikiPage, SearchTags, Enable";

if ($game == "mw" || $game == "tamrielrebuilt") {
	$query .= ", EditorID, Region, Namespace";
}
else if ($game == "sr" || $game == "db") {
	$query .= ", WorldSpace, EditorID, Region, Namespace";
}
else if ($game == "ob" || $game == "si") {
	$query .= ", EditorID, WorldSpace";
}
else {
}

$query .= " FROM mapdata WHERE ";

if ($showdisabled != null && (int)$showdisabled == 1) {
	$enablequery = " (Enable=0) ";
}
else if ($showdisabled != null && (int)$showdisabled == 2) {
	$enablequery = " 1 ";	
}
else {
	$enablequery = " (Enable=1) ";
}

if ($centeron) {
	$query .= $enablequery . " AND (Name='".$centeron."')";
}
else if ($search) { 
	$query .= '('. $enablequery . ' AND (INSTR(Name, "'.$search.'") != 0 OR INSTR(SearchTags, "'.$search.'") != 0))';
}
else if ($zoom != null && $swx != null && $swy != null && $nex != null && $ney != null) {
	$query .= "(DisplayLevel <= ".$zoom.") AND (DisplayLevel > ".$minzoom.") AND " . $enablequery . " AND (ObLocX >= ".$swx.") AND (ObLocX <= ".$nex.") AND (ObLocY >= ".$swy.") AND (ObLocY <= ".$ney.")";
}
else {
	$query .= $enablequery;
}

$query .= " ORDER BY Name ";

if ($centeron) {
	$query .= " LIMIT 1;";
}
else {
	$query .= " LIMIT ".$startrow.",".$limitcount.";";
}

//echo "<query>".urlencode($query)."</query>";
$query = $db->query($query);

$result = $db->query("SELECT FOUND_ROWS();");
$totalrows = 0;

if ($result)
{
	$totalrows = $result->fetch_row();
	if ($totalrows) $totalrows = $totalrows[0];
	if ($totalrows == null) $totalrows = 0;
	$rowcount = $result->num_rows;
}

echo "<locations>";
echo '<rowcount totalrows="'.$totalrows.'" rowcount="'.$rowcount.'" startrow="'.$startrow.'" />';
$count = 0;

while (($row=$query->fetch_assoc()))
{
        $tag = '<location id="'.$row['ID'].'" name="'.rawurlencode($row['Name']).'" X="'.$row['ObLocX'].'" Y="'.$row['ObLocY'].'" Z="'.$row['ObLocZ'].'" type="'.$row['MarkerType'].'" level="'.$row['DisplayLevel'].'" page="'.rawurlencode($row['WikiPage']).'" tags="'.rawurlencode($row['SearchTags']).'" labpos="'.$row['LabelPosition'];

	if ($game == "mw" || $game == "tamrielrebuilt") {
		$tag .= '" edid="'.rawurlencode($row['EditorID']).'" region="'.rawurlencode($row['Region']).'" ns="'.$row['Namespace'];
	}
	else {
		if (array_key_exists('WorldSpace', $row)) $tag .= '" ws="'.rawurlencode($row['WorldSpace']);
		if (array_key_exists('Namespace', $row)) $tag .= '" ns="'.rawurlencode($row['Namespace']);
		if (array_key_exists('Region', $row)) $tag .= '" region="'.rawurlencode($row['Region']);
		if (array_key_exists('EditorID', $row)) $tag .= '" edid="'.rawurlencode($row['EditorID']);
	}

	$tag .= '" en="'.$row['Enable'];
	$tag .= '"/>';
	echo $tag;
	$count = $count + 1;
}

echo "</locations>";

