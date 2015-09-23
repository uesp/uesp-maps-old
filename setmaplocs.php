<?php

// Configuration file that includes the database host, user, and passwords
require '/home/uesp/secrets/maps.secrets';
require 'UespMemcachedSession.php';

if (!$db = mysql_connect($uespMapsWriteDBHost, $uespMapsWriteUser, $uespMapsWritePW)) {
	echo '<error value="Could not connect to mysql" />';
	exit;
}

if (array_key_exists('game' ,$_GET)) {
	$game = mysql_real_escape_string($_GET['game']);
}
else {
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
	else {
		$game = "sr";
	}
}

$dbname = $game . '_map_data';

if (!mysql_select_db($dbname, $db)) {
	echo '<error value="Could not select database" />';
	exit;
}
      // Date in the past
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT"); 
      // always modified
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
      // HTTP/1.1
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
      // HTTP/1.0
header("Pragma: no-cache");
      //XML Header
//header("content-type:text/html");
header("content-type:text/xml");

$locdata = array();
	// Determine content to set
if (array_key_exists('id' ,$_GET)) {
	$locdata['ID'] = mysql_real_escape_string($_GET['id']);
}
if (array_key_exists('name' ,$_GET)) {
	$locdata['Name'] = mysql_real_escape_string($_GET['name']);
}
if (array_key_exists('x' ,$_GET)) {
	$locdata['ObLocX'] = mysql_real_escape_string($_GET['x']);
}
if (array_key_exists('y' ,$_GET)) {
	$locdata['ObLocY'] = mysql_real_escape_string($_GET['y']);
}
if (array_key_exists('z' ,$_GET)) {
	$locdata['ObLocZ'] = mysql_real_escape_string($_GET['z']);
}
if (array_key_exists('display' ,$_GET)) {
	$locdata['DisplayLevel'] = mysql_real_escape_string($_GET['display']);
}
if (array_key_exists('labpos' ,$_GET)) {
	$locdata['LabelPosition'] = mysql_real_escape_string($_GET['labpos']);
}
if (array_key_exists('type' ,$_GET)) {
	$locdata['MarkerType'] = mysql_real_escape_string($_GET['type']);
}
if (array_key_exists('ws' ,$_GET)) {
	$locdata['WorldSpace'] = mysql_real_escape_string($_GET['ws']);
}
if (array_key_exists('region' ,$_GET)) {
	$locdata['Region'] = mysql_real_escape_string($_GET['region']);
}
if (array_key_exists('ns' ,$_GET)) {
	$locdata['Namespace'] = mysql_real_escape_string($_GET['ns']);
}
if (array_key_exists('tags' ,$_GET)) {
	$locdata['SearchTags'] = mysql_real_escape_string($_GET['tags']);
}
if (array_key_exists('show' ,$_GET)) {
	$locdata['Enable'] = mysql_real_escape_string($_GET['show']);
}
if (array_key_exists('page' ,$_GET)) {
	$locdata['WikiPage'] = mysql_real_escape_string($_GET['page']);
}
if (array_key_exists('editid', $_GET)) {
	$locdata['EditorID'] = mysql_real_escape_string($_GET['editid']);
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

		$result = mysql_query($query);
		$rowcount = mysql_affected_rows();

		if ($result) {

			if ($isnew < 0) {
				$locdata['ID'] = mysql_insert_id();
			}

			echo "<result value='1' msg='Updated ".$rowcount." rows!' id='".$locdata['ID']."' />";
		} else {
			echo "<result value='0' msg='".urlencode(mysql_error())."' query='".urlencode($query)."'/>";
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
?>
