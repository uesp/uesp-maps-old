<?php

require 'UespMemcachedSession.php';

header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("content-type:text/xml");

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

$db = new mysqli($uespMapsWriteDBHost, $uespMapsWriteUser, $uespMapsWritePW, $dbname);
if (!$db) die("Could not connect to mysql database '$dbname'!");

$locdata = array();
	// Determine content to set
if (array_key_exists('id' ,$_GET)) {
	$locdata['ID'] = $db->real_escape_string($_GET['id']);
}
if (array_key_exists('name' ,$_GET)) {
	$locdata['Name'] = $db->real_escape_string($_GET['name']);
}
if (array_key_exists('x' ,$_GET)) {
	$locdata['ObLocX'] = $db->real_escape_string($_GET['x']);
}
if (array_key_exists('y' ,$_GET)) {
	$locdata['ObLocY'] = $db->real_escape_string($_GET['y']);
}
if (array_key_exists('z' ,$_GET)) {
	$locdata['ObLocZ'] = $db->real_escape_string($_GET['z']);
}
if (array_key_exists('display' ,$_GET)) {
	$locdata['DisplayLevel'] = $db->real_escape_string($_GET['display']);
}
if (array_key_exists('labpos' ,$_GET)) {
	$locdata['LabelPosition'] = $db->real_escape_string($_GET['labpos']);
}
if (array_key_exists('type' ,$_GET)) {
	$locdata['MarkerType'] = $db->real_escape_string($_GET['type']);
}
if (array_key_exists('ws' ,$_GET)) {
	$locdata['WorldSpace'] = $db->real_escape_string($_GET['ws']);
}
if (array_key_exists('region' ,$_GET)) {
	$locdata['Region'] = $db->real_escape_string($_GET['region']);
}
if (array_key_exists('ns' ,$_GET)) {
	$locdata['Namespace'] = $db->real_escape_string($_GET['ns']);
}
if (array_key_exists('tags' ,$_GET)) {
	$locdata['SearchTags'] = $db->real_escape_string($_GET['tags']);
}
if (array_key_exists('show' ,$_GET)) {
	$locdata['Enable'] = $db->real_escape_string($_GET['show']);
}
if (array_key_exists('page' ,$_GET)) {
	$locdata['WikiPage'] = $db->real_escape_string($_GET['page']);
}
if (array_key_exists('editid', $_GET)) {
	$locdata['EditorID'] = $db->real_escape_string($_GET['editid']);
}

if ($game == "mw") {
	if (array_key_exists('WorldSpace', $locdata)) unset($locdata['WorldSpace']);
}
else if ($game == "si" || $game == "ob") {
	if (array_key_exists('Namespace', $locdata)) unset($locdata['Namespace']);
	if (array_key_exists('Region', $locdata)) unset($locdata['Region']);
}
else if ($game == "db" || $game == "sr") {
}

echo "<results>";

UespMemcachedSession::install();
session_name('uesp_net_wiki5_session');
session_start();

//echo $_SESSION['mapedit'];
//echo "\n";
//echo session_id();

if ($_SESSION['mapedit'] != 1) {
	echo "<result value='0' msg='You don`t have permission to update! ".$_SESSION['mapedit']."' id='".session_id()."' />";
}
else if (array_key_exists('ID',$locdata)) {
	$isnew = (int) $locdata['ID'];

	if ($isnew < 0) {
		$query = "INSERT INTO mapdata SET ";
	}
	else {
		$query = "UPDATE mapdata SET ";
	}

	$setquery = "";
	foreach ($locdata as $key => $value) {
		if ($key=='ID' && $value<0)
			continue;
		if ($setquery) $setquery .= ", ";
		$setquery .= $key."=";
		if (substr($key,0,5) == "ObLoc" || $key == "DisplayLevel" || $key == "LabelPosition" || $key == "MarkerType" || $key == "Enable") {
			$setquery .= $value;
		}
		else {
			$setquery .= "'".$value."'";
		}
	}

	if ($setquery) {

		if ($isnew < 0) {
			$query .= " ".$setquery." ;";
		} else {
			$query .= " ".$setquery." WHERE ID=".$locdata['ID'].";";
		}

		$result = $db->query($query);
		$rowcount = $db->affected_rows;

		if ($result) {

			if ($isnew < 0) {
				$locdata['ID'] = $db->insert_id;
			}

			echo "<result value='1' msg='Updated ".$rowcount." rows!' id='".$locdata['ID']."' />";
		} else {
			echo "<result value='0' msg='".urlencode($db->error)."' query='".urlencode($query)."'/>";
		}
	} else {
		echo "<result value='0' msg='Nothing to update!'/>";
	}

}
else {
	echo "<result value='0' msg='Nothing to update!'/>";
}

echo "</results>";

session_write_close();
