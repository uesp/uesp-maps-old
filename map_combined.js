/**
 * @name MarkerWithLabel for V3
 * @version 1.1.8 [February 26, 2013]
 * @author Gary Little (inspired by code from Marc Ridey of Google).
 * @copyright Copyright 2012 Gary Little [gary at luxcentral.com]
 * @fileoverview MarkerWithLabel extends the Google Maps JavaScript API V3
 *  <code>google.maps.Marker</code> class.
 *  <p>
 *  MarkerWithLabel allows you to define markers with associated labels. As you would expect,
 *  if the marker is draggable, so too will be the label. In addition, a marker with a label
 *  responds to all mouse events in the same manner as a regular marker. It also fires mouse
 *  events and "property changed" events just as a regular marker would. Version 1.1 adds
 *  support for the raiseOnDrag feature introduced in API V3.3.
 *  <p>
 *  If you drag a marker by its label, you can cancel the drag and return the marker to its
 *  original position by pressing the <code>Esc</code> key. This doesn't work if you drag the marker
 *  itself because this feature is not (yet) supported in the <code>google.maps.Marker</code> class.
 */

/*!
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jslint browser:true */
/*global document,google */

/**
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
function inherits(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  /** @override */
  childCtor.prototype.constructor = childCtor;
}

/**
 * This constructor creates a label and associates it with a marker.
 * It is for the private use of the MarkerWithLabel class.
 * @constructor
 * @param {Marker} marker The marker with which the label is to be associated.
 * @param {string} crossURL The URL of the cross image =.
 * @param {string} handCursor The URL of the hand cursor.
 * @private
 */
function MarkerLabel_(marker, crossURL, handCursorURL) {
  this.marker_ = marker;
  this.handCursorURL_ = marker.handCursorURL;

  this.labelDiv_ = document.createElement("div");
  this.labelDiv_.style.cssText = "position: absolute; overflow: hidden;";

  // Set up the DIV for handling mouse events in the label. This DIV forms a transparent veil
  // in the "overlayMouseTarget" pane, a veil that covers just the label. This is done so that
  // events can be captured even if the label is in the shadow of a google.maps.InfoWindow.
  // Code is included here to ensure the veil is always exactly the same size as the label.
  this.eventDiv_ = document.createElement("div");
  this.eventDiv_.style.cssText = this.labelDiv_.style.cssText;

  // This is needed for proper behavior on MSIE:
  this.eventDiv_.setAttribute("onselectstart", "return false;");
  this.eventDiv_.setAttribute("ondragstart", "return false;");

  // Get the DIV for the "X" to be displayed when the marker is raised.
  this.crossDiv_ = MarkerLabel_.getSharedCross(crossURL);
}
inherits(MarkerLabel_, google.maps.OverlayView);

/**
 * Returns the DIV for the cross used when dragging a marker when the
 * raiseOnDrag parameter set to true. One cross is shared with all markers.
 * @param {string} crossURL The URL of the cross image =.
 * @private
 */
MarkerLabel_.getSharedCross = function (crossURL) {
  var div;
  if (typeof MarkerLabel_.getSharedCross.crossDiv === "undefined") {
    div = document.createElement("img");
    div.style.cssText = "position: absolute; z-index: 1000002; display: none;";
    // Hopefully Google never changes the standard "X" attributes:
    div.style.marginLeft = "-8px";
    div.style.marginTop = "-9px";
    div.src = crossURL;
    MarkerLabel_.getSharedCross.crossDiv = div;
  }
  return MarkerLabel_.getSharedCross.crossDiv;
};

/**
 * Adds the DIV representing the label to the DOM. This method is called
 * automatically when the marker's <code>setMap</code> method is called.
 * @private
 */
MarkerLabel_.prototype.onAdd = function () {
  var me = this;
  var cMouseIsDown = false;
  var cDraggingLabel = false;
  var cSavedZIndex;
  var cLatOffset, cLngOffset;
  var cIgnoreClick;
  var cRaiseEnabled;
  var cStartPosition;
  var cStartCenter;
  // Constants:
  var cRaiseOffset = 20;
  var cDraggingCursor = "url(" + this.handCursorURL_ + ")";

  // Stops all processing of an event.
  //
  var cAbortEvent = function (e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.cancelBubble = true;
    if (e.stopPropagation) {
      e.stopPropagation();
    }
  };

  var cStopBounce = function () {
    me.marker_.setAnimation(null);
  };

  this.getPanes().overlayImage.appendChild(this.labelDiv_);
  this.getPanes().overlayMouseTarget.appendChild(this.eventDiv_);
  // One cross is shared with all markers, so only add it once:
  if (typeof MarkerLabel_.getSharedCross.processed === "undefined") {
    this.getPanes().overlayImage.appendChild(this.crossDiv_);
    MarkerLabel_.getSharedCross.processed = true;
  }

  this.listeners_ = [
    google.maps.event.addDomListener(this.eventDiv_, "mouseover", function (e) {
      if (me.marker_.getDraggable() || me.marker_.getClickable()) {
        this.style.cursor = "pointer";
        google.maps.event.trigger(me.marker_, "mouseover", e);
      }
    }),
    google.maps.event.addDomListener(this.eventDiv_, "mouseout", function (e) {
      if ((me.marker_.getDraggable() || me.marker_.getClickable()) && !cDraggingLabel) {
        this.style.cursor = me.marker_.getCursor();
        google.maps.event.trigger(me.marker_, "mouseout", e);
      }
    }),
    google.maps.event.addDomListener(this.eventDiv_, "mousedown", function (e) {
      cDraggingLabel = false;
      if (me.marker_.getDraggable()) {
        cMouseIsDown = true;
        this.style.cursor = cDraggingCursor;
      }
      if (me.marker_.getDraggable() || me.marker_.getClickable()) {
        google.maps.event.trigger(me.marker_, "mousedown", e);
        cAbortEvent(e); // Prevent map pan when starting a drag on a label
      }
    }),
    google.maps.event.addDomListener(document, "mouseup", function (mEvent) {
      var position;
      if (cMouseIsDown) {
        cMouseIsDown = false;
        me.eventDiv_.style.cursor = "pointer";
        google.maps.event.trigger(me.marker_, "mouseup", mEvent);
      }
      if (cDraggingLabel) {
        if (cRaiseEnabled) { // Lower the marker & label
          position = me.getProjection().fromLatLngToDivPixel(me.marker_.getPosition());
          position.y += cRaiseOffset;
          me.marker_.setPosition(me.getProjection().fromDivPixelToLatLng(position));
          // This is not the same bouncing style as when the marker portion is dragged,
          // but it will have to do:
          try { // Will fail if running Google Maps API earlier than V3.3
            me.marker_.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(cStopBounce, 1406);
          } catch (e) {}
        }
        me.crossDiv_.style.display = "none";
        me.marker_.setZIndex(cSavedZIndex);
        cIgnoreClick = true; // Set flag to ignore the click event reported after a label drag
        cDraggingLabel = false;
        mEvent.latLng = me.marker_.getPosition();
        google.maps.event.trigger(me.marker_, "dragend", mEvent);
      }
    }),
    google.maps.event.addListener(me.marker_.getMap(), "mousemove", function (mEvent) {
      var position;
      if (cMouseIsDown) {
        if (cDraggingLabel) {
          // Change the reported location from the mouse position to the marker position:
          mEvent.latLng = new google.maps.LatLng(mEvent.latLng.lat() - cLatOffset, mEvent.latLng.lng() - cLngOffset);
          position = me.getProjection().fromLatLngToDivPixel(mEvent.latLng);
          if (cRaiseEnabled) {
            me.crossDiv_.style.left = position.x + "px";
            me.crossDiv_.style.top = position.y + "px";
            me.crossDiv_.style.display = "";
            position.y -= cRaiseOffset;
          }
          me.marker_.setPosition(me.getProjection().fromDivPixelToLatLng(position));
          if (cRaiseEnabled) { // Don't raise the veil; this hack needed to make MSIE act properly
            me.eventDiv_.style.top = (position.y + cRaiseOffset) + "px";
          }
          google.maps.event.trigger(me.marker_, "drag", mEvent);
        } else {
          // Calculate offsets from the click point to the marker position:
          cLatOffset = mEvent.latLng.lat() - me.marker_.getPosition().lat();
          cLngOffset = mEvent.latLng.lng() - me.marker_.getPosition().lng();
          cSavedZIndex = me.marker_.getZIndex();
          cStartPosition = me.marker_.getPosition();
          cStartCenter = me.marker_.getMap().getCenter();
          cRaiseEnabled = me.marker_.get("raiseOnDrag");
          cDraggingLabel = true;
          me.marker_.setZIndex(1000000); // Moves the marker & label to the foreground during a drag
          mEvent.latLng = me.marker_.getPosition();
          google.maps.event.trigger(me.marker_, "dragstart", mEvent);
        }
      }
    }),
    google.maps.event.addDomListener(document, "keydown", function (e) {
      if (cDraggingLabel) {
        if (e.keyCode === 27) { // Esc key
          cRaiseEnabled = false;
          me.marker_.setPosition(cStartPosition);
          me.marker_.getMap().setCenter(cStartCenter);
          google.maps.event.trigger(document, "mouseup", e);
        }
      }
    }),
    google.maps.event.addDomListener(this.eventDiv_, "click", function (e) {
      if (me.marker_.getDraggable() || me.marker_.getClickable()) {
        if (cIgnoreClick) { // Ignore the click reported when a label drag ends
          cIgnoreClick = false;
        } else {
          google.maps.event.trigger(me.marker_, "click", e);
          cAbortEvent(e); // Prevent click from being passed on to map
        }
      }
    }),
    google.maps.event.addDomListener(this.eventDiv_, "dblclick", function (e) {
      if (me.marker_.getDraggable() || me.marker_.getClickable()) {
        //google.maps.event.trigger(me.marker_, "dblclick", e);
        //cAbortEvent(e); // Prevent map zoom when double-clicking on a label
      }
    }),
    google.maps.event.addListener(this.marker_, "dragstart", function (mEvent) {
      if (!cDraggingLabel) {
        cRaiseEnabled = this.get("raiseOnDrag");
      }
    }),
    google.maps.event.addListener(this.marker_, "drag", function (mEvent) {
      if (!cDraggingLabel) {
        if (cRaiseEnabled) {
          me.setPosition(cRaiseOffset);
          // During a drag, the marker's z-index is temporarily set to 1000000 to
          // ensure it appears above all other markers. Also set the label's z-index
          // to 1000000 (plus or minus 1 depending on whether the label is supposed
          // to be above or below the marker).
          me.labelDiv_.style.zIndex = 1000000 + (this.get("labelInBackground") ? -1 : +1);
        }
      }
    }),
    google.maps.event.addListener(this.marker_, "dragend", function (mEvent) {
      if (!cDraggingLabel) {
        if (cRaiseEnabled) {
          me.setPosition(0); // Also restores z-index of label
        }
      }
    }),
    google.maps.event.addListener(this.marker_, "position_changed", function () {
      me.setPosition();
    }),
    google.maps.event.addListener(this.marker_, "zindex_changed", function () {
      me.setZIndex();
    }),
    google.maps.event.addListener(this.marker_, "visible_changed", function () {
      me.setVisible();
    }),
    google.maps.event.addListener(this.marker_, "labelvisible_changed", function () {
      me.setVisible();
    }),
    google.maps.event.addListener(this.marker_, "title_changed", function () {
      me.setTitle();
    }),
    google.maps.event.addListener(this.marker_, "labelcontent_changed", function () {
      me.setContent();
    }),
    google.maps.event.addListener(this.marker_, "labelanchor_changed", function () {
      me.setAnchor();
    }),
    google.maps.event.addListener(this.marker_, "labelclass_changed", function () {
      me.setStyles();
    }),
    google.maps.event.addListener(this.marker_, "labelstyle_changed", function () {
      me.setStyles();
    })
  ];
};

/**
 * Removes the DIV for the label from the DOM. It also removes all event handlers.
 * This method is called automatically when the marker's <code>setMap(null)</code>
 * method is called.
 * @private
 */
MarkerLabel_.prototype.onRemove = function () {
  var i;
  this.labelDiv_.parentNode.removeChild(this.labelDiv_);
  this.eventDiv_.parentNode.removeChild(this.eventDiv_);

  // Remove event listeners:
  for (i = 0; i < this.listeners_.length; i++) {
    google.maps.event.removeListener(this.listeners_[i]);
  }
};

/**
 * Draws the label on the map.
 * @private
 */
MarkerLabel_.prototype.draw = function () {
  this.setContent();
  this.setTitle();
  this.setStyles();
};

/**
 * Sets the content of the label.
 * The content can be plain text or an HTML DOM node.
 * @private
 */
MarkerLabel_.prototype.setContent = function () {
  var content = this.marker_.get("labelContent");
  if (typeof content.nodeType === "undefined") {
    this.labelDiv_.innerHTML = content;
    this.eventDiv_.innerHTML = this.labelDiv_.innerHTML;
  } else {
    this.labelDiv_.innerHTML = ""; // Remove current content
    this.labelDiv_.appendChild(content);
    content = content.cloneNode(true);
    this.eventDiv_.appendChild(content);
  }
};

/**
 * Sets the content of the tool tip for the label. It is
 * always set to be the same as for the marker itself.
 * @private
 */
