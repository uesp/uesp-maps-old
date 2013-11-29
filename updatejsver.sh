#!/bin/sh
#
# Changes the JS version number in all the map HTML files.
# by Dave Humphrey (dave@uesp.net)
#
# Usage:
#	updatejsver.sh
#       updatejsver.sh [label]
#
# Without an explicit version label the current date in the format YYYY-MM-DD will be used.
#

INPUTVER="$1"

if [ -z $INPUTVER ]; then
	NOW=`date +'%Y-%m-%d'`
	INPUTVER="$NOW"
fi

echo "Changing map JS version to '$INPUTVER'..."

sed -i "s/\(\.js?\)\(.*\)\(\"><\/script>\)/\1$INPUTVER\3/g" ./dbmap/dbmap.html
sed -i "s/\(\.js?\)\(.*\)\(\"><\/script>\)/\1$INPUTVER\3/g" ./obmap/obmap.html
sed -i "s/\(\.js?\)\(.*\)\(\"><\/script>\)/\1$INPUTVER\3/g" ./mwmap/mwmap.html
sed -i "s/\(\.js?\)\(.*\)\(\"><\/script>\)/\1$INPUTVER\3/g" ./simap/simap.html
sed -i "s/\(\.js?\)\(.*\)\(\"><\/script>\)/\1$INPUTVER\3/g" ./srmap/srmap.html
