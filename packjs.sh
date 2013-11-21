#!/bin/sh
#
# Combines all map v2 JavaScript files into one large one.
# Note: Do not use the pre-packed versions of the Google utility libraries
# as some modifications may have been made to them.
#

PACKCMD="java -jar /home/dave/bin/yuicompressor-2.4.8.jar"

cat markerwithlabel.js infobox.js flatprojection.js map2.js location.js label.js mapstate.js search.js cellresource.js map_noedit.js > map_combined_noedit.js
cat markerwithlabel.js infobox.js flatprojection.js map2.js location.js label.js mapstate.js search.js cellresource.js map_edit.js   > map_combined_edit.js

$PACKCMD map_combined_noedit.js -o map_packed_noedit.js --charset utf-8
$PACKCMD map_combined_edit.js   -o map_packed_edit.js   --charset utf-8

cp map_packed_edit.js map_packed.js
cp map_combined_edit.js map_combined.js

chown :uespadmin map_*.js
chmod g+w map_*.js