MarkerLabel_.prototype.setTitle = function () {
  this.eventDiv_.title = this.marker_.getTitle() || "";
};

/**
 * Sets the style of the label by setting the style sheet and applying
 * other specific styles requested.
 * @private
 */
MarkerLabel_.prototype.setStyles = function () {
  var i, labelStyle;

  // Apply style values from the style sheet defined in the labelClass parameter:
  this.labelDiv_.className = this.marker_.get("labelClass");
  this.eventDiv_.className = this.labelDiv_.className;

  // Clear existing inline style values:
  this.labelDiv_.style.cssText = "";
  this.eventDiv_.style.cssText = "";
  // Apply style values defined in the labelStyle parameter:
  labelStyle = this.marker_.get("labelStyle");
  for (i in labelStyle) {
    if (labelStyle.hasOwnProperty(i)) {
      this.labelDiv_.style[i] = labelStyle[i];
      this.eventDiv_.style[i] = labelStyle[i];
    }
  }
  this.setMandatoryStyles();
};

/**
 * Sets the mandatory styles to the DIV representing the label as well as to the
 * associated event DIV. This includes setting the DIV position, z-index, and visibility.
 * @private
 */
MarkerLabel_.prototype.setMandatoryStyles = function () {
  this.labelDiv_.style.position = "absolute";
  this.labelDiv_.style.overflow = "hidden";
  // Make sure the opacity setting causes the desired effect on MSIE:
  if (typeof this.labelDiv_.style.opacity !== "undefined" && this.labelDiv_.style.opacity !== "") {
    this.labelDiv_.style.MsFilter = "\"progid:DXImageTransform.Microsoft.Alpha(opacity=" + (this.labelDiv_.style.opacity * 100) + ")\"";
    this.labelDiv_.style.filter = "alpha(opacity=" + (this.labelDiv_.style.opacity * 100) + ")";
  }

  this.eventDiv_.style.position = this.labelDiv_.style.position;
  this.eventDiv_.style.overflow = this.labelDiv_.style.overflow;
  this.eventDiv_.style.opacity = 0.01; // Don't use 0; DIV won't be clickable on MSIE
  this.eventDiv_.style.MsFilter = "\"progid:DXImageTransform.Microsoft.Alpha(opacity=1)\"";
  this.eventDiv_.style.filter = "alpha(opacity=1)"; // For MSIE

  this.setAnchor();
  this.setPosition(); // This also updates z-index, if necessary.
  this.setVisible();
};

/**
 * Sets the anchor point of the label.
 * @private
 */
MarkerLabel_.prototype.setAnchor = function () {
  var anchor = this.marker_.get("labelAnchor");
  this.labelDiv_.style.marginLeft = -anchor.x + "px";
  this.labelDiv_.style.marginTop = -anchor.y + "px";
  this.eventDiv_.style.marginLeft = -anchor.x + "px";
  this.eventDiv_.style.marginTop = -anchor.y + "px";
};

/**
 * Sets the position of the label. The z-index is also updated, if necessary.
 * @private
 */
MarkerLabel_.prototype.setPosition = function (yOffset) {
  var position = this.getProjection().fromLatLngToDivPixel(this.marker_.getPosition());
  if (typeof yOffset === "undefined") {
    yOffset = 0;
  }
  this.labelDiv_.style.left = Math.round(position.x) + "px";
  this.labelDiv_.style.top = Math.round(position.y - yOffset) + "px";
  this.eventDiv_.style.left = this.labelDiv_.style.left;
  this.eventDiv_.style.top = this.labelDiv_.style.top;

  this.setZIndex();
};

/**
 * Sets the z-index of the label. If the marker's z-index property has not been defined, the z-index
 * of the label is set to the vertical coordinate of the label. This is in keeping with the default
 * stacking order for Google Maps: markers to the south are in front of markers to the north.
 * @private
 */
MarkerLabel_.prototype.setZIndex = function () {
  var zAdjust = (this.marker_.get("labelInBackground") ? -1 : +1);
  if (typeof this.marker_.getZIndex() === "undefined") {
    this.labelDiv_.style.zIndex = parseInt(this.labelDiv_.style.top, 10) + zAdjust;
    this.eventDiv_.style.zIndex = this.labelDiv_.style.zIndex;
  } else {
    this.labelDiv_.style.zIndex = this.marker_.getZIndex() + zAdjust;
    this.eventDiv_.style.zIndex = this.labelDiv_.style.zIndex;
  }
};

/**
 * Sets the visibility of the label. The label is visible only if the marker itself is
 * visible (i.e., its visible property is true) and the labelVisible property is true.
 * @private
 */
MarkerLabel_.prototype.setVisible = function () {
  if (this.marker_.get("labelVisible")) {
    this.labelDiv_.style.display = this.marker_.getVisible() ? "block" : "none";
  } else {
    this.labelDiv_.style.display = "none";
  }
  this.eventDiv_.style.display = this.labelDiv_.style.display;
};

/**
 * @name MarkerWithLabelOptions
 * @class This class represents the optional parameter passed to the {@link MarkerWithLabel} constructor.
 *  The properties available are the same as for <code>google.maps.Marker</code> with the addition
 *  of the properties listed below. To change any of these additional properties after the labeled
 *  marker has been created, call <code>google.maps.Marker.set(propertyName, propertyValue)</code>.
 *  <p>
 *  When any of these properties changes, a property changed event is fired. The names of these
 *  events are derived from the name of the property and are of the form <code>propertyname_changed</code>.
 *  For example, if the content of the label changes, a <code>labelcontent_changed</code> event
 *  is fired.
 *  <p>
 * @property {string|Node} [labelContent] The content of the label (plain text or an HTML DOM node).
 * @property {Point} [labelAnchor] By default, a label is drawn with its anchor point at (0,0) so
 *  that its top left corner is positioned at the anchor point of the associated marker. Use this
 *  property to change the anchor point of the label. For example, to center a 50px-wide label
 *  beneath a marker, specify a <code>labelAnchor</code> of <code>google.maps.Point(25, 0)</code>.
 *  (Note: x-values increase to the right and y-values increase to the top.)
 * @property {string} [labelClass] The name of the CSS class defining the styles for the label.
 *  Note that style values for <code>position</code>, <code>overflow</code>, <code>top</code>,
 *  <code>left</code>, <code>zIndex</code>, <code>display</code>, <code>marginLeft</code>, and
 *  <code>marginTop</code> are ignored; these styles are for internal use only.
 * @property {Object} [labelStyle] An object literal whose properties define specific CSS
 *  style values to be applied to the label. Style values defined here override those that may
 *  be defined in the <code>labelClass</code> style sheet. If this property is changed after the
 *  label has been created, all previously set styles (except those defined in the style sheet)
 *  are removed from the label before the new style values are applied.
 *  Note that style values for <code>position</code>, <code>overflow</code>, <code>top</code>,
 *  <code>left</code>, <code>zIndex</code>, <code>display</code>, <code>marginLeft</code>, and
 *  <code>marginTop</code> are ignored; these styles are for internal use only.
 * @property {boolean} [labelInBackground] A flag indicating whether a label that overlaps its
 *  associated marker should appear in the background (i.e., in a plane below the marker).
 *  The default is <code>false</code>, which causes the label to appear in the foreground.
 * @property {boolean} [labelVisible] A flag indicating whether the label is to be visible.
 *  The default is <code>true</code>. Note that even if <code>labelVisible</code> is
 *  <code>true</code>, the label will <i>not</i> be visible unless the associated marker is also
 *  visible (i.e., unless the marker's <code>visible</code> property is <code>true</code>).
 * @property {boolean} [raiseOnDrag] A flag indicating whether the label and marker are to be
 *  raised when the marker is dragged. The default is <code>true</code>. If a draggable marker is
 *  being created and a version of Google Maps API earlier than V3.3 is being used, this property
 *  must be set to <code>false</code>.
 * @property {boolean} [optimized] A flag indicating whether rendering is to be optimized for the
 *  marker. <b>Important: The optimized rendering technique is not supported by MarkerWithLabel,
 *  so the value of this parameter is always forced to <code>false</code>.
 * @property {string} [crossImage="http://maps.gstatic.com/intl/en_us/mapfiles/drag_cross_67_16.png"]
 *  The URL of the cross image to be displayed while dragging a marker.
 * @property {string} [handCursor="http://maps.gstatic.com/intl/en_us/mapfiles/closedhand_8_8.cur"]
 *  The URL of the cursor to be displayed while dragging a marker.
 */
/**
 * Creates a MarkerWithLabel with the options specified in {@link MarkerWithLabelOptions}.
 * @constructor
 * @param {MarkerWithLabelOptions} [opt_options] The optional parameters.
 */
function MarkerWithLabel(opt_options) {
  opt_options = opt_options || {};
  opt_options.labelContent = opt_options.labelContent || "";
  opt_options.labelAnchor = opt_options.labelAnchor || new google.maps.Point(0, 0);
  opt_options.labelClass = opt_options.labelClass || "markerLabels";
  opt_options.labelStyle = opt_options.labelStyle || {};
  opt_options.labelInBackground = opt_options.labelInBackground || false;
  if (typeof opt_options.labelVisible === "undefined") {
    opt_options.labelVisible = true;
  }
  if (typeof opt_options.raiseOnDrag === "undefined") {
    opt_options.raiseOnDrag = true;
  }
  if (typeof opt_options.clickable === "undefined") {
    opt_options.clickable = true;
  }
  if (typeof opt_options.draggable === "undefined") {
    opt_options.draggable = false;
  }
  if (typeof opt_options.optimized === "undefined") {
    opt_options.optimized = false;
  }
  opt_options.crossImage = opt_options.crossImage || "http" + (document.location.protocol === "https:" ? "s" : "") + "://maps.gstatic.com/intl/en_us/mapfiles/drag_cross_67_16.png";
  opt_options.handCursor = opt_options.handCursor || "http" + (document.location.protocol === "https:" ? "s" : "") + "://maps.gstatic.com/intl/en_us/mapfiles/closedhand_8_8.cur";
  opt_options.optimized = false; // Optimized rendering is not supported

  this.label = new MarkerLabel_(this, opt_options.crossImage, opt_options.handCursor); // Bind the label to the marker

  // Call the parent constructor. It calls Marker.setValues to initialize, so all
  // the new parameters are conveniently saved and can be accessed with get/set.
  // Marker.set triggers a property changed event (called "propertyname_changed")
  // that the marker label listens for in order to react to state changes.
  google.maps.Marker.apply(this, arguments);
}
inherits(MarkerWithLabel, google.maps.Marker);

/**
 * Overrides the standard Marker setMap function.
 * @param {Map} theMap The map to which the marker is to be added.
 * @private
 */
MarkerWithLabel.prototype.setMap = function (theMap) {

  // Call the inherited function...
  google.maps.Marker.prototype.setMap.apply(this, arguments);

  // ... then deal with the label:
  this.label.setMap(theMap);
};
/**
 * @name InfoBox
 * @version 1.1.9 [October 2, 2011]
 * @author Gary Little (inspired by proof-of-concept code from Pamela Fox of Google)
 * @copyright Copyright 2010 Gary Little [gary at luxcentral.com]
 * @fileoverview InfoBox extends the Google Maps JavaScript API V3 <tt>OverlayView</tt> class.
 *  <p>
 *  An InfoBox behaves like a <tt>google.maps.InfoWindow</tt>, but it supports several
 *  additional properties for advanced styling. An InfoBox can also be used as a map label.
 *  <p>
 *  An InfoBox also fires the same events as a <tt>google.maps.InfoWindow</tt>.
 *  <p>
 *  Browsers tested:
 *  <p>
 *  Mac -- Safari (4.0.4), Firefox (3.6), Opera (10.10), Chrome (4.0.249.43), OmniWeb (5.10.1)
 *  <br>
 *  Win -- Safari, Firefox, Opera, Chrome (3.0.195.38), Internet Explorer (8.0.6001.18702)
 *  <br>
 *  iPod Touch/iPhone -- Safari (3.1.2)
 */

/*!
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jslint browser:true */
/*global google */

/**
 * @name InfoBoxOptions
 * @class This class represents the optional parameter passed to the {@link InfoBox} constructor.
 * @property {string|Node} content The content of the InfoBox (plain text or an HTML DOM node).
 * @property {boolean} disableAutoPan Disable auto-pan on <tt>open</tt> (default is <tt>false</tt>).
 * @property {number} maxWidth The maximum width (in pixels) of the InfoBox. Set to 0 if no maximum.
 * @property {Size} pixelOffset The offset (in pixels) from the top left corner of the InfoBox
 *  (or the bottom left corner if the <code>alignBottom</code> property is <code>true</code>)
 *  to the map pixel corresponding to <tt>position</tt>.
 * @property {LatLng} position The geographic location at which to display the InfoBox.
 * @property {number} zIndex The CSS z-index style value for the InfoBox.
 *  Note: This value overrides a zIndex setting specified in the <tt>boxStyle</tt> property.
 * @property {string} boxClass The name of the CSS class defining the styles for the InfoBox container.
 *  The default name is <code>infoBox</code>.
 * @property {Object} [boxStyle] An object literal whose properties define specific CSS
 *  style values to be applied to the InfoBox. Style values defined here override those that may
 *  be defined in the <code>boxClass</code> style sheet. If this property is changed after the
 *  InfoBox has been created, all previously set styles (except those defined in the style sheet)
 *  are removed from the InfoBox before the new style values are applied.
 * @property {string} closeBoxMargin The CSS margin style value for the close box.
 *  The default is "2px" (a 2-pixel margin on all sides).
 * @property {string} closeBoxURL The URL of the image representing the close box.
 *  Note: The default is the URL for Google's standard close box.
 *  Set this property to "" if no close box is required.
 * @property {Size} infoBoxClearance Minimum offset (in pixels) from the InfoBox to the
 *  map edge after an auto-pan.
 * @property {boolean} isHidden Hide the InfoBox on <tt>open</tt> (default is <tt>false</tt>).
 * @property {boolean} alignBottom Align the bottom left corner of the InfoBox to the <code>position</code>
 *  location (default is <tt>false</tt> which means that the top left corner of the InfoBox is aligned).
 * @property {string} pane The pane where the InfoBox is to appear (default is "floatPane").
 *  Set the pane to "mapPane" if the InfoBox is being used as a map label.
 *  Valid pane names are the property names for the <tt>google.maps.MapPanes</tt> object.
 * @property {boolean} enableEventPropagation Propagate mousedown, click, dblclick,
 *  and contextmenu events in the InfoBox (default is <tt>false</tt> to mimic the behavior
 *  of a <tt>google.maps.InfoWindow</tt>). Set this property to <tt>true</tt> if the InfoBox
 *  is being used as a map label. iPhone note: This property setting has no effect; events are
 *  always propagated.
 */

/**
 * Creates an InfoBox with the options specified in {@link InfoBoxOptions}.
 *  Call <tt>InfoBox.open</tt> to add the box to the map.
 * @constructor
 * @param {InfoBoxOptions} [opt_opts]
 */
function InfoBox(opt_opts) {

  opt_opts = opt_opts || {};

  google.maps.OverlayView.apply(this, arguments);

  // Standard options (in common with google.maps.InfoWindow):
  //
  this.content_ = opt_opts.content || "";
  this.disableAutoPan_ = opt_opts.disableAutoPan || false;
  this.maxWidth_ = opt_opts.maxWidth || 0;
  this.pixelOffset_ = opt_opts.pixelOffset || new google.maps.Size(0, 0);
  this.position_ = opt_opts.position || new google.maps.LatLng(0, 0);
  this.zIndex_ = opt_opts.zIndex || null;

  // Additional options (unique to InfoBox):
  //
  this.boxClass_ = opt_opts.boxClass || "infoBox";
  this.boxStyle_ = opt_opts.boxStyle || {};
  this.closeBoxMargin_ = opt_opts.closeBoxMargin || "2px";
  this.closeBoxURL_ = opt_opts.closeBoxURL || "//www.google.com/intl/en_us/mapfiles/close.gif";
  if (opt_opts.closeBoxURL === "") {
    this.closeBoxURL_ = "";
  }
  this.infoBoxClearance_ = opt_opts.infoBoxClearance || new google.maps.Size(1, 1);
  this.isHidden_ = opt_opts.isHidden || false;
  this.alignBottom_ = opt_opts.alignBottom || false;
  this.pane_ = opt_opts.pane || "floatPane";
  this.enableEventPropagation_ = opt_opts.enableEventPropagation || false;

  this.div_ = null;
  this.closeListener_ = null;
  this.eventListener1_ = null;
  this.eventListener2_ = null;
  this.eventListener3_ = null;
  this.moveListener_ = null;
  this.contextListener_ = null;
  this.fixedWidthSet_ = null;
}

/* InfoBox extends OverlayView in the Google Maps API v3.
 */
InfoBox.prototype = new google.maps.OverlayView();

/**
 * Creates the DIV representing the InfoBox.
 * @private
 */
InfoBox.prototype.createInfoBoxDiv_ = function () {

  var bw;
  var me = this;

  // This handler prevents an event in the InfoBox from being passed on to the map.
  //
  var cancelHandler = function (e) {
    e.cancelBubble = true;

    if (e.stopPropagation) {

      e.stopPropagation();
    }
  };

  // This handler ignores the current event in the InfoBox and conditionally prevents
  // the event from being passed on to the map. It is used for the contextmenu event.
  //
  var ignoreHandler = function (e) {

    e.returnValue = false;

    if (e.preventDefault) {

      e.preventDefault();
    }

    if (!me.enableEventPropagation_) {

      cancelHandler(e);
    }
  };

  if (!this.div_) {

    this.div_ = document.createElement("div");

    this.setBoxStyle_();

    if (typeof this.content_.nodeType === "undefined") {
      this.div_.innerHTML = this.getCloseBoxImg_() + this.content_;
    } else {
      this.div_.innerHTML = this.getCloseBoxImg_();
      this.div_.appendChild(this.content_);
    }

    // Add the InfoBox DIV to the DOM
    this.getPanes()[this.pane_].appendChild(this.div_);

    this.addClickHandler_();

    if (this.div_.style.width) {

      this.fixedWidthSet_ = true;

    } else {

      if (this.maxWidth_ !== 0 && this.div_.offsetWidth > this.maxWidth_) {

        this.div_.style.width = this.maxWidth_;
        this.div_.style.overflow = "auto";
        this.fixedWidthSet_ = true;

      } else { // The following code is needed to overcome problems with MSIE

        bw = this.getBoxWidths_();

        this.div_.style.width = (this.div_.offsetWidth - bw.left - bw.right) + "px";
        this.fixedWidthSet_ = false;
      }
    }

    this.panBox_(this.disableAutoPan_);

    if (!this.enableEventPropagation_) {

      // Cancel event propagation.
      //
      this.eventListener1_ = google.maps.event.addDomListener(this.div_, "mousedown", cancelHandler);
      this.eventListener2_ = google.maps.event.addDomListener(this.div_, "click", cancelHandler);
      this.eventListener3_ = google.maps.event.addDomListener(this.div_, "dblclick", cancelHandler);
      this.eventListener4_ = google.maps.event.addDomListener(this.div_, "mouseover", function (e) {
        this.style.cursor = "default";
      });
    }

    this.contextListener_ = google.maps.event.addDomListener(this.div_, "contextmenu", ignoreHandler);

    /**
     * This event is fired when the DIV containing the InfoBox's content is attached to the DOM.
     * @name InfoBox#domready
     * @event
     */
    google.maps.event.trigger(this, "domready");
  }
};

/**
 * Returns the HTML <IMG> tag for the close box.
 * @private
 */
InfoBox.prototype.getCloseBoxImg_ = function () {

  var img = "";

  if (this.closeBoxURL_ !== "") {

    img  = "<img";
    img += " src='" + this.closeBoxURL_ + "'";
    img += " align=right"; // Do this because Opera chokes on style='float: right;'
    img += " style='";
    img += " position: relative;"; // Required by MSIE
    img += " cursor: pointer;";
    img += " margin: " + this.closeBoxMargin_ + ";";
    img += "'>";
  }

  return img;
};

/**
 * Adds the click handler to the InfoBox close box.
 * @private
 */
InfoBox.prototype.addClickHandler_ = function () {

  var closeBox;

  if (this.closeBoxURL_ !== "") {

    closeBox = this.div_.firstChild;
    this.closeListener_ = google.maps.event.addDomListener(closeBox, 'click', this.getCloseClickHandler_());

  } else {

    this.closeListener_ = null;
  }
};

/**
 * Returns the function to call when the user clicks the close box of an InfoBox.
 * @private
 */
InfoBox.prototype.getCloseClickHandler_ = function () {

  var me = this;

  return function (e) {

    // 1.0.3 fix: Always prevent propagation of a close box click to the map:
    e.cancelBubble = true;

    if (e.stopPropagation) {

      e.stopPropagation();
    }

    me.close();

    /**
     * This event is fired when the InfoBox's close box is clicked.
     * @name InfoBox#closeclick
     * @event
     */
    google.maps.event.trigger(me, "closeclick");
  };
};

/**
 * Pans the map so that the InfoBox appears entirely within the map's visible area.
 * @private
 */
InfoBox.prototype.panBox_ = function (disablePan) {

  var map;
  var bounds;
  var xOffset = 0, yOffset = 0;

  if (!disablePan) {

    map = this.getMap();

    if (map instanceof google.maps.Map) { // Only pan if attached to map, not panorama

      if (!map.getBounds().contains(this.position_)) {
      // Marker not in visible area of map, so set center
      // of map to the marker position first.
        map.setCenter(this.position_);
      }

      bounds = map.getBounds();

      var mapDiv = map.getDiv();
      var mapWidth = mapDiv.offsetWidth;
      var mapHeight = mapDiv.offsetHeight;
      var iwOffsetX = this.pixelOffset_.width;
      var iwOffsetY = this.pixelOffset_.height;
      var iwWidth = this.div_.offsetWidth;
      var iwHeight = this.div_.offsetHeight;
      var padX = this.infoBoxClearance_.width;
      var padY = this.infoBoxClearance_.height;
      var pixPosition = this.getProjection().fromLatLngToContainerPixel(this.position_);

      if (pixPosition.x < (-iwOffsetX + padX)) {
        xOffset = pixPosition.x + iwOffsetX - padX;
      } else if ((pixPosition.x + iwWidth + iwOffsetX + padX) > mapWidth) {
        xOffset = pixPosition.x + iwWidth + iwOffsetX + padX - mapWidth;
      }
      if (this.alignBottom_) {
        if (pixPosition.y < (-iwOffsetY + padY + iwHeight)) {
          yOffset = pixPosition.y + iwOffsetY - padY - iwHeight;
        } else if ((pixPosition.y + iwOffsetY + padY) > mapHeight) {
          yOffset = pixPosition.y + iwOffsetY + padY - mapHeight;
        }
      } else {
        if (pixPosition.y < (-iwOffsetY + padY)) {
          yOffset = pixPosition.y + iwOffsetY - padY;
        } else if ((pixPosition.y + iwHeight + iwOffsetY + padY) > mapHeight) {
          yOffset = pixPosition.y + iwHeight + iwOffsetY + padY - mapHeight;
        }
      }

      if (!(xOffset === 0 && yOffset === 0)) {

        // Move the map to the shifted center.
        //
        var c = map.getCenter();
        map.panBy(xOffset, yOffset);
      }
    }
  }
};

/**
 * Sets the style of the InfoBox by setting the style sheet and applying
 * other specific styles requested.
 * @private
 */
InfoBox.prototype.setBoxStyle_ = function () {

  var i, boxStyle;

  if (this.div_) {

    // Apply style values from the style sheet defined in the boxClass parameter:
    this.div_.className = this.boxClass_;

    // Clear existing inline style values:
    this.div_.style.cssText = "";

    // Apply style values defined in the boxStyle parameter:
    boxStyle = this.boxStyle_;
    for (i in boxStyle) {

      if (boxStyle.hasOwnProperty(i)) {

        this.div_.style[i] = boxStyle[i];
      }
    }

    // Fix up opacity style for benefit of MSIE:
    //
    if (typeof this.div_.style.opacity !== "undefined" && this.div_.style.opacity !== "") {

      this.div_.style.filter = "alpha(opacity=" + (this.div_.style.opacity * 100) + ")";
    }

    // Apply required styles:
    //
    this.div_.style.position = "absolute";
    this.div_.style.visibility = 'hidden';
    if (this.zIndex_ !== null) {

      this.div_.style.zIndex = this.zIndex_;
    }
  }
};

/**
 * Get the widths of the borders of the InfoBox.
 * @private
 * @return {Object} widths object (top, bottom left, right)
 */
InfoBox.prototype.getBoxWidths_ = function () {

  var computedStyle;
  var bw = {top: 0, bottom: 0, left: 0, right: 0};
  var box = this.div_;

  if (document.defaultView && document.defaultView.getComputedStyle) {

    computedStyle = box.ownerDocument.defaultView.getComputedStyle(box, "");

    if (computedStyle) {

      // The computed styles are always in pixel units (good!)
      bw.top = parseInt(computedStyle.borderTopWidth, 10) || 0;
      bw.bottom = parseInt(computedStyle.borderBottomWidth, 10) || 0;
      bw.left = parseInt(computedStyle.borderLeftWidth, 10) || 0;
      bw.right = parseInt(computedStyle.borderRightWidth, 10) || 0;
    }

  } else if (document.documentElement.currentStyle) { // MSIE

    if (box.currentStyle) {

      // The current styles may not be in pixel units, but assume they are (bad!)
      bw.top = parseInt(box.currentStyle.borderTopWidth, 10) || 0;
      bw.bottom = parseInt(box.currentStyle.borderBottomWidth, 10) || 0;
      bw.left = parseInt(box.currentStyle.borderLeftWidth, 10) || 0;
      bw.right = parseInt(box.currentStyle.borderRightWidth, 10) || 0;
    }
  }

  return bw;
};

/**
 * Invoked when <tt>close</tt> is called. Do not call it directly.
 */
InfoBox.prototype.onRemove = function () {

  if (this.div_) {

    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
  }
};

/**
 * Draws the InfoBox based on the current map projection and zoom level.
 */
InfoBox.prototype.draw = function () {

  this.createInfoBoxDiv_();

  var pixPosition = this.getProjection().fromLatLngToDivPixel(this.position_);

  this.div_.style.left = (pixPosition.x + this.pixelOffset_.width) + "px";
  
  if (this.alignBottom_) {
    this.div_.style.bottom = -(pixPosition.y + this.pixelOffset_.height) + "px";
  } else {
    this.div_.style.top = (pixPosition.y + this.pixelOffset_.height) + "px";
  }

  if (this.isHidden_) {

    this.div_.style.visibility = 'hidden';

  } else {

    this.div_.style.visibility = "visible";
  }
};

/**
 * Sets the options for the InfoBox. Note that changes to the <tt>maxWidth</tt>,
 *  <tt>closeBoxMargin</tt>, <tt>closeBoxURL</tt>, and <tt>enableEventPropagation</tt>
 *  properties have no affect until the current InfoBox is <tt>close</tt>d and a new one
 *  is <tt>open</tt>ed.
 * @param {InfoBoxOptions} opt_opts
 */
InfoBox.prototype.setOptions = function (opt_opts) {
  if (typeof opt_opts.boxClass !== "undefined") { // Must be first

    this.boxClass_ = opt_opts.boxClass;
    this.setBoxStyle_();
  }
  if (typeof opt_opts.boxStyle !== "undefined") { // Must be second

    this.boxStyle_ = opt_opts.boxStyle;
    this.setBoxStyle_();
  }
  if (typeof opt_opts.content !== "undefined") {

    this.setContent(opt_opts.content);
  }
  if (typeof opt_opts.disableAutoPan !== "undefined") {

    this.disableAutoPan_ = opt_opts.disableAutoPan;
  }
  if (typeof opt_opts.maxWidth !== "undefined") {

    this.maxWidth_ = opt_opts.maxWidth;
  }
  if (typeof opt_opts.pixelOffset !== "undefined") {

    this.pixelOffset_ = opt_opts.pixelOffset;
  }
  if (typeof opt_opts.alignBottom !== "undefined") {

    this.alignBottom_ = opt_opts.alignBottom;
  }
  if (typeof opt_opts.position !== "undefined") {

    this.setPosition(opt_opts.position);
  }
  if (typeof opt_opts.zIndex !== "undefined") {

    this.setZIndex(opt_opts.zIndex);
  }
  if (typeof opt_opts.closeBoxMargin !== "undefined") {

    this.closeBoxMargin_ = opt_opts.closeBoxMargin;
  }
  if (typeof opt_opts.closeBoxURL !== "undefined") {

    this.closeBoxURL_ = opt_opts.closeBoxURL;
  }
  if (typeof opt_opts.infoBoxClearance !== "undefined") {

    this.infoBoxClearance_ = opt_opts.infoBoxClearance;
  }
  if (typeof opt_opts.isHidden !== "undefined") {

    this.isHidden_ = opt_opts.isHidden;
  }
  if (typeof opt_opts.enableEventPropagation !== "undefined") {

    this.enableEventPropagation_ = opt_opts.enableEventPropagation;
  }

  if (this.div_) {

    this.draw();
  }
};

/**
 * Sets the content of the InfoBox.
 *  The content can be plain text or an HTML DOM node.
 * @param {string|Node} content
 */
InfoBox.prototype.setContent = function (content) {
  this.content_ = content;

  if (this.div_) {

    if (this.closeListener_) {

      google.maps.event.removeListener(this.closeListener_);
      this.closeListener_ = null;
    }

    // Odd code required to make things work with MSIE.
    //
    if (!this.fixedWidthSet_) {

      this.div_.style.width = "";
    }

    if (typeof content.nodeType === "undefined") {
      this.div_.innerHTML = this.getCloseBoxImg_() + content;
    } else {
      this.div_.innerHTML = this.getCloseBoxImg_();
      this.div_.appendChild(content);
    }

    // Perverse code required to make things work with MSIE.
    // (Ensures the close box does, in fact, float to the right.)
    //
    if (!this.fixedWidthSet_) {
      this.div_.style.width = this.div_.offsetWidth + "px";
      if (typeof content.nodeType === "undefined") {
        this.div_.innerHTML = this.getCloseBoxImg_() + content;
      } else {
        this.div_.innerHTML = this.getCloseBoxImg_();
        this.div_.appendChild(content);
      }
    }

    this.addClickHandler_();
  }

  /**
   * This event is fired when the content of the InfoBox changes.
   * @name InfoBox#content_changed
   * @event
   */
  google.maps.event.trigger(this, "content_changed");
};

/**
 * Sets the geographic location of the InfoBox.
 * @param {LatLng} latlng
 */
InfoBox.prototype.setPosition = function (latlng) {

  this.position_ = latlng;

  if (this.div_) {

    this.draw();
  }

  /**
   * This event is fired when the position of the InfoBox changes.
   * @name InfoBox#position_changed
   * @event
   */
  google.maps.event.trigger(this, "position_changed");
};

/**
 * Sets the zIndex style for the InfoBox.
 * @param {number} index
 */
InfoBox.prototype.setZIndex = function (index) {

  this.zIndex_ = index;

  if (this.div_) {

    this.div_.style.zIndex = index;
  }

  /**
   * This event is fired when the zIndex of the InfoBox changes.
   * @name InfoBox#zindex_changed
   * @event
   */
  google.maps.event.trigger(this, "zindex_changed");
};

/**
 * Returns the content of the InfoBox.
 * @returns {string}
 */
InfoBox.prototype.getContent = function () {

  return this.content_;
};

/**
 * Returns the geographic location of the InfoBox.
 * @returns {LatLng}
 */
InfoBox.prototype.getPosition = function () {

  return this.position_;
};

/**
 * Returns the zIndex for the InfoBox.
 * @returns {number}
 */
InfoBox.prototype.getZIndex = function () {

  return this.zIndex_;
};

/**
 * Shows the InfoBox.
 */
InfoBox.prototype.show = function () {

  this.isHidden_ = false;
  if (this.div_) {
    this.div_.style.visibility = "visible";
  }
};

/**
 * Hides the InfoBox.
 */
InfoBox.prototype.hide = function () {

  this.isHidden_ = true;
  if (this.div_) {
    this.div_.style.visibility = "hidden";
  }
};

/**
 * Adds the InfoBox to the specified map or Street View panorama. If <tt>anchor</tt>
 *  (usually a <tt>google.maps.Marker</tt>) is specified, the position
 *  of the InfoBox is set to the position of the <tt>anchor</tt>. If the
 *  anchor is dragged to a new location, the InfoBox moves as well.
 * @param {Map|StreetViewPanorama} map
 * @param {MVCObject} [anchor]
 */
InfoBox.prototype.open = function (map, anchor) {

  var me = this;

  if (anchor) {

    this.position_ = anchor.getPosition();
    this.moveListener_ = google.maps.event.addListener(anchor, "position_changed", function () {
      me.setPosition(this.getPosition());
    });
  }

  this.setMap(map);

  if (this.div_) {

    this.panBox_();
  }
};

/**
 * Removes the InfoBox from the map.
 */
InfoBox.prototype.close = function () {

  if (this.closeListener_) {

    google.maps.event.removeListener(this.closeListener_);
    this.closeListener_ = null;
  }

  if (this.eventListener1_) {

    google.maps.event.removeListener(this.eventListener1_);
    google.maps.event.removeListener(this.eventListener2_);
    google.maps.event.removeListener(this.eventListener3_);
    google.maps.event.removeListener(this.eventListener4_);
    this.eventListener1_ = null;
    this.eventListener2_ = null;
    this.eventListener3_ = null;
    this.eventListener4_ = null;
  }

  if (this.moveListener_) {

    google.maps.event.removeListener(this.moveListener_);
    this.moveListener_ = null;
  }

  if (this.contextListener_) {

    google.maps.event.removeListener(this.contextListener_);
    this.contextListener_ = null;
  }

  this.setMap(null);
};
//
// Flat map projection for the UESP game maps.
//

function CEuclideanProjection() {
	var EUCLIDEAN_RANGE = 256;
	this.pixelOrigin_ = new google.maps.Point(EUCLIDEAN_RANGE / 2, EUCLIDEAN_RANGE / 2);
	this.pixelsPerLonDegree_ = EUCLIDEAN_RANGE / 360;
	this.pixelsPerLonRadian_ = EUCLIDEAN_RANGE / (2 * Math.PI);
	this.scaleLat = 2;	// Height
	this.scaleLng = 1;	// Width
	this.offsetLat = 0;	// Height
	this.offsetLng = 0;	// Width
}
 
CEuclideanProjection.prototype.fromLatLngToPoint = function(latLng, opt_point) {
	var point = opt_point || new google.maps.Point(0, 0);
	
	var origin = this.pixelOrigin_;
	point.x = (origin.x + (latLng.lng() + this.offsetLng ) * this.scaleLng * this.pixelsPerLonDegree_);
	// NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
	// 89.189.  This is about a third of a tile past the edge of the world tile.
	point.y = (origin.y + (-1 * latLng.lat() + this.offsetLat ) * this.scaleLat * this.pixelsPerLonDegree_);

	return point;
};
 
CEuclideanProjection.prototype.fromPointToLatLng = function(point) {
	var me = this;
	
	var origin = me.pixelOrigin_;
	var lng = (((point.x - origin.x) / me.pixelsPerLonDegree_) / this.scaleLng) - this.offsetLng;
	var lat = ((-1 *( point.y - origin.y) / me.pixelsPerLonDegree_) / this.scaleLat) - this.offsetLat;
	return new google.maps.LatLng(lat , lng, true);
};

	// Global map objects
var umMap;
var umCustomMapType;
var umMapTileLayer;
var umLocations = [];
var umCellGridLines = [];
var umCellGridLabels = [];
var umCreatedCellGrid = false;
var umLastGridLabelUpdate = false;
var umWaitingForReponse = 0;
var umSkipUpdate = false;
var umIsOffline = false;

if (window.umEncodeURI == null)
{
	var umEncodeURI = true;
}


	// Define the custom options for the game map
var umMapTypeOptions = 
{
		getTileUrl:	umGetMapTile,
		tileSize:	new google.maps.Size(256, 256),
		maxZoom:	umMaxMapZoom,
		minZoom:	umMinMapZoom,
		name:		"Day",
};

	// Create the game map type object
var umCustomMapType = new google.maps.ImageMapType(umMapTypeOptions);
umCustomMapType.projection = new CEuclideanProjection();

var umNightMapTypeOptions = 
{
		getTileUrl:	umGetNightMapTile,
		tileSize:	new google.maps.Size(256, 256),
		maxZoom:	umMaxMapZoom,
		minZoom:	umMinMapZoom,
		name:		"Night",
};

var umCustomNightMapType = new google.maps.ImageMapType(umNightMapTypeOptions);
umCustomNightMapType.projection = new CEuclideanProjection();

var umSimpleMapTypeOptions = 
{
		getTileUrl:	umGetSimpleMapTile,
		tileSize:	new google.maps.Size(256, 256),
		maxZoom:	umMaxMapZoom,
		minZoom:	umMinMapZoom,
		name:		"Simple",
};

var umCustomSimpleMapType = new google.maps.ImageMapType(umSimpleMapTypeOptions);
umCustomSimpleMapType.projection = new CEuclideanProjection();

	// Main map setup function
function umSetupMap() {
	
	var EnableMapControl = umEnableNightMap || umEnableSimpleMap;
	var MapTypes = [ "Day"];
	
	if (umEnableNightMap) MapTypes.push("Night");
	if (umEnableSimpleMap) MapTypes.push("Simple");
	
	var mapOptions = {
			center:	umMapDefaultCenter,
			zoom:	umMapDefaultZoom,
			streetViewControl: false,
			disableDoubleClickZoom: true,
			
			overviewMapControl: true,		// No current way of adjusting zoom level of overview map
			overviewMapControlOptions: {
				position: google.maps.ControlPosition.BOTTOM_RIGHT,
				opened: false
			},
			
			mapTypeControl: EnableMapControl,
			mapTypeControlOptions: {
				style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
				position: google.maps.ControlPosition.TOP_RIGHT,
				mapTypeIds: MapTypes
			},

			panControl: true,
			panControlOptions: {
				position: google.maps.ControlPosition.TOP_RIGHT
			},

			zoomControl: true,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.LARGE,
				position: google.maps.ControlPosition.TOP_RIGHT
			},

			scaleControl: false,
			scaleControlOptions: {
				position: google.maps.ControlPosition.TOP_LEFT
			},
	};
	
	umMap = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	umMap.mapTypes.set(umWikiNameSpace, umCustomMapType);
	umMap.setMapTypeId(umWikiNameSpace);
	
	umMap.mapTypes.set("Day", umCustomMapType);
	if (umEnableSimpleMap) umMap.mapTypes.set("Simple", umCustomSimpleMapType);
	if (umEnableNightMap)  umMap.mapTypes.set("Night",  umCustomNightMapType);
	umMap.setMapTypeId('Day');
	
	var InputValues = umGetInputValues();
	
	google.maps.event.addListenerOnce(umMap, 'idle', function(){
		umUpdateMapFromInput(InputValues);
		umUpdateShowHideCellGrid();
		umGetMarkers();
		umUpdateLink();
		umSetupEditMap();
		
		google.maps.event.addListener(umMap,'bounds_changed', function() {
			umUpdateDiffMarkers(); 
			umUpdateCellGridLabelsZoom(); 
		} );
		
		google.maps.event.addListener(umMap,'center_changed', function() {
			umCheckMapBounds();
		});
		
		google.maps.event.addListener(umMap,'zoom_changed', function() { 
			umUpdateCellGridLabelsZoom();
		});
		
		google.maps.event.addListener(umMap,'dblclick', umCenterMapOnClick);
	});
	
}


function umCenterMapOnClick (MouseEvent)
{
	if (MouseEvent.latLng !== undefined && MouseEvent.latLng !== null) umMap.panTo(MouseEvent.latLng);
}


	// Creates the grid of cell lines
function umCreateCellGrid(ShowGrid)
{
	var X;
	var Y;
	var MapX;
	var MapY;
	var CellX;
	var CellY;
	var StartLatLng;
	var EndLatLng;
	var LinePoints;
	var LineOptions;
	var Line;
	
	ShowGrid = typeof ShowGrid !== 'undefined' ? ShowGrid : umMapState.ShowCells;
	
	var DefaultLineOptions = {
		strokeColor :	"#ffff00",
		strokeOpacity :	0.5,
		strokeWeight :	1,
		clickable :		false,
		draggable :		false,
		editable :		false,
		geodesic :		false,
		map :			umMap,
		visible :		true,
		zIndex :		100,
	};

	var DefaultLabelOptions = {
		boxStyle: {
			border:		"none",
			textAlign:	"left",
			fontSize:	"8pt",
			color:		"#ffff00",
			opacity:	0.5,
			zIndex:		500,
		},
		disableAutoPan :	true,
		pixelOffset :		new google.maps.Size(0, -2),
		closeBoxURL :		"",
		isHidden :			true,
		pane :				"mapPane",
		enableEventPropagation : true,
	};

		// Create the vertical cell grid lines
	for (CellX = umMinCellX; CellX <= umMaxCellX; CellX++) {
		X = CellX * umCellSize;
		MapX = umConvertXLocToLng(X);
		StartLatLng = new google.maps.LatLng(umMapBounds.getSouthWest().lat(), MapX);
		EndLatLng = new google.maps.LatLng(umMapBounds.getNorthEast().lat(), MapX);
		LinePoints = new google.maps.MVCArray([StartLatLng, EndLatLng]);
		
		LineOptions = DefaultLineOptions;
		LineOptions.path = LinePoints;
		Line = new google.maps.Polyline(LineOptions);
		
		umCellGridLines.push(Line);
	}
	
		// Create the horizontal cell grid lines
	for (CellY = umMinCellY; CellY <= umMaxCellY; CellY++) {
		Y = CellY * umCellSize;
		MapY = umConvertYLocToLat(Y);
		StartLatLng = new google.maps.LatLng(MapY, umMapBounds.getSouthWest().lng());
		EndLatLng = new google.maps.LatLng(MapY, umMapBounds.getNorthEast().lng());
		LinePoints = new google.maps.MVCArray([StartLatLng, EndLatLng]);
		
		LineOptions = DefaultLineOptions;
		LineOptions.path = LinePoints;
		Line = new google.maps.Polyline(LineOptions);
		
		umCellGridLines.push(Line);
	}
	
		// Create the cell labels
	for (CellY = Math.ceil(umMinCellY/umCellGridLabelSpacing)*umCellGridLabelSpacing; CellY <= umMaxCellY; CellY += umCellGridLabelSpacing) {
		Y = (CellY + 1) * umCellSize;
		MapY = umConvertYLocToLat(Y);
		
		for (CellX = Math.ceil(umMinCellX/umCellGridLabelSpacing)*umCellGridLabelSpacing; CellX <= umMaxCellX; CellX += umCellGridLabelSpacing) {
			X = CellX * umCellSize;
			MapX = umConvertXLocToLng(X);
			var LabelLatLng = new google.maps.LatLng(MapY, MapX);
			
			var LabelOptions = DefaultLabelOptions;
			LabelOptions.position = LabelLatLng;
			LabelOptions.content  = CellX + "," + (CellY);
			var CellLabel = new InfoBox(LabelOptions);
			CellLabel.open(umMap);
			
			umCellGridLabels.push(CellLabel);
		}
	}
	
	umCreatedCellGrid = true;
}


	// Changes the class name of a DOM object
function umChangeClass(object, oldClass, newClass)
{
		// remove
	var regExp = new RegExp('(?:^|\\s)' + oldClass + '(?!\\S)', 'g');
	object.className = object.className.replace( regExp, '');
	
		// replace
	//var regExp = new RegExp('(?:^|\\s)' + oldClass + '(?!\\S)', 'g');
	//object.className = object.className.replace( regExp , newClass );
	
		// add
	object.className += " " + newClass;
}


	// UI onClick() event
function umOnShowHideCellGrid(Element)
{
	umMapState.ShowCells = !umMapState.ShowCells;
	umUpdateShowHideCellGrid(Element);
	umUpdateLink();
}


	// Updates the cell grid UI state
function umUpdateShowHideCellGrid(Element)
{
	Element = typeof Element !== 'undefined' ? Element : document.getElementById('umShowCellGrid');
	
	umShowHideCellGrid(umMapState.ShowCells);
	
	if (Element === null) return;
	
	if (umMapState.ShowCells) {
		Element.innerHTML = "Hide Cell Grid";
		umChangeClass(Element, "umCellGridHidden", "umCellGridVisible");
	}
	else {
		Element.innerHTML = "Show Cell Grid";
		umChangeClass(Element, "umCellGridVisible", "umCellGridHidden");
	}
	
}


	// Show/hide the grid labels based on current map zoom level
function umUpdateCellGridLabelsZoom()
{
	var ShowGridLabel = umMapState.ShowCells && umMapState.Zoom >= umMinZoomCellLabels;
	if (umLastGridLabelUpdate == ShowGridLabel) return;
	
	for (var i = 0; i < umCellGridLabels.length; i++) {
		if (ShowGridLabel)
			umCellGridLabels[i].show();
		else
			umCellGridLabels[i].hide();
	}
	
	umLastGridLabelUpdate = ShowGridLabel;
}


	// Show or hide the cell grid and labels
function umShowHideCellGrid(ShowGrid)
{
	if (!umCreatedCellGrid) {
		if (!ShowGrid) return;
		umCreateCellGrid(ShowGrid);
	}
	
	for (var i = 0; i < umCellGridLines.length; i++) {
		umCellGridLines[i].setVisible(ShowGrid);
	}
	
	umUpdateCellGridLabelsZoom();
}


	// Parses input parameters and returns them in an array
function umGetInputValues()
{
	var InputValues = [];
	
	var RawInputParams = umSplitURLParams();
	
	InputValues.lat = umGetURLParam('lat');
	InputValues.lng = umGetURLParam("lng");
	InputValues.zoom = umGetURLParam("zoom");
	InputValues.locx = umGetURLParam("locx");
	
	if (!InputValues.locx || InputValues.locx === "") {
		InputValues.locx = umGetURLParam("oblocx");
	}
	
	InputValues.locy = umGetURLParam("locy");
	
	if (!InputValues.locy || InputValues.locy === "") {
		InputValues.locy = umGetURLParam("oblocy");
	}
	
	InputValues.cellx = umGetURLParam("cellx");
	InputValues.celly = umGetURLParam("celly");
	InputValues.search = umGetURLParam("search");
	InputValues.startsearch = umGetURLParam("startsearch");
	InputValues.centeron = umGetURLParam("centeron");
	InputValues.showresults = umGetURLParam("showresults");
	InputValues.showcells = umGetURLParam('showcells');
	InputValues.showsearch = umGetURLParam('showsearch');
	InputValues.showdisabled = umGetURLParam('showdisabled');
	InputValues.showinfo = umGetURLParam('showinfo');
	InputValues.disablecontrols = umGetURLParam('disablecontrols');
	InputValues.edit = umGetURLParam('edit');
	InputValues.cellresource = umGetURLParam('cellresource');
	
	return InputValues;
}


	// Unsures the map stays in bounds when moving/zooming around
function umCheckMapBounds() 
{
	allowedBounds = umMapBounds;
	
	if( !allowedBounds.contains(umMap.getCenter()) ) {
		var C = umMap.getCenter();
		var X = C.lng();
		var Y = C.lat();

		var AmaxX = allowedBounds.getNorthEast().lng();
		var AmaxY = allowedBounds.getNorthEast().lat();
		var AminX = allowedBounds.getSouthWest().lng();
		var AminY = allowedBounds.getSouthWest().lat();

		if (X < AminX) {X = AminX;}
		if (X > AmaxX) {X = AmaxX;}
		if (Y < AminY) {Y = AminY;}
		if (Y > AmaxY) {Y = AmaxY;}

		umMap.setCenter(new google.maps.LatLng(Y,X));
	}
}


	// Convert a game location to a map longitude
function umConvertXLocToLng(X) 
{
	var Lng = -180.0 + ((X/umCellSize + umCellOffsetX)/65536.0 * 360.0);
	return Lng;
}


	// Convert a game location to a map latitude
function umConvertYLocToLat(Y) 
{
	var Lat = 90.0 - ((umCellOffsetY - Y/umCellSize)/65536.0 * 180.0);
	return Lat;
}


	// Convert a game location to a map latitude/longitude
function umConvertLocToLatLng(X, Y) 
{
	var Lng = -180.0 + ((X/umCellSize + umCellOffsetX)/65536.0 * 360.0);
	var Lat = 90.0 - ((umCellOffsetY - Y/umCellSize)/65536.0 * 180.0);
	return new google.maps.LatLng(Lat, Lng);
}


	// Convert a longitude to an game X location
function umConvertLngToLocX(Lng) 
{
	if (Lng > 0) Lng = -180.0;
	if (Lng < umMapBounds.getSouthWest().lng()) Lng = umMapBounds.getSouthWest().lng();
	if (Lng > umMapBounds.getNorthEast().lng()) Lng = umMapBounds.getNorthEast().lng();
	return (((Lng + 180.0) * 65536.0 / 360.0 - umCellOffsetX) * umCellSize);
}


	// Convert a latitude to a game Y location
function umConvertLatToLocY(Lat) 
{
	if (Lat < 0) Lat = 90.0;
	if (Lat < umMapBounds.getSouthWest().lat()) Lat = umMapBounds.getSouthWest().lat();
	if (Lat > umMapBounds.getNorthEast().lat()) Lat = umMapBounds.getNorthEast().lat();
	return (((90.0 - Lat) * 65536.0 / 180.0  - umCellOffsetY) * - umCellSize);
}


	// Custom map image tile function
function umGetMapTile(coord, zoom)
{
	if (zoom >= umMinMapZoom && zoom <= umMaxMapZoom) {
		var MaxX = Math.floor(umNumMapTilesX/Math.pow(2, umBaseMapZoom - zoom));
		var MaxY = Math.floor(umNumMapTilesY/Math.pow(2, umBaseMapZoom - zoom));

		if (coord.x < MaxX && coord.y < MaxY && coord.x >= 0 && coord.y >= 0) {
			return umImagePath + umGameDir + umTilePathPrefix + zoom + "/" + umMapImagePrefix +  "-" + coord.x + "-" + coord.y + "-" + zoom + ".jpg";
		}
	}

	return umImagePath + umOorMapTile;
}


function umGetNightMapTile(coord, zoom)
{
	if (zoom >= umMinMapZoom && zoom <= umMaxMapZoom) {
		var MaxX = Math.floor(umNumMapTilesX/Math.pow(2, umBaseMapZoom - zoom));
		var MaxY = Math.floor(umNumMapTilesY/Math.pow(2, umBaseMapZoom - zoom));

		if (coord.x < MaxX && coord.y < MaxY && coord.x >= 0 && coord.y >= 0) {
			return umImagePath + umGameDir + "/night/zoom" + zoom + "/" + umMapImagePrefix +  "-" + coord.x + "-" + coord.y + "-" + zoom + ".jpg";
		}
	}

	return umImagePath + umOorNightMapTile;
}


function umGetSimpleMapTile(coord, zoom)
{
	if (zoom >= umMinMapZoom && zoom <= umMaxMapZoom) {
		var MaxX = Math.floor(umNumMapTilesX/Math.pow(2, umBaseMapZoom - zoom));
		var MaxY = Math.floor(umNumMapTilesY/Math.pow(2, umBaseMapZoom - zoom));

		if (coord.x < MaxX && coord.y < MaxY && coord.x >= 0 && coord.y >= 0) {
			return umImagePath + umGameDir + "/simple/zoom" + zoom + "/" + umMapImagePrefix +  "-" + coord.x + "-" + coord.y + "-" + zoom + ".jpg";
		}
	}

	return umImagePath + umOorSimpleMapTile;
}


	// Updates the 'linkto' anchor on the page
function umUpdateLink() 
{
	umMapState.Update(umMap);
	
	var newLinkTo = umCreateLink(umMap.getCenter());
	var LinkTo    = document.getElementById("umMapLink");
	if (LinkTo) LinkTo.href = newLinkTo;
	
	return newLinkTo;
}


	// Create a map link using a location and custom zoom level
function umCreateLinkZoom(Loc, Zoom) 
{
	var newLinkTo = umMapURL + '?locx=' + umConvertLngToLocX(Loc.lng()).toFixed(0) + '&locy=' + umConvertLatToLocY(Loc.lat()).toFixed(0) + '&zoom=' + Zoom;

	if (umMapState.HasSearch()) {
		newLinkTo += "&search=" + escape(umMapState.SearchText);
		if (umMapState.StartRow > 0) newLinkTo += "&startsearch=" + escape(umMapState.StartRow);
	}
	
	if (umMapState.ShowResults		!= umDefaultShowResults)		newLinkTo += "&showresults=" + umMapState.ShowResults;
	if (umMapState.ShowCells		!= umDefaultShowCells)			newLinkTo += "&showcells=" + umMapState.ShowCells;
	if (umMapState.ShowEdit			!= umDefaultShowEdit)			newLinkTo += "&edit=" + umMapState.ShowEdit;
	if (umMapState.ShowSearch		!= umDefaultShowSearch)			newLinkTo += "&showsearch=" + umMapState.ShowSearch;
	if (umMapState.DisableControls	!= umDefaultDisableControls)	newLinkTo += "&disablecontrols=" + umMapState.DisableControls;
	if (umMapState.ShowDisabled		!= umDefaultShowDisabled)		newLinkTo += "&showdisabled=" + umMapState.ShowDisabled;
	if (umMapState.ShowInfo			!= umDefaultShowInfo)			newLinkTo += "&showinfo=" + umMapState.ShowInfo;
	if (umMapState.CellResource		!= umDefaultCellResource)		newLinkTo += "&cellresource=" + umMapState.CellResource;
	
	return newLinkTo;
}	


	// Create a map link using a custom location and the current zoom level
function umCreateLink(Loc) 
{
	return umCreateLinkZoom(Loc, umMap.getZoom());
}


function umSplitURLParams()
{
	var strHref = location.search.substring(1).toLowerCase();
	var Params = strHref.split("&");
	var ResultParams = [];
	
	for (var i = 0; i < Params.length; i++ ) {
		if ( Params[i].indexOf("=") > -1 ) {
			var aParam = Params[i].split("=");
			ResultParams[aParam[0]] = aParam[1];
		}
		else {
			ResultParams[Params[i]] = '';
		}
	}
	
	return ResultParams;
}


	// Retrieve a specific input parameter
function umGetURLParam(strParamName) 
{
	var strReturn = "";
	var strHref = location.search.substring(1);
	var aQueryString = strHref.split("&");
		
	for ( var iParam = 0; iParam < aQueryString.length; iParam++ ){
		if ( aQueryString[iParam].indexOf(strParamName + "=") === 0 ){
			var aParam = aQueryString[iParam].split("=");
			strReturn = aParam[1];
			break;
		}
	}
	
	return strReturn;
}


	// Updates all locations when the map moves
function umUpdateMarkers() 
{
	if (umSkipUpdate) return;
	umUpdateLink();

	if (umMapState.HasSearch()) return;
	if (umWaitingForReponse) return;

	umMapState.ResetSearch();
	umDeleteLocations();

	umGetMarkers(umMapState);
}


	// Only update markers in "new" regions of the map
function umUpdateDiffMarkers() 
{
	var SWX;
	var NEX;
	var SWY;
	var NEY;
	
	if (umSkipUpdate) return;

	if (umNoInitialGetMarkers) {
		umNoInitialGetMarkers = false;
		umMapState.Update(umMap);
		umGetMarkers(umMapState);
		return;
	}

	var OldBounds = umMapState.MapBounds;
	var OldZoom = umMapState.Zoom;

	var OldSWX = umConvertLngToLocX(OldBounds.getSouthWest().lng());
	var OldSWY = umConvertLatToLocY(OldBounds.getSouthWest().lat());
	var OldNEX = umConvertLngToLocX(OldBounds.getNorthEast().lng());
	var OldNEY = umConvertLatToLocY(OldBounds.getNorthEast().lat());

		// Update link and current map state
	umUpdateLink();

	if (umMapState.MapBounds === null) umMapState.Update(umMap);

	var NewSWX = umConvertLngToLocX(umMapState.MapBounds.getSouthWest().lng());
	var NewSWY = umConvertLatToLocY(umMapState.MapBounds.getSouthWest().lat());
	var NewNEX = umConvertLngToLocX(umMapState.MapBounds.getNorthEast().lng());
	var NewNEY = umConvertLatToLocY(umMapState.MapBounds.getNorthEast().lat());
	
	if (umMapState.HasSearch()) return;

	umDeleteLocationsFromArea(umMapState.MapBounds, umMapState.Zoom);

	if (umMapState.Zoom > OldZoom) {
		umAddMarkersBoundsZoom(umMapState, NewSWX, NewSWY, NewNEX, NewNEY, OldZoom);	
	}

		// Get more locations on the west side
	if (NewSWX < OldSWX) {
		SWX = NewSWX;
		NEX = OldSWX;
		SWY = NewSWY;
		NEY = NewNEY;
		umAddMarkersBounds(umMapState, SWX, SWY, NEX, NEY);
	}

		// Get more locations on the east side
	if (NewNEX > OldNEX) {
		SWX = OldNEX;
		NEX = NewNEX;
		SWY = NewSWY;
		NEY = NewNEY;
		umAddMarkersBounds(umMapState, SWX, SWY, NEX, NEY);
	}

		// Get more locations on the north side
	if (NewNEY > OldNEY) {
		SWX = NewSWX;
		NEX = NewNEX;
		SWY = OldNEY;
		NEY = NewNEY;
		umAddMarkersBounds(umMapState, SWX, SWY, NEX, NEY);
	}

		// Get more locations on the south side
	if (NewSWY < OldSWY) {
		SWX = NewSWX;
		NEX = NewNEX;
		SWY = NewSWY;
		NEY = OldSWY;
		umAddMarkersBounds(umMapState, SWX, SWY, NEX, NEY);
	}
	
}


	// Delete all locations no longer in the give map area
function umDeleteLocationsFromArea(Bounds, Zoom) 
{
	var Index;

	for (Index = umLocations.length-1; Index >= 0 ; --Index)
	{
		if (umLocations[Index].ID < 0) continue; // Ignore locations in the process of being created

		if (!Bounds.contains(umLocations[Index].MapPoint) || umLocations[Index].DisplayLevel > Zoom) {
			umDeleteLocation(umLocations[Index], Index);
		}
	}
	
	//alert(umMapState.NumResults + " of " + umMapState.TotalResults);
}

	// Uses an XmlHttpRequest to get map locations using the input information
function umAddMarkersBounds(MapState, SWX, SWY, NEX, NEY) 
{
	var Request = new XMLHttpRequest();

	QueryStr = umMakeGetQueryBounds(MapState, SWX, SWY, NEX, NEY);
	Request.open('GET', QueryStr, true);

	Request.onreadystatechange = function () {
		if (Request.readyState == 4) {
			umParseAddMapRequest(Request);
		}
	};

	umWaitingForReponse = 1;
	Request.send(null);
}


	// Uses an XmlHttpRequest to get map locations using the input information
function umAddMarkersBoundsZoom(MapState, SWX, SWY, NEX, NEY, MinZoom) 
{
	var Request = new XMLHttpRequest();

	QueryStr = umMakeGetQueryBounds(MapState, SWX, SWY, NEX, NEY);
	QueryStr += "&minzoom=" + escape(MinZoom);
	Request.open('GET', QueryStr, true);

	Request.onreadystatechange = function () {
		if (Request.readyState == 4) {
			umParseAddMapRequest(Request);
		}
	};

	umWaitingForReponse = 1;
	Request.send(null);
}


	//Parse a response from an add location request
function umParseAddMapRequest(Request) 
{
	var xmlDoc = Request.responseXML;

	var Locations = xmlDoc.documentElement.getElementsByTagName("location");
	var AddedCount = 0;

	if (Locations.length) {
		AddedCount = umParseMapLocations(xmlDoc, Locations);
	}

	var RowCountData = xmlDoc.documentElement.getElementsByTagName("rowcount");
	var TotalRowCount = 0;
	var RowCount = 0;
	var StartRow = 0;

	if (RowCountData.length > 0) {
		TotalRowCount	= parseInt(RowCountData[0].getAttribute("totalrows"), 10);
		RowCount		= parseInt(RowCountData[0].getAttribute("rowcount"), 10);
		StartRow		= parseInt(RowCountData[0].getAttribute("startrow"), 10);	
	}
	
	umMapState.StartRow		= StartRow;
	umMapState.TotalResults	+= TotalRowCount - (RowCount - AddedCount);
	umMapState.NumResults	+= AddedCount;

	umUpdateResultsText();
}


	//Sets the current results header text
function umUpdateResultsText() 
{
	var Header = document.getElementById("umSearchResultsHeader");
	var Text;

	if (!Header) return;

	if (umLocations.length > 0) {
		if (umMapState.HasSearch()) {
			Text = "<div id='umResultTitle'>Results <b>" + (umMapState.StartRow  + 1) + "-" + (umMapState.StartRow + umLocations.length) + "</b> of <b>" + umMapState.TotalResults  + "</b> matching locations for <B>" + umMapState.SearchText + "</B>.</div>";
		} else {
			Text = "<div id='umResultTitle'>Showing locations <b>" + (umMapState.StartRow  + 1) + "-" + (umMapState.StartRow + umLocations.length) + "</b> of <b>" + umMapState.TotalResults  + "</b> in current map area.</div>";
		}
	} 
	else if (umMapState.HasSearch()) {
		Text = "<div id='umResultTitle'>Found no matching locations for <b>" + umMapState.SearchText + "</b>.</div>";
	}
	else {
		Text = "<div id='umResultTitle'>Found no locations to display.</div>";
	}

	Header.innerHTML = Text;
}


	// Updates the map parameters from any input parameters
function umUpdateMapFromInput(InputValues) 
{
	var Lat				= InputValues.lat;
	var Lng				= InputValues.lng;
	var Zoom			= InputValues.zoom;
	var LocX			= InputValues.locx;
	var LocY			= InputValues.locy;
	var CellX			= InputValues.cellx;
	var CellY			= InputValues.celly;
	var CenterOn		= InputValues.centeron;
	var ShowResults		= InputValues.showresults;
	var ShowCells		= InputValues.showcells;
	var ShowSearch		= InputValues.showsearch;
	var DisableControls	= InputValues.disablecontrols;
	var ShowEdit		= InputValues.edit;
	var ShowDisabled	= InputValues.showdisabled;
	var ShowInfo		= InputValues.showinfo;
	var CellResource	= InputValues.cellresource;
	var ZoomB;
	var bShowResults;
	var bShowCells;
	
	umUpdateSearchFromInput(InputValues);
	
	if (Zoom === null || Zoom === "") {
		Zoom = umMapLinkZoomedValue;
		ZoomB = umMapDefaultZoom;
	}
	else {
		ZoomB = Zoom = parseInt(Zoom, 10);
	}

	if (Lat && Lat !== "") {
		umMapState.ZoomTo(umMap, new google.maps.LatLng(parseFloat(Lat), parseFloat(Lng)), Zoom);
	} 
	else if (LocX && LocX !== "") {
		umMapState.ZoomTo(umMap, umConvertLocToLatLng(parseFloat(LocX), parseFloat(LocY)), Zoom);
	}

	else if (CellX && CellX !== "") {
		var X = parseFloat(CellX) * umObCellSize;
		var Y = parseFloat(CellY) * umObCellSize;

		umMapState.ZoomTo(umMap, umConvertLocToLatLng(X, Y), Zoom);
	}
	else if (CenterOn && CenterOn !== "") {
		umMapState.ZoomTo(umMap, umMapDefaultCenter, umMapDefaultZoom);
		umGetCenterOnMarker(umMapState, unescape(CenterOn), Zoom);
		umNoInitialGetMarkers = true;
	}
	else {
		umMapState.ZoomTo(umMap, umMapDefaultCenter, ZoomB);
	}
	
	if (ShowResults !== null && ShowResults !== "") {
		bShowResults = (ShowResults === 'true');
		umUpdateSearchResultsButton(bShowResults);
	}
	else {
		umUpdateSearchResultsButton(umMapState.ShowResults);
	}
	
	if (ShowCells !== null && ShowCells !== "") {
		umMapState.ShowCells = (ShowCells === 'true');
	}
	
	if (ShowSearch !== null && ShowSearch !== "") {
		umMapState.ShowSearch = (ShowSearch === 'true');
	}
	
	if (ShowEdit !== null && ShowEdit !== "") {
		umMapState.ShowEdit = (ShowEdit === 'true');
	}
	
	if (ShowDisabled !== null && ShowDisabled !== "") {
		umMapState.ShowDisabled = (ShowDisabled === 'true');
	}
	
	if (ShowInfo !== null && ShowInfo !== "") {
		umMapState.ShowInfo = (ShowInfo === 'true');
	}
	
	if (CellResource !== null && CellResource !== "") {
		umMapState.CellResource = CellResource;
		umCreateCellResources(CellResource);
		umSetCellResourceList(CellResource);
	}
	
	if (DisableControls !== null && DisableControls !== "") {
		umMapState.DisableControls = (DisableControls === 'true');
	}
	
	if (umMapState.DisableControls) {
		var MenuBar = document.getElementById('umMenuBar');
		var MapContainer = document.getElementById('umMapContainer');
		
		if (MenuBar) MenuBar.style.display = 'none';
		if (MapContainer) MapContainer.style.top = '0px';
	}
	
	var mapOptions = {
			clickable: umMapState.ShowInfo,
			overviewMapControl: !umMapState.DisableControls,
			panControl: !umMapState.DisableControls,
			zoomControl: !umMapState.DisableControls,
			draggable: !umMapState.DisableControls,
			keyboardShortcuts: !umMapState.DisableControls,
			scrollwheel: !umMapState.DisableControls,
	};
	
	umMap.setOptions(mapOptions);
	
}


	// Set the map to a specific location at the current zoom level
function umShowLocation(X, Y) 
{
	var Point = umConvertLocToLatLng(X, Y);
	umMapState.MoveTo(umMap, Point);
}

	// Set the map to a specific location and zoom level
function umShowLocationZoom(X, Y, Zoom) 
{
	var Point = umConvertLocToLatLng(X, Y);
	umMapState.ZoomTo(umMap, Point, Zoom);
}


function umTestClick() 
{
	location.replace(umUpdateLink());
}


function umHelpEscKeyHandler (e) 
{
	if (e.keyCode == 27) onCloseHelp();
}


	// Shows the map help screen
function umOnShowHelp(Element)
{
	var Overlay = document.getElementById("umOverlayBottom");
	var OverlayContent = document.getElementById("umOverlayContent");
	if (Overlay === null) return;
	if (OverlayContent === null) return;
	
	Overlay.style.visibility = "visible";
	OverlayContent.style.visibility = "visible";
	
	document.addEventListener("keyup", umHelpEscKeyHandler, false);
}



function onCloseHelp(Element)
{
	var Overlay = document.getElementById("umOverlayBottom");
	var OverlayContent = document.getElementById("umOverlayContent");
	if (Overlay === null) return;
	if (OverlayContent === null) return;
	
	Overlay.style.visibility = "hidden";
	OverlayContent.style.visibility = "hidden";
	
	document.removeEventListener("keyup", umHelpEscKeyHandler);
}


	// Uses an XmlHttpRequest to get map locations using the input information
function umGetCenterOnMarker(MapState, CenterOn, Zoom)
{
	var Request = new XMLHttpRequest();

	QueryStr = umMakeGetQueryCenterOn(MapState, CenterOn);
	Request.open('GET', QueryStr, true);

	Request.onreadystatechange = function () {
		if (Request.readyState == 4) {
			umParseCenterOnMapRequest(Request, Zoom);
		}
	};

	umWaitingForReponse = 1;
	Request.send(null);
}


	// Makes a get query request string from a map state and centeron location
function umMakeGetQueryCenterOn (MapState, CenterOn)
{
	var QueryStr = umGetMapURL + "?game=" + umGame + "&centeron=" + escape(CenterOn);
	return QueryStr;
}


	// Parse a response from a centeron location request
function umParseCenterOnMapRequest(Request, Zoom)
{
	var xmlDoc = Request.responseXML;
	var Locations = xmlDoc.documentElement.getElementsByTagName("location");

	if (Locations.length) {
		var Location = umCreateMapLocation(Locations[0]);

		umLocations[umLocations.length] = Location;
		umCreateMapLabel(Location);
		umAddSearchResult(Location);

		umMapState.StartRow      = 0;
		umMapState.TotalResults  = 1;
		umMapState.NumResults    = 1;
		umUpdateResultsText();

		umMapState.ZoomTo(umMap, Location.MapPoint, Zoom);

		if (umMapState.HasSearch()) {
			umGetMarkers(umMapState);
		}
	}
	else {
		umGetMarkers(umMapState);
	}

	umUpdateLink();
}

function umHtmlEncode(s)
{
	var el = document.createElement("div");
	el.innerText = el.textContent = s;
	s = el.innerHTML;
	return s;
}

function umAddEvent(element, event, fn)
{
	if (element.addEventListener)
		element.addEventListener(event, fn, false);
	else if (element.attachEvent)
		element.attachEvent('on' + event, fn);
}

function umClone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = umClone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}


	// Automatically setup and display the map on page load
google.maps.event.addDomListener(window, 'load', umSetupMap);
var umNextLocationID = 111;

	// Map location class constructor
function CMapLocation(LocData) 
{
	if (LocData !== undefined && LocData !== null) {
		this.ID = parseInt(LocData.getAttribute("id"), 10);
		this.X = Math.round(parseFloat(LocData.getAttribute("X")));
		this.Y = Math.round(parseFloat(LocData.getAttribute("Y")));
		this.Z = Math.round(parseFloat(LocData.getAttribute("Z")));
		this.Name = decodeURIComponent(LocData.getAttribute("name"));
		
		this.EditorID = decodeURIComponent(LocData.getAttribute("edid"));
		if (this.EditorID === null || this.EditorID === 'null' || this.EditorID === undefined) this.EditorID = '';
		
		this.Worldspace = decodeURIComponent(LocData.getAttribute("ws"));
		this.Type = parseInt(LocData.getAttribute("type"), 10);
		this.Namespace = decodeURIComponent(LocData.getAttribute("ns"));
		this.Region = decodeURIComponent(LocData.getAttribute("region"));
		this.DisplayLevel = parseInt(LocData.getAttribute("level"), 10);
		this.LabelPosition = parseInt(LocData.getAttribute("labpos"), 10);
		this.WikiPage = decodeURIComponent(LocData.getAttribute("page"));
		this.Tags = decodeURIComponent(LocData.getAttribute("tags"));
		
		if (this.NameSpace === '' || this.Namespace === null || this.Namespace === undefined || this.Namespace === 'null') this.Namespace = umWikiNameSpace;
		if (this.Region === '' || this.Region === null || this.Region === undefined || this.Region === 'null') this.Region = umRegionName;
		
		var ShowPos = parseInt(LocData.getAttribute("en"), 10);
		this.Show = ShowPos !== 0;
	}
	else {
		this.ID = this.X = this.Y = this.Z = 0;
		this.Name = this.EditorID = this.Region = this.WikiPage = '';
		this.Tags = '';
		this.Namespace = umWikiNameSpace;
		this.Region = this.Worldspace = umRegionName;
		this.Type = 0;
		this.LabelPosition = 8;
		this.DisplayLevel = 16;
		this.Show = true;
	}

	this.MapPoint = umConvertLocToLatLng(this.X, this.Y);
	this.Label = null;
	this.ResultElement = null;
}


	// Delete all currently displayed map locations
function umDeleteLocations() 
{
	var Index;

	for (Index = 0; Index < umLocations.length; ++Index) {
		if (umLocations[Index].Label) umRemoveMapLabel(umLocations[Index].Label);
	}

	umLocations = [];
}


	// Updates all locations when the map moves (not currently used in favor of the more efficient diff update)
function umUpdateMarkers() {
	umUpdateLink();

	if (umMapState.HasSearch()) return;
	if (umWaitingForReponse) return;

	umMapState.ResetSearch();
	umDeleteLocations();

	umGetMarkers();
}


	// Makes a get query request string from a map state and oblivion bounding box
function umMakeGetQueryBounds(MapState, SWX, SWY, NEX, NEY) 
{
	var QueryStr = umGetMapURL + "?game=" + umGame + "&zoom=" + MapState.Zoom + "&BottomLeftX=" + Math.round(SWX) + "&BottomLeftY=" + Math.round(SWY) + "&TopRightX=" + Math.round(NEX) + "&TopRightY=" + Math.round(NEY);

	if (MapState.HasSearch()) {
		QueryStr += "&SearchText=" + encodeURIComponent(umMapState.SearchText);
	}

	if (MapState.StartRow) {
		QueryStr += "&StartRow=" + encodeURIComponent(umMapState.StartRow);
	}

	if (MapState.ShowDisabled) {
		QueryStr += "&ShowDisabled=2";
	}

	return QueryStr;
}


	// Uses an XmlHttpRequest to get map locations using the input information
function umGetMarkers() 
{
	var Request = new XMLHttpRequest();

	MapBounds = umMap.getBounds();
	if (MapBounds === null) MapBounds = umMapBounds;

	var BottomLeftX = umConvertLngToLocX(MapBounds.getSouthWest().lng());
	var BottomLeftY = umConvertLatToLocY(MapBounds.getSouthWest().lat());
	var TopRightX   = umConvertLngToLocX(MapBounds.getNorthEast().lng());
	var TopRightY   = umConvertLatToLocY(MapBounds.getNorthEast().lat());

	var QueryStr = umMakeGetQueryBounds(umMapState, BottomLeftX, BottomLeftY, TopRightX, TopRightY);
	Request.open('GET', QueryStr, true);

	Request.onreadystatechange = function () {
		if (Request.readyState == 4) {
			umParseGetMapRequest(Request);
		}
	};

	umWaitingForReponse = 1;
	Request.send(null);
}


	// Parse out locations from a get location request
function umParseGetMapLocations(xmlDoc, Locations) {
	var RowCountData = xmlDoc.documentElement.getElementsByTagName("rowcount");
	var TotalRowCount = 0;
	var RowCount = 0;
	var StartRow = 0;

	if (RowCountData.length > 0) {
		TotalRowCount = parseInt(RowCountData[0].getAttribute("totalrows"), 10);
		RowCount      = parseInt(RowCountData[0].getAttribute("rowcount"), 10);
		StartRow      = parseInt(RowCountData[0].getAttribute("startrow"), 10);
	}

	umMapState.StartRow      = StartRow;
	umMapState.TotalResults  = TotalRowCount;
	umMapState.NumResults    = RowCount;

	umParseMapLocations(xmlDoc, Locations);
	
	var Link = "<center>";

		// Previous link
	if (StartRow > 0) {
		var NewStart = StartRow - 50;
		if (NewStart < 0) NewStart = 0;
		Link += "<a href='' onClick='umSearchFunction(" + NewStart + "); return(false);'><b>Prev</b></A> &nbsp; &nbsp; &nbsp;";
	}
	
		// Next link
	if (StartRow + RowCount + 1 < TotalRowCount) {
		var NewStart = StartRow + RowCount;
		if (NewStart > TotalRowCount) NewStart = TotalRowCount - 1;
		if (NewStart < 0) NewStart = 0;
		Link += "<a href='' onClick='umSearchFunction(" + NewStart + "); return(false);'><b>Next</b></a>";
	}
	
	Link += "</center>";
	var SearchControlBottom = document.getElementById("umSearchControlBottom");
	var SearchControlTop    = document.getElementById("umSearchControlTop");
	if (SearchControlTop) SearchControlTop.innerHTML = Link;
	if (SearchControlBottom) SearchControlBottom.innerHTML = Link;
}


	// Parse a response from a get location request
function umParseGetMapRequest(Request) 
{
	var xmlDoc = Request.responseXML;

	if (xmlDoc === null || xmlDoc.documentElement === null) {
		umUpdateResultsText();
		umWaitingForReponse = 0;
		return;
	}

	var Locations = xmlDoc.documentElement.getElementsByTagName("location");

	if (Locations !== null && Locations.length) {
		umParseGetMapLocations(xmlDoc, Locations);
		umUpdateResultsText();
	}
	else {
		umUpdateResultsText();
	}

	umWaitingForReponse = 0;
}


	// Parse and return a new location from raw data
function umCreateMapLocation (LocData) {
	var Loc = new CMapLocation(LocData);
	return Loc;
}


	// Find a current location by its ID
function umFindCurrentLocation (ID) {
	var Index;

	for (Index = 0; Index < umLocations.length; ++Index) {
		if (umLocations[Index].ID == ID) return umLocations[Index];
	}

	return null;
}


	// Parse out locations from a get location request
function umParseMapLocations(xmlDoc, Locations) 
{
	var Count = 0;

	for (var i = 0; i < Locations.length; i++) {
		var Location = umCreateMapLocation(Locations[i]);

		if (umFindCurrentLocation(Location.ID) === null) {
			umLocations.push(Location);
			umCreateMapLabel(Location);
			umAddSearchResult(Location);
			++Count;
		}
	}

	return Count;
}


function umCreateUniqueLocationID()
{
	var NewID = "locinfo" + umNextLocationID;
	umNextLocationID++;
	return NewID;
}


function umOnExpandLocationInfo(Element, ID)
{
	var Location = umFindLocationByInfoID(ID);
	if (Location === null) return;
	
	var Content = umMakeExtLocationInfoContent(Location, ID);
	
	Location.Label.infowindow.setContent(Content);
}


function umOnShrinkLocationInfo(Element, ID)
{
	var Location = umFindLocationByInfoID(ID);
	if (Location === null) return;
	
	var Content = umMakeLocationInfoContent(Location, ID);
	
	Location.Label.infowindow.setContent(Content);
}


