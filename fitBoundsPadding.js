(function() {

		var oldFitBounds = google.maps.Map.prototype.fitBounds;

		google.maps.Map.prototype.fitBounds = function(bounds, opts) {
				if(opts) {
						 
						/* Helper methods */
				    var _latRad = function(lat) {
				      var radX2, sin;
				      sin = Math.sin(lat * Math.PI / 180);
				      radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
				      return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
				    }
				    
				    var _zoom = function(mapPx, worldPx, fraction) {
				      return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
				    }

						var _getMapDims = function(){
							var scale = Math.pow(2, map.getZoom());
							var nw = new google.maps.LatLng(
							    map.getBounds().getNorthEast().lat(),
							    map.getBounds().getSouthWest().lng()
							);
							var se = new google.maps.LatLng(
							    map.getBounds().getSouthWest().lat(),
							    map.getBounds().getNorthEast().lng()
							);
							var worldCoordinateNW = map.getProjection().fromLatLngToPoint(nw);
							var worldCoordinateSE = map.getProjection().fromLatLngToPoint(se);
							return {
							    width: Math.floor((worldCoordinateSE.x - worldCoordinateNW.x) * scale),
							    height: Math.floor((worldCoordinateSE.y - worldCoordinateNW.y) * scale)
							}
	    			}

	  				var _getScale = function(){
	  					var WORLD_DIM, ZOOM_MAX, latFraction, latRad, latZoom, lngDiff, lngFraction, lngZoom, ne, sw, zoom;

							WORLD_DIM = {
						      height: 256,
						      width: 256
						    };
					    mapDim = _getMapDims()
					    ZOOM_MAX = 21;
					    ne = bounds.getNorthEast();
					    sw = bounds.getSouthWest();
					    latFraction = (_latRad(ne.lat()) - _latRad(sw.lat())) / Math.PI;
					    lngDiff = ne.lng() - sw.lng();
					    lngFraction = (lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360;
					    latZoom = _zoom(mapDim.height, WORLD_DIM.height, latFraction);
					    lngZoom = _zoom(mapDim.width, WORLD_DIM.width, lngFraction);
					    zoom = Math.min(latZoom, lngZoom, ZOOM_MAX);
					    return Math.pow(2,zoom);
	  				}

						var _convertLatLngToPixel = function(latlng) {
								var proj = map.getProjection();
								var point = proj.fromLatLngToPoint(latlng);
								return {
										x: point.x * scale,
										y: point.y * scale
								}
						}

						var _convertPixelToLatLng = function(pixel) {
								var proj = map.getProjection();
								var point = new google.maps.Point(pixel.x / scale, pixel.y / scale);
								return proj.fromPointToLatLng(point);
						}

						var _getPixelBounds = function(bounds, cb) {
								if(map.getProjection()) {
										var returnVal = {
												sw: _convertLatLngToPixel(bounds.getSouthWest()),
												ne: _convertLatLngToPixel(bounds.getNorthEast())
										}
										cb(returnVal);
								}
								else {
										google.maps.event.addListener(map, 'projection_changed', function () {
												_getPixelBounds(bounds, cb);
										});
								}
						}

						var _extendBoundsByPaddingValue = function(bounds, opts) {
								_getPixelBounds(bounds, function(pxbounds) {
										for(var prop in opts) {
												switch(prop) {
												case 'left':
														pxbounds.sw.x -= opts.left;
														break;
												case 'top':
														pxbounds.ne.y -= opts.top;
														break;
												case 'right':
														pxbounds.ne.x += opts.right;
														break;
												case 'bottom':
														pxbounds.sw.y += opts.bottom;
														break;
												}
										}
										var bounds = new google.maps.LatLngBounds(_convertPixelToLatLng(pxbounds.sw), _convertPixelToLatLng(pxbounds.ne));
										oldFitBounds.call(map, bounds);
								});
						}
						
						var map     = this,
								scale   = _getScale();
						_extendBoundsByPaddingValue(bounds, opts);
				}
				
				else {
					oldFitBounds.call(this, bounds);
				}

		}
})();