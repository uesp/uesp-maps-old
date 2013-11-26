#!/bin/sh
#
# Install script for the UESP maps. 
# 	Dave Humphrey (dave@uesp.net)
#	Created on 21 Nov 2013
#
# Run Format:
#
#	install.sh [path]
#
# ex:
#	install.sh /home/uesp/www/maps2/
#
# When run it will copy the map source files from the install directory to the
# specified path, overwriting all existing files. 
#
# Note that this script does *not* install any of the map tiles or the tile
# directories. 
#

NOW=$(date +"%Y%m%d%H%M%S")
BACKUPPATH="/tmp/backup-uespmap-$NOW"
SCRIPT=`readlink -e $0`
SCRIPTPATH=`dirname $SCRIPT`
INSTALLPATH=`readlink -f $1`

# Change the below to '-v' to display the files that rsync copies
VERBOSEOPT='-v'

if [ -z $INSTALLPATH ]; then
	echo "Error: Missing install path!"
	exit
fi

if [ $SCRIPTPATH == $INSTALLPATH ]; then
	echo "Error: Cannot install source onto itself!"
	exit
fi

if [ ! -d $INSTALLPATH ]; then
	echo "Error: Installation path does not exist!"
	exit
fi

echo "Installing UESP map source from $SCRIPTPATH to $INSTALLPATH."

while true; do
    read -p "Do you wish to continue (Y/N)?" input
    case $input in
        [Yy]* ) break;;
        [Nn]* ) exit;;
        * ) echo "    Please answer (Y)es or (N)o.";;
    esac
done

mkdir $BACKUPPATH

if [ -z $? ]; then
        echo "Error: Failed to create the backup path $BACKUPPATH!"
        exit
fi

rsync -am $VERBOSEOPT --compare-dest=$SCRIPTPATH/ --exclude='.hg*' --exclude='czoom*' --exclude='zoom*' $INSTALLPATH/ $BACKUPPATH/

if [ -z $? ]; then
        echo "Error: Failed to backup the existing map source to $BACKUPPATH!"
        exit
fi

echo "Backed up any old map source in the installation path to $BACKUPPATH."

rsync -a $VERBOSEOPT --exclude='.hg*' $SCRIPTPATH/ $INSTALLPATH/


if [ -z $? ]; then
	echo "Error: There were one or more errors installing the UESP map source to $INSTALLPATH!"
	exit
fi

# Delete old files manually until I find a better way without risking
# removing something by accident.
rm -f $INSTALLPATH/maphelp.html.old
rm -f $INSTALLPATH/srmap/getmaplocs.php
rm -f $INSTALLPATH/srmap/setmaplocs.php
rm -f $INSTALLPATH/srmap/getcellsources.php
rm -f $INSTALLPATH/dbmap/getmaplocs.php
rm -f $INSTALLPATH/dbmap/setmaplocs.php
rm -f $INSTALLPATH/simap/getmaplocs.php
rm -f $INSTALLPATH/simap/setmaplocs.php
rm -f $INSTALLPATH/obmap/getmaplocs.php
rm -f $INSTALLPATH/obmap/setmaplocs.php
rm -f $INSTALLPATH/mwmap/getmaplocs.php
rm -f $INSTALLPATH/mwmap/setmaplocs.php

echo "Finished installing the UESP map source to $INSTALLPATH."