function umMakeInnerLocationInfoContent(Location, ID)
{
	var Content = "";
	
	Content += "<div class='umLocationInfoName'>" + Location.Name + "</div>";
	
	if (Location.Type) {
		Content += "<div class='umLocationInfoType'>" + umGetMapMarkerType(Location.Type) + "</div>";
	}
	
	Content += "<div class='umLocationInfoPos'>Location: " + Location.Region + " (" + Location.X + ", " + Location.Y + ", " + Location.Z + ")</div>";
	if (Location.EditorID !== '') { Content += "<div class='umLocationInfoEdId'>EditorID: " + Location.EditorID + "</div>"; }
	//Content += "<div class='umLocationInfoPos'>LabelPos: " + Location.LabelPosition + "</div>";

	if (Location.WikiPage) {
		var wikiPage = Location.WikiPage;
		if (umEncodeURI) wikiPage = encodeURIComponent(wikiPage).replace(/'/g, "%27");
		
		Content += "<div class='umLocationInfoLink'><a href=\"//www.uesp.net/wiki/" + Location.Namespace + ":" + wikiPage + "\">" + Location.Namespace + ":" + Location.WikiPage + "</a></div>";
	}
	
	return Content;
}


	// Makes a location content for a popup info window
function umMakeLocationInfoContent(Location, ID)
{
	var Content;
	
	ID = typeof ID !== 'undefined' ? ID : umCreateUniqueLocationID();
	if (ID === null) ID = umCreateUniqueLocationID();

	Content  = "<div class='umLocationInfo' id='" + ID + "'>";
	Content += umMakeInnerLocationInfoContent(Location, ID);
	
	if (umMapState.ShowEdit) {
		Content += "<div class='umLocationExpandEdit' onClick='umOnOpenEditLocationInfo(this, &quot;" + ID + "&quot;);'>Edit...</div>";
	}
	else {
		Content += "<div class='umLocationExpand' onClick='umOnExpandLocationInfo(this, &quot;" + ID + "&quot;);'>More...</div>";		
	}
		
	Content += "</div>";
	return Content;
}


function umMakeExtLocationInfoContent(Location, ID)
{
	var Content;
	
	ID = typeof ID !== 'undefined' ? ID : umCreateUniqueLocationID();
	if (ID === null) ID = umCreateUniqueLocationID();

	Content  = "<div class='umLocationInfoLarge' id='" + ID + "'>";
	Content += umMakeInnerLocationInfoContent(Location, ID);
	
	Content += "<div class='umLocationInfoPos'>&nbsp;</div>";
	Content += "<div class='umLocationInfoPos'>Label Position: " + umGetLabelPositionLabel(Location.LabelPosition) + " (" + Location.LabelPosition + ")</div>";
	Content += "<div class='umLocationInfoPos'>Display Level: " + Location.DisplayLevel + "</div>";
	Content += "<div class='umLocationInfoPos'>Tags: " + Location.Tags + "</div>";
	Content += "<div class='umLocationInfoPos'>World Space: " + Location.Worldspace + "</div>";
	Content += "<div class='umLocationInfoPos'>Internal ID: " + Location.ID + "</div>";
	
	Content += "<div class='umLocationExpand' onClick='umOnShrinkLocationInfo(this, &quot;" + ID + "&quot;);'>Less...</div>";
	Content += "</div>";
	return Content;
}


// Updates an existing map label
function umUpdateMapLabel(Location) 
{
	if (!Location) return null;

		// Remove an existing label
	if (Location.Label) {
		umRemoveMapLabel(Location.Label);
		Location.Label = null;
	}

	return umCreateMapLabel(Location);
}


function umFindLocationByInfoID (ID)
{
	for (var i =0; i < umLocations.length; i++) {
		if (umLocations[i].Label === null) continue;
		if (umLocations[i].Label.locationinfoid === ID) return umLocations[i];
	}
	
	return null;
}


function umDeleteLocation(Location, Index)
{
	if (Location === null || Location === undefined) return;
	
	if (Location.Label) Location.Label.marker.setMap(null);
	if (Location.LabelListener) google.maps.event.removeListener(Location.LabelListener);

	if (Location.ResultElement) {
		var SearchResults = document.getElementById("umSearchResults");
		if (SearchResults !== null) SearchResults.removeChild(Location.ResultElement);
	}
	
	if (Index === null || Index === undefined) {
		Index = umLocations.indexOf(Location);
	}
	
	umLocations.splice(Index, 1);
	--umMapState.NumResults;
	--umMapState.TotalResults;
}



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



	// Default map states
var umDefaultShowDisabled		= false;
var umDefaultShowResults		= false;
var umDefaultShowCells			= false;
var umDefaultShowSearch			= true;
var umDefaultDisableControls	= false;
var umDefaultShowEdit			= false;
var umDefaultShowInfo			= true;
var umDefaultCellResource       = "";


	// Map state class constructor
function CMapState(Center, Zoom, SearchText, NumResults, TotalResults, StartRow, Bounds) {
	this.Center				= Center;
	this.Zoom				= Zoom;
	this.SearchText			= SearchText;
	this.NumResults			= NumResults;
	this.TotalResults		= TotalResults;
	this.StartRow			= StartRow;
	this.MapBounds			= Bounds;
	this.ShowDisabled		= umDefaultShowDisabled;
	this.ShowResults		= umDefaultShowResults;
	this.ShowCells			= umDefaultShowCells;
	this.ShowSearch			= umDefaultShowSearch;
	this.DisableControls	= umDefaultDisableControls;
	this.ShowEdit			= umDefaultShowEdit;
	this.ShowInfo			= umDefaultShowInfo;
	this.CellResource       = umDefaultCellResource;
}


	// Is the map currently displaying search results
CMapState.prototype.HasSearch = function() {
	return (this.SearchText !== null && this.SearchText !== "");
};


	// Update the center/zoom from the current map
CMapState.prototype.Update = function(Map) {
	this.Center		= Map.getCenter();
	this.Zoom		= Map.getZoom();
	this.MapBounds	= Map.getBounds();
};


	// Sets the map center/zoom
CMapState.prototype.ZoomTo = function(Map, Center, Zoom) 
{
	umSkipUpdate = true;

	Map.panTo(Center);
	Map.setZoom(Zoom);
	
	umSkipUpdate = false;
	umUpdateDiffMarkers();
};


	// Sets the map center keeping the current zoom
CMapState.prototype.MoveTo = function(Map, Center) 
{
	Map.panTo(Center);
	this.Center = Center;
	this.MapBounds = Map.getBounds();
};


	// Reset the search results
CMapState.prototype.ResetSearch = function() {
	this.NumResults		= 0;
	this.StartRow		= 0;
	this.SearchText		= "";
	this.TotalResults	= 0;

	umClearSearchResults();
};

var umMapState = new CMapState(umMapDefaultCenter, umMapDefaultZoom, "", 0, 0, 0, umMapBounds);
function umResetSearch()
{
	var InputBox = document.getElementById("umSearchInputText");
	if (InputBox) InputBox.value = "";

	umMapState.ResetSearch();
	umDeleteLocations();

	umGetMarkers(umMapState);
	umUpdateLink();
}


	// Clear any displayed search results
function umClearSearchResults() 
{
	var SearchResults = document.getElementById("umSearchResults");
	if (!SearchResults) return;
	
	var SearchControlBottom = document.getElementById("umSearchControlBottom");
	var SearchControlTop    = document.getElementById("umSearchControlTop");
	if (SearchControlTop) SearchControlTop.innerHTML = "";
	if (SearchControlBottom) SearchControlBottom.innerHTML = "";

	for (var Index = SearchResults.childNodes.length - 1; Index >= 0; --Index) {
		SearchResults.removeChild(SearchResults.childNodes[Index]);
	}
}


function umOnSearch()
{
	umSearchFunction(0, umMapState.ShowDisabled);
	return false;
}


	// Called to start a search for locations
function umSearchFunction(StartSearchRow, ShowDisabled) 
{
	umMapState.ResetSearch();
	umDeleteLocations();

	var InputBox = document.getElementById("umSearchInputText");

	if (InputBox) {
		var SearchText = InputBox.value;
		umMapState.SearchText = SearchText.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");
		InputBox.value = umMapState.SearchText;

		if (StartSearchRow) {
			umMapState.StartRow = parseInt(StartSearchRow, 10);
		}
		else {
			umMapState.StartRow = 0;
		}

		umGetMarkers(umMapState);
		umUpdateSearchResultsButton(true);
	}

	umUpdateLink();
}


function umOnShowHideSearchResults() 
{
	var SearchResults = document.getElementById("umSearchResultsArea");
	var SearchResultsButton = document.getElementById("umSearchResultsButton");
	
	if (SearchResults === null) return;
	if (SearchResultsButton === null) return;
	
	if (SearchResults.style.visibility == 'hidden') {
		umUpdateSearchResultsButton(true);
	}
	else {
		umUpdateSearchResultsButton(false);
	}
	
	umUpdateLink();	
}


function umUpdateSearchResultsButton(ShowResults)
{
	var SearchResults = document.getElementById("umSearchResultsArea");
	var SearchResultsButton = document.getElementById("umSearchResultsButton");
	var SearchContainer = document.getElementById("umSearchContainer");
	
	umMapState.ShowResults = ShowResults;
	if (SearchResults === null) return;
	if (SearchResultsButton === null) return;
	if (SearchContainer === null) return;
	
	if (ShowResults) {
		SearchResults.style.visibility = "visible";
		SearchResults.style.display = "block";
		SearchResultsButton.style.position = "absolute";
		SearchResultsButton.style.bottom = "40px";
		SearchResultsButton.innerHTML = "<img src='" + umImagePath + umUpArrowIcon + "' </img> Hide Search Results <img src='" + umImagePath + umUpArrowIcon + "' </img>";
		SearchContainer.style.height = '100%';
	}
	else {
		SearchResults.style.visibility = "hidden";
		SearchResults.style.display = "none";
		SearchResultsButton.style.position = "relative";
		SearchResultsButton.style.bottom = "0px";
		SearchResultsButton.innerHTML = "<img src='" + umImagePath + umDownArrowIcon + "' </img> Show Search Results <img src='" + umImagePath + umDownArrowIcon + "' </img>";
		SearchContainer.style.height = '40px';
	}
}


	// Add a text string to the end of the search result element
function umAddSearchResultText(Text, DivName) 
{
	var SearchResults = document.getElementById("umSearchResults");
	if (!SearchResults) return;

	var NewDiv = document.createElement("div");
	NewDiv.setAttribute("divname", DivName);
	NewDiv.innerHTML = Text;
	
	var Found = 0;
	
	for (var Index = 0; Index < SearchResults.childNodes.length; Index++) {
		var TName = SearchResults.childNodes[Index].getAttribute("divname");
		if (TName > DivName) {
			SearchResults.insertBefore(NewDiv, SearchResults.childNodes[Index]);
			Found = 1;
			break;
		}
	}
	
	if (!Found) {
		SearchResults.appendChild(NewDiv);
	}

	return NewDiv;
}


	// Updates the search form from input parameters
function umUpdateSearchFromInput(InputValues) 
{
	var SearchText = InputValues.search;
	var SearchBox;
	umMapState.SearchText = SearchText;

	if (SearchText && SearchText !== "")
	{
		umMapState.SearchText = decodeURIComponent(SearchText).replace(/\+/g, ' ');
		umMapState.StartRow   = parseInt(InputValues.startsearch, 10);
		var InputBox = document.getElementById("umSearchInputText");
		if (InputBox) InputBox.value = umMapState.SearchText;
	}
	
	if (umMapState.ShowSearch && !umMapState.DisableControls)
	{
		SearchBox = document.getElementById("umSearchContainer");
		SearchBox.style.display = "block";
	}
	else
	{
		SearchBox = document.getElementById("umSearchContainer");
		SearchBox.style.display = "none";
	}
}


function umCreateSearchResultText(Location)
{
	var TypeText = umGetMapMarkerType(Location.Type);
	var NewLink  = umCreateLink(Location.MapPoint);
	
	var NewText = "<div id='umResult'><div id='umResultLinkBox'><nobr><div id='umResultIconBox'><img id='umResultIcon' src='" + umGetMapMarkerIcon(Location.Type) + "' alt='[" + TypeText +"]' border='0' /></div> ";
	NewText += "<a id='umResultLink' href='" + NewLink + "' onClick='umShowLocation(" + Location.X + "," + Location.Y + "); return(false);'>" + Location.Name + "</A>";
	
	var NewLinkZoom = umCreateLinkZoom(Location.MapPoint, umMapLinkZoomedValue);
	NewText += " <a href='" + NewLinkZoom + "' id='umResultZoom' onClick='umShowLocationZoom(" + Location.X + "," + Location.Y + ", " + umMapLinkZoomedValue + "); return(false);'>";
	NewText += "<img width='16' height='16' id='umZoomIcon' src='" + umImagePath + umZoomIcon + "' alt='[zoomto]' border='0'></a>";
		
	if (Location.WikiPage) {
		var wikiPage = Location.WikiPage;
		if (umEncodeURI) wikiPage = encodeURIComponent(wikiPage);
		
		NewText += "<a id='umResultWikiLink' href=\"http://www.uesp.net/wiki/" + Location.Namespace + ":" + wikiPage + "\" >";
		NewText += "<img width='32' height='16' src='" + umImagePath + umWikiPageIcon +  "' border='0' alt='[Wiki Page]'/>";
		NewText += "</a>";
	}
	
	NewText += "</nobr>";
	NewText += "</div>";
	
	if (Location.Type) {
		NewText += " <div id='umResultLocType'>" + TypeText + ", </div>";
	}
	else {
		NewText += " <div id='umResultLocType'> </div>";
	}
	
	
	NewText += "<div id='umResultLoc'>" + Location.Region + " (" + Location.X + ", " + Location.Y + ")";
	
	NewText += "</div></div>";
	return NewText;
}


	// Add a location record to the end of the search results
function umAddSearchResult(Location) 
{
	var NewText = umCreateSearchResultText(Location);
	Location.ResultElement = umAddSearchResultText(NewText, Location.Name);
}


function umUpdateSearchResult(Location)
{
	if (Location === null || Location.ResultElement === null) return;
	var NewText = umCreateSearchResultText(Location);
	Location.ResultElement.innerHTML = NewText;
	
}
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
	
	var Query = '?game=' + umGame;
	
	if (Location)
		Query += '&id=' + Location.ID;
	else
		Query += '&id=-1';

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

