/*
Author: Conner Chessmore
Last Update: 4/18/2019
Contains:
	draw(), initMap(), map.addListener('click'), form visibility controls, editShapes(),functions for saving/creating/updating shapes,
	

 "Shapes" refers to the data types users see on the map,
not the basic shape types of the Google Maps API. Google Maps shapes are 'primitives' and our shapes use them as templates to create meaning
when placed; a polygon could be a parking lot, a building, a sports field, etc. but it will be referred to as such, not just as a polygon.


*/
var globalShape;
let map;
var shapes={};
var editArr = [];
var drawArr = [];
var pointArr = [];
//Array used to hold all elements comprising an individual building shape
var bldgArr = {};
//Array used to hold all elements comprising a parking shape
var prkngArr = {};
//Array used to hold all elements in a tour 'shape'
var tourArr = {};
//Global bools to track completion status of polygons and polylines; allows user to click until they are done
var lineDone = false;
var polyDone = false;
//Tracks if a user is editing an existing shape
var finishEditing = false;
var highLat = -2000;
var lowLat = 1000;
var highLng = -2000;
var lowLng = 2000;
//Used for centerpoint of map. 
var myLatLng = {lat: 38.8737013,lng: -99.341691};
//These booleans control whether the next marker is part of a polyline, polygon, the center of a circle, or a normal marker
var isEditing=false;
var shapeActive='';
var polyLineActive = false;
var polygonActive = false;
var parkingActive = false;
var markerActive = false;
var circleActive = false;
var buildingActive = false;
var tourActive = false;
var using = false;
//initMap holds all the code for adding shapes. Anything using google API must be within this function or it will not work
initMap = function() {
	  //Generic increment variable
	  var i = 0;
	  //Array to hold icon file paths
	  var icons={};
	  //Array used to hold the array of lat lng data for drawing each shape
	  var pointArr = [];
	  //These are used to determine the averages of lat lngs given to polygons, buildings, anything needing a center
	  //This is not perfect, of course, but for simple shapes and quick estimates it works
	  //If centers are extremely off, these may need adjusted, but these are way out of lat/lng ranges

	  var buildCenter = {"lat":0, "lng":0};
	  var pointNum = 0;
	  //drawArr is meant to hold data for drawing shapes if an existing layer is selected on the back end so the user knows what already exists
	  var drawArr = [];
	  map = new google.maps.Map(document.getElementById("map"), {
		zoom: 17,
		center: myLatLng
	});
	//Centerpoint of map
	var myLatlng = new google.maps.LatLng(38.8737013,-99.341691);


	//If user has selected a circle, this function first stores the centerpoint lat lng, then draws the circle after the radius is entered
	//Radius is in meters
	map.addListener('click', function( event ){
		shapeID=makeid(8);
		if(isEditing){
			switch(shapeActive){
				case 'circle':$('#property-head').show();$('#cancel').show(); saveCircle(event); break;
				case 'marker':$('#property-head').show();$('#cancel').show(); saveMarker(event); break;
				case 'polyline':$('#property-head').show();$('#cancel').show(); savePolyline(event); break;
				case 'polygon':$('#property-head').show();$('#cancel').show();savePolygon(event); break;
			}
			if(Object.keys(shapes).length>=1)
			{
				$('#undoLast').removeClass('disabled');
				$('#save').removeClass('disabled');
			}
			else
			{
				$('#undoLast').addClass('disabled');
				$('#save').addClass('disabled');	
			}
		}
	});
	
	$('#btn-building-create').on('click',function() {
		if(buildingActive == false)
		{
			buildingActive = true;
			$('#buildingForm').show();
			$('#bdlgName').show();
			$('#btn-building-create').addClass('disable');
			$('#cancel').show()
		}
	});
	$('#btn-tour-create').on('click', function() {
		if(tourActive == false)
		{
			$('#tourForm').show();
			tourActive = true;
			$('#btn-tour-create').addClass('disable');
		}
		$('#cancel').show()
	});
	$('#btn-parking-create').on('click', function() {
		if (parkingActive == false) {
			$('#parkingForm').show();
			parkingActive = true;
			$('#btn-parking-create').addClass('disable');
		}
		$('#cancel').show()
	});
	
	//undoLast will only undo one shape in a building shape; needs work to step through these arrayed shapes properly
	$('#undoLast').on('click',function() {
		if(Object.keys(shapes).length>= 1) {
		
		var x = Object.keys(shapes);
		console.log(x);
		shapes[x[0]].mapObject.setMap(null);
		delete shapes[x[0]];
		if(Object.keys(shapes).length < 1)
		{
			$('#undoLast').addClass('disabled');
			$('#save').addClass('disabled');
		}
		}
	})	;
	$('#delete').on('click', function() {
		deleteShape() 
	});
	//jQuery listeners for saving a new layer and updating the one currently selected

$("#update").on('submit',function(e) {
	e.preventDefault();
	//$.post("mapAddToDB.php",{data:JSON.stringify(shapes)});
});
$('#polygonForm').on('submit', function(e) {
		e.preventDefault();
		polyDone = true;
		savePolygon();
		if(buildingActive == true && polyDone == true)
		{
			if(typeof(shapeID)=="undefined" || typeof(shapeID)==undefined)
			{
				shapeID = makeid(8);
				globalShape.shapeID = shapeID;
			}
			if(globalShape.parentID != undefined) shapes[globalShape.parentID].elements[shapeID] = globalShape;
			else bldgArr[shapeID]=globalShape;
			updateList(bldgArr,'#buildingForm');
			editArr[shapeID]=globalShape;
			var shape=globalShape;
			google.maps.event.addListener(globalShape.mapObject, 'click', function(event){
				$('#delete').show();
				globalShape=shape;
				bldgID = (typeof(bldgFormatArr)=="undefined") ? shapeID : bldgFormatArr.bldgID;
				buildingActive = true;
				$('#polygonForm').show();
				$('#polygonForm  input[name=strokeColor]').val(globalShape.style.strokeColor);
				$('#polygonForm  input[name=strokeOpacity]').val(globalShape.style.strokeOpacity);
				$('#polygonForm  input[name=strokeWeight]').val(globalShape.style.strokeWeight);
				$('#polygonForm  input[name=fillColor]').val(globalShape.style.fillColor);
				$('#polygonForm  input[name=fillOpacity]').val(globalShape.style.fillOpacity);
			});
			pointArr = [];
		}
		else if(parkingActive == true && polyDone == true)
		{
			prkngArr[shapeID]=globalShape;
			updateList(prkngArr,'#parkingForm');
			editArr[shapeID]=globalShape;
			var shape=globalShape;
			google.maps.event.addListener(globalShape.mapObject, 'click', function(event){
				$('#delete').show();
				globalShape=shape;
				$('#polygonForm').show();
				$('#polygonForm  input[name=strokeColor]').val(globalShape.style.strokeColor);
				$('#polygonForm  input[name=strokeOpacity]').val(globalShape.style.strokeOpacity);
				$('#polygonForm  input[name=strokeWeight]').val(globalShape.style.strokeWeight);
				$('#polygonForm  input[name=fillColor]').val(globalShape.style.fillColor);
				$('#polygonForm  input[name=fillOpacity]').val(globalShape.style.fillOpacity);
			});
			pointArr = [];
		}
		else if(tourActive == true && polyDone == true)
		{
			tourArr[shapeID]=globalShape;
			updateList(tourArr,'#tourForm');
			editArr[shapeID]=globalShape;
			var shape=globalShape;
			google.maps.event.addListener(globalShape.mapObject, 'click', function(event){
				$('#delete').show();
				globalShape=shape;
				$('#polygonForm').show();
				$('#polygonForm  input[name=name]').val(globalShape.name);
				$('#polygonForm  input[name=description]').val(globalShape.description);
				$('#polygonForm  input[name=strokeColor]').val(globalShape.style.strokeColor);
				$('#polygonForm  input[name=strokeOpacity]').val(globalShape.style.strokeOpacity);
				$('#polygonForm  input[name=strokeWeight]').val(globalShape.style.strokeWeight);
				$('#polygonForm  input[name=fillColor]').val(globalShape.style.fillColor);
				$('#polygonForm  input[name=fillOpacity]').val(globalShape.style.fillOpacity);
			});
			pointArr = [];
		}
		else if(polyDone == true)
		{
			globalShape.index=shapeID;
			shapes[shapeID]=globalShape;
			$('.form-shape').hide();
			polyLineActive = false;
			var shape=globalShape;
			google.maps.event.addListener(globalShape.mapObject, 'click', function(event){
				$('#delete').show();
				globalShape=shape;
				$('#polygonForm').show();
				$('#polygonForm  input[name=name]').val(globalShape.name);
				$('#polygonForm  input[name=description]').val(globalShape.description);
				$('#polygonForm  input[name=strokeColor]').val(globalShape.style.strokeColor);
				$('#polygonForm  input[name=strokeOpacity]').val(globalShape.style.strokeOpacity);
				$('#polygonForm  input[name=strokeWeight]').val(globalShape.style.strokeWeight);
				$('#polygonForm  input[name=fillColor]').val(globalShape.style.fillColor);
				$('#polygonForm  input[name=fillOpacity]').val(globalShape.style.fillOpacity);
			});
		}
		if(Object.keys(shapes).length>=1)
		{
			$('#undoLast').removeClass('disabled');
			$('#save').removeClass('disabled');
		}
		else
		{
			$('#undoLast').addClass('disabled');
			$('#save').addClass('disabled');	
		}
		$('.form-shape').hide();
		$('#delete').hide();
		$('#dropdownMenuLink').removeClass('disabled');
		$('#property-head').hide();
		$('#cancel').hide();
		isEditing=false;
		shapeActive='';
		globalShape={};
	});
$('#buildingForm').on('submit', function(e) {
	e.preventDefault();
	var bldgID = makeid(8)
	bldgFormatArr = {name :$('#buildingForm input[name=bldgName]').val(),
				 type : "building",
				 bldgID : bldgID
	};
	$('.form-shape').hide();
	bldgActive = false;
	bldgFormatArr['elements']=bldgArr;
	var keys=Object.keys(bldgArr);
	for(i=0;i<keys.length;i++) bldgFormatArr['elements'][keys[i]].parentID = bldgID;
	shapes[bldgID]=bldgFormatArr;
	$('#buildingForm').hide();
	buildingActive = false;
	bldgArr = [];
	});
$('#parkingForm').on('submit', function(e) {
	e.preventDefault();
	var prkngID = makeid(8)
	prkngFormatArr = {name :$('#parkingForm input[name=prkngName]').val(),
					 type : "parking",
					 prkngID : prkngID
	};
	$('.form-shape').hide();
	parkingActive = false;
	prkngFormatArr['elements']=prkngArr;
	var keys=Object.keys(prkngArr);
	for(i=0;i<keys.length;i++) prkngFormatArr['elements'][keys[i]].parentID = prkngID;
	shapes[prkngID]=prkngFormatArr;
	$('#parkingForm').hide();
	parkingActive = false;
	prkngArr = [];
});
$('#tourForm').on('submit', function(e) {
	e.preventDefault();
	var tourID = makeid(8)
	tourFormatArr = {name :$('#tourForm input[name=tourName]').val(),
					 type : "tour",
					 tourID : tourID
	};
	$('.form-shape').hide();
	tourActive = false;
	tourFormatArr['elements']=tourArr;
	var keys=Object.keys(tourArr);
	for(i=0;i<keys.length;i++) tourFormatArr['elements'][keys[i]].parentID = tourID;
	shapes[tourID]=tourFormatArr;
	$('#tourForm').hide();
	tourActive = false;
	tourArr = [];
})
$('#polylineForm').on('submit', function(e) {
		e.preventDefault();
		lineDone = true;
		savePolyline();
		if(buildingActive == true && lineDone == true)
		{
			if(typeof(shapeID)=="undefined" || typeof(shapeID)==undefined)
			{
				shapeID = makeid(8);
				globalShape.shapeID = shapeID;
			}
			if(globalShape.parentID != undefined) shapes[globalShape.parentID].elements[shapeID] = globalShape;
			else bldgArr[shapeID]=globalShape;
			bldgArr[shapeID]=globalShape;
			updateList(bldgArr,'#buildingForm');
			editArr[shapeID]=globalShape;
			var shape=globalShape;
			google.maps.event.addListener(globalShape.mapObject, 'click', function(event){
				$('#delete').show();
				globalShape=shape;
				polylineActive=true;
				buildingActive = true;
				$('#polylineForm').show();
				$('#polylineForm input[name=name]').val(globalShape.name);
				$('#polylineForm input[name=description]').val(globalShape.description);
				$('#polylineForm  input[name=strokeColor]').val(globalShape.style.strokeColor);
				$('#polylineForm  input[name=strokeOpacity]').val(globalShape.style.strokeOpacity);
				$('#polylineForm  input[name=strokeWeight]').val(globalShape.style.strokeWeight);
			});
			pointArr = [];
		}
		else if(parkingActive == true && lineDone == true)
		{
			prkngArr[shapeID]=globalShape;
			updateList(prkngArr,'#parkingForm');
			editArr[shapeID]=globalShape;
			var shape=globalShape;
			google.maps.event.addListener(globalShape.mapObject, 'click', function(event){
				$('#delete').show();
				globalShape=shape;
				$('#polylineForm').show();
				$('#polylineForm input[name=name]').val(globalShape.name);
				$('#polylineForm input[name=description]').val(globalShape.description);
				$('#polylineForm  input[name=strokeColor]').val(globalShape.style.strokeColor);
				$('#polylineForm  input[name=strokeOpacity]').val(globalShape.style.strokeOpacity);
				$('#polylineForm  input[name=strokeWeight]').val(globalShape.style.strokeWeight);
			});
			pointArr = [];
		}
		else if(tourActive == true && lineDone == true)
		{
			tourArr[shapeID]=globalShape;
			updateList(tourArr,'#tourForm');
			editArr[shapeID]=globalShape;
			pointArr = [];
			var shape=globalShape;
			google.maps.event.addListener(globalShape.mapObject, 'click', function(event){
				$('#delete').show();
				globalShape=shape;
				$('#polylineForm').show();
				$('#polylineForm input[name=name]').val(globalShape.name);
				$('#polylineForm input[name=description]').val(globalShape.description);
				$('#polylineForm  input[name=strokeColor]').val(globalShape.style.strokeColor);
				$('#polylineForm  input[name=strokeOpacity]').val(globalShape.style.strokeOpacity);
				$('#polylineForm  input[name=strokeWeight]').val(globalShape.style.strokeWeight);
			});
		}
		else if(lineDone == true)
		{
			globalShape.index=shapeID;
			shapes[shapeID]=globalShape;
			polyLineActive = false;
			var shape=globalShape;
			google.maps.event.addListener(globalShape.mapObject, 'click', function(event){
				$('#delete').show();
				globalShape=shape;
				$('#polylineForm').show();
				$('#polylineForm input[name=name]').val(globalShape.name);
				$('#polylineForm input[name=description]').val(globalShape.description);
				$('#polylineForm  input[name=strokeColor]').val(globalShape.style.strokeColor);
				$('#polylineForm  input[name=strokeOpacity]').val(globalShape.style.strokeOpacity);
				$('#polylineForm  input[name=strokeWeight]').val(globalShape.style.strokeWeight);
			});
		}
		if(Object.keys(shapes).length>=1)
		{
			$('#undoLast').removeClass('disabled');
			$('#save').removeClass('disabled');
		}
		else
		{
			$('#undoLast').addClass('disabled');
			$('#save').addClass('disabled');	
		}
		$('.form-shape').hide();
		$('#delete').hide();
		$('#dropdownMenuLink').removeClass('disabled');
		$('#property-head').hide();
		$('#cancel').hide();
		isEditing=false;
		shapeActive='';
		globalShape={};
	});
$('#circleForm').on('submit',function(e) {
	e.preventDefault();
	finishEditing=true;
	saveCircle(undefined,globalShape);
});
$('#markerForm').on('submit',function(e) {
		e.preventDefault();
		finishEditing=true;
		saveMarker(undefined,globalShape);
});

$('#cancel').on('click',function()
{
	isEditing = false;
	finishEditing = true;
	var shapeActive='';
	var polyLineActive = false;
	var polygonActive = false;
	var parkingActive = false;
	var markerActive = false;
	var circleActive = false;
	var buildingActive = false;
	var tourActive = false;
	$('#dropdownMenuLink').removeClass('disabled');
	$('#property-head').hide();
	$('.form-shape').hide();
	$('#cancel').hide();
	if(globalShape==undefined){}
	else {globalShape.mapObject.setMap(null)};
	
});
	
function deleteShape() {
	if(globalShape.parentID != undefined)
	{
		shapes[globalShape.parentID].elements[globalShape.index].mapObject.setMap(null);
		delete shapes[globalShape.parentID].elements[globalShape.index];
		if(Object.keys(shapes[globalShape.parentID].elements).length <= 0)	 delete shapes[globalShape.parentID];
	}
	else 
	{
		shapes[globalShape.index].mapObject.setMap(null);
		delete shapes[globalShape.index];
	}
	$('.form-shape').hide();
}
function draw(jsonArray, map) {
	for(key in jsonArray){
		switch(jsonArray[key]['type']) {
			case "circle":
				drawCircle(jsonArray,map);
			break;
			
			case "building":
				console.log(jsonArray[key]);
				drawBuilding(jsonArray,map);
			break;
			
			case "polygon":
				drawPolygon(jsonArray,map);
			break;
			
			case "polyline":
				drawPolyline(jsonArray,map);
			break;
			
			case "parking":
				drawParking(jsonArray,map);
			break;
			
			case "poi" || "marker":
				drawMarker(jsonArray,map);
			break;
			
			default:
			console.log('Error loading shape ' + key);
			break;
		}
	}
}

function drawCircle(shape, map)
{
	var indexID = makeid(8);
	var circle = new google.maps.Circle ({
			type:'circle',
				style: {
					strokeColor: shape[key]['details']['style']['strokeColor'],
					strokeOpacity: shape[key]['details']['style']['strokeOpacity'],
					strokeWeight: shape[key]['details']['style']['strokeWeight'],
					fillColor: shape[key]['details']['style']['fillColor'],
					fillOpacity: shape[key]['details']['style']['fillOpacity'],
				},
				strokeColor: shape[key]['details']['style']['strokeColor'],
				strokeOpacity: shape[key]['details']['style']['strokeOpacity'],
				strokeWeight: shape[key]['details']['style']['strokeWeight'],
				fillColor: shape[key]['details']['style']['fillColor'],
				fillOpacity: shape[key]['details']['style']['fillOpacity'],
				name: shape[key]['name'],
				type: shape[key]['type'],
				map: map,
				center: shape[key]['details']['LLcenter'],
				radius: shape[key]['details']['radius'],
				description: shape[key]['description'],
				index:indexID
			});
			var shape=globalShape;
			shapeObj = circle;
			google.maps.event.addListener(circle, 'click', function(event) {
				$('#delete').show();
				globalShape = shapeObj;
				$('#circleForm').show();
				$('#circleForm input[name=name]').val(shapeObj.name);
				$('#circleForm input[name=radius').val(shapeObj['radius']);
				$('#circleForm  input[name=description]').val(shapeObj['description']);
				$('#circleForm  input[name=strokeColor]').val(shapeObj['style']['strokeColor']);
				$('#circleForm  input[name=strokeOpacity]').val(shapeObj['style']['strokeOpacity']);
				$('#circleForm  input[name=strokeWeight]').val(shapeObj['style']['strokeWeight']);
				$('#circleForm  input[name=fillColor]').val(shapeObj['style']['fillColor']);
				$('#circleForm  input[name=fillOpacity]').val(shapeObj['style']['fillOpacity']);
			});
			circle.setMap(map);
			if(parkingActive == true)
			{
				prkngArr[indexID]=circle;
			}
			else if(buildingActive == true)
			{
				bldgArr[indexID]=circle;
			}
			else if(tourActive == true)
			{
				tourArr[indexID]=circle;
			}
			else shapes[indexID]=circle;
}

function drawPolyline(shape,map)
{
	var polyline = new google.maps.Polyline({
					type:shape[key]['type'],
					name:shape[key]['name'],
					path: shape[key]['details']['LLoutline'],
					geodesic: true,
					style:{
						strokeColor: shape[key]['details']['style']['strokeColor'],
						strokeOpacity: shape[key]['details']['style']['strokeOpacity'],
						strokeWeight: shape[key]['details']['style']['strokeWeight'],
					},
					strokeColor: shape[key]['details']['style']['strokeColor'],
					strokeOpacity: shape[key]['details']['style']['strokeOpacity'],
					strokeWeight: shape[key]['details']['style']['strokeWeight'],
					description: shape['description']
				});
				globalShape=polyline
				var shape=globalShape;
				shapeObj = polyline;
				google.maps.event.addListener(globalShape.mapObject, 'click', function(event){
					$('#delete').show();
					globalShape=shape;
					$('#polylineForm').show();
					$('#polylineForm  input[name=name]').val(globalShape.name);
					$('#polylineForm  input[name=description]').val(globalShape.description);
					$('#polylineForm  input[name=strokeColor]').val(globalShape.style.strokeColor);
					$('#polylineForm  input[name=strokeOpacity]').val(globalShape.style.strokeOpacity);
					$('#polylineForm  input[name=strokeWeight]').val(globalShape.style.strokeWeight);
				});
			polyline.setMap(map);
			if(parkingActive == true)
			{
				prkngArr[makeid(8)]=polyline;
			}
			else if(buildingActive == true)
			{
				bldgArr[makeid(8)]=polyline;
			}
			else if(tourActive == true)
			{
				tourArr[makeid(8)]=polyline;
			}
			else shapes[makeid(8)]=polyline;
}

function drawPolygon(shape,map)
{	
	var index = makeid(8);
	var polygon = new google.maps.Polygon ({
				path:shape[key]['details']['LLoutline'],
				style:{
					strokeColor: (shape[key]['details']['style']==undefined)? '#000000' : shape[key]['details']['style']['strokeColor'],
					strokeOpacity: (shape[key]['details']['style']==undefined)? '1' :shape[key]['details']['style']['strokeOpacity'],
					strokeWeight: (shape[key]['details']['style']==undefined)? '1' : shape[key]['details']['style']['strokeWeight'],
					fillColor: (shape[key]['details']['style']==undefined)? '#000000' : shape[key]['details']['style']['fillColor'],
					fillOpacity: (shape[key]['details']['style']==undefined)? '.5' : shape[key]['details']['style']['fillOpacity'],
				},
				strokeColor: (shape[key]['details']['style']==undefined)? '#000000' : shape[key]['details']['style']['strokeColor'],
				strokeOpacity: (shape[key]['details']['style']==undefined)? '1' :shape[key]['details']['style']['strokeOpacity'],
				strokeWeight: (shape[key]['details']['style']==undefined)? '1' : shape[key]['details']['style']['strokeWeight'],
				fillColor: (shape[key]['details']['style']==undefined)? '#000000' : shape[key]['details']['style']['fillColor'],
				fillOpacity: (shape[key]['details']['style']==undefined)? '.5' : shape[key]['details']['style']['fillOpacity'],
				name:shape[key]['name'],
				type:shape[key]['type'],
				map: map,
				index:index,
				description:shape[key]['description'],
				picture:shape[key]['details']['picture']
			});
			globalShape = polygon;
			var shape=globalShape;
			shapeObj = polygon;
			google.maps.event.addListener(shapeObj, 'click', function(event){
				$('#delete').show();
				globalShape=shape;
				$('#polygonForm').show();
				$('#polygonForm  input[name=name]').val(globalShape.name);
				$('#polygonForm  input[name=description]').val(globalShape.description);
				$('#polygonForm  input[name=strokeColor]').val(globalShape.style.strokeColor);
				$('#polygonForm  input[name=strokeOpacity]').val(globalShape.style.strokeOpacity);
				$('#polygonForm  input[name=strokeWeight]').val(globalShape.style.strokeWeight);
				$('#polygonForm  input[name=fillColor]').val(globalShape.style.fillColor);
				$('#polygonForm  input[name=fillOpacity]').val(globalShape.style.fillOpacity);
				$('#polygonForm  input[name=picture').val(globalShape.picture);
			});
			polygon.setMap(map);
			if(parkingActive == true)
			{
				prkngArr[index]=polygon;
			}
			else if(buildingActive == true)
			{
				bldgArr[index]=polygon;
			}
			else if(tourActive == true)
			{
				tourArr[index]=polygon;
			}
			else shapes[index]=polygon;
}

function drawMarker(shape,map)
{
	
			if(icons[shape[key]['details']['icon']]==undefined){
				icons[shape[key]['details']['icon']] = {
						url: shape[key]['details']['icon'],
						scaledSize: new google.maps.Size(50,50),
				};
			}
			var marker  = new google.maps.Marker ({
				position:new google.maps.LatLng(shape[key]['details']['LLcenter']),
				name:shape[key]['details']['name'],
				icon:icons[shape[key]['details']['icon']],
				description:shape[key]['details']['infoBoxString'],
				infoURL:shape[key]['details']['infoURL'],
				infoURLTitle:shape[key]['details']['infoURLTitle'],
				infoURLLink:shape[key]['details']['infoURLLink'],
				visible:true
			});
			var shapeObj = globalShape;
			shapeObj = marker;
			google.maps.event.addListener(marker, 'click', function(event) {
				$('#delete').show();
				globalShape = shapeObj;
				$('#markerForm').show();
				$('#markerForm  input[name=name]').val(shapeObj.name);
				$('#markerForm  input[name=description]').val(shapeObj.infoBoxString);
				$('#markerForm  input[name=urlTitle]').val(shapeObj.infoURLTitle);
				$('#markerForm  input[name=infoURLLink]').val(shapeObj.infoURLLink);
				$('#markerForm input[name=picture]').val(shapeObj.icon);
			});
			marker.setMap(map);
			if(parkingActive == true)
			{
				prkngArr[makeid(8)]=marker;
			}
			else if(buildingActive == true)
			{
				bldgArr[makeid(8)]=marker;
			}
			else if(tourActive == true)
			{
				tourArr[makeid(8)]=marker;
			}
			else shapes[makeid(8)]=marker;
}

function drawParking(shape,map)
{
	parkingActive = true;
	for(var i in shape)
	{
		draw(shape[i],map);
	}
	shapes[makeid(8)]=prkngArr;
	prkngArr = [];
	parkingActive = false;
}

function drawTour(shape,map)
{
	tourActive = true;
	for(var i in shape)
	{
		draw(shape[i],map);
	}
	shapes[makeid(8)]=tourArr;
	tourArr = [];
	tourActive = false;
}

function drawBuilding(shape,map)
{
	buildingActive = true;
	if(shape['elements'] == undefined)
	{
		drawPolygon(shape,map);
		shapes[shapeObj['index']] = shapeObj;
	}
	else{
			
		for(var i in shape)
		{
			draw(shape[i],map);
		}
		shapes[makeid(8)]=bldgArr;
		bldgArr = [];
		buildingActive = false;
	}
}



}
//Updates list below complex shapes (buildings, tours, etc.) to show the name of the shapes that have been added
function updateList(itemArr,formName) {
	$('#dynamicList').remove();
	var str = '<ul class="list-group" id="dynamicList">';
	for(var i in itemArr){
		temp=itemArr[i];
	   str += '<li class="list-group-item">'+temp.name+'</li>';
	}

	str += '</ul>';

	$(formName).append(str);
};

function makeid(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function saveMarker(event=undefined,shape=undefined){
	var shapeID;
	var lat1;
	var lng1;
	var position;
	if(shape==undefined){
		shapeID=makeid(8);
		lat1 = event.latLng.lat();
		lng1 = event.latLng.lng();
		position = new google.maps.LatLng(lat1,lng1);
	}
	else{
		if(shape.mapObject == undefined)
		{	
			position = shape.mapObject.position;
			shape.mapObject.setMap(null);
		}
		else
		{
			position = shape.position;
			shape.setMap(null);
		}
		shapeID=shape.index;
	}
	var marker = new google.maps.Marker({
		position: position,
		type: "marker",
		name:$('#markerForm  input[name=name]').val(),
		icon:$('markerForm  input[name=picture]').val(),
		description:$('#markerForm  input[name=description]').val(),
		infoURLTitle:$('#markerForm  input[name=urlTitle]').val(),
		infoURLLink:$('#markerForm  input[name=infoURLLink]').val(),
		index: shapeID
	});
	var shapeObj = {
		mapObject: marker,
		type:"poi",
		name:marker.name,
		icon:$('markerForm  input[name=picture]').val(),
		LLcenter:marker.position,
		infoWindow:true,
		picture:$('#markerForm  input[name=picture]').val(),
		description:$('#markerForm  input[name=description]').val(),
		infoURL:true,
		infoURLTitle:$('#markerForm  input[name=urlTitle]').val(),
		infoURLLink:$('#markerForm  input[name=infoURLLink]').val(),
		index:shapeID,
	}
	google.maps.event.addListener(marker, 'click', function(event) {
		$('#delete').show();
		globalShape = shapeObj;
		$('#markerForm').show();
		$('#markerForm  input[name=name]').val(shapeObj.name);
		$('#markerForm  input[name=description]').val(shapeObj.infoBoxString);
		$('#markerForm  input[name=urlTitle]').val(shapeObj.infoURLTitle);
		$('#markerForm  input[name=infoURLLink]').val(shapeObj.infoURLLink);
		$('#markerForm input[name=picture]').val(shapeObj.icon);
	});
	marker.setMap(map);
	if(buildingActive == true)
	{
		bldgArr[shapeID]=shapeObj;
		updateList(bldgArr,'#buildingForm');
		editArr[shapeID]=shapeObj;
	}
	else if(parkingActive == true)
	{
		prkngArr[shapeID]=shapeObj;
		updateList(prkngArr,'#parkingForm');
		editArr[shapeID]=shapeObj;
	}
	else if(tourActive == true)
	{
		tourArr[shapeID]=jsonStr;
		updateList(tourArr,'#tourForm');
		editArr[shapeID]=shapeObj;
	}
	else
	{
		shapes[shapeID]=shapeObj;
		$('.form-shape').hide();
	}
	$('#delete').hide();
	$('#dropdownMenuLink').removeClass('disabled');
	$('#property-head').hide();
	$('#cancel').hide();
	isEditing=false;
	shapeActive='';
}

function savePolyline(event=undefined){
	var lat1;
	var lng1;
	if(globalShape==undefined || globalShape.name==undefined){
		pointArr=[];
		drawArr=[];
		lat1 = event.latLng.lat();
		lng1 = event.latLng.lng();
		path = new google.maps.LatLng(lat1,lng1);
	}
	if(event != undefined) {
	var lat = event.latLng.lat();
	var lng = event.latLng.lng();
	var latlng = new google.maps.LatLng(lat,lng);
	pointArr.push(latlng);
	}
	if(pointArr.length == 0)
	{
		if(typeof(globalShape.latLngs) == "undefined")
		{
			var pathArr = globalShape.LLoutline;
		}
		else
		{
			var pathArr = globalShape.latLngs.j[0].j;
		}
	}
	else
	{
		var pathArr = pointArr
	}
	var polyline = new google.maps.Polyline({
			type:'polyline',
			path: pathArr,
			geodesic: true,
			strokeColor: $('#polylineForm input[name=strokeColor]').val(),
			strokeOpacity: parseFloat($('#polylineForm input[name=strokeOpacity]').val()),
			strokeWeight: $('#polylineForm input[name=strokeWeight]').val(),
			index:makeid(8)
		});
		globalShape = polyline
	if(globalShape.setMap == undefined) globalShape.mapObject.setMap(null)
	else globalShape.setMap(null);
	var shapeObj = {
		mapObject: polyline,
		name:$('#polylineForm input[name=name]').val(),
		description:$('#polylineForm input[name=description]').val(),
		parentID: globalShape!=undefined && globalShape.parentID!=undefined ? globalShape.parentID : undefined,
		type:polyline.type,
		style: {
			strokeColor:polyline.strokeColor,
			strokeOpacity:polyline.strokeOpacity,
			strokeWeight:polyline.strokeWeight
		},
		LLoutline:polyline.latLngs.Kb[0].j
	}
	drawArr.push(polyline);
	for(x in drawArr) { drawArr[x].setMap(null); };
	polyline.setMap(map);
	globalShape = shapeObj;
}
	
function savePolygon(event=undefined){
	var lat1;
	var lng1;
	if(globalShape==undefined || globalShape.name==undefined){
		pointArr=[];
		drawArr=[];
		lat1 = event.latLng.lat();
		lng1 = event.latLng.lng();
		path = new google.maps.LatLng(lat1,lng1);
	}
	if(event!=undefined) {
	var lat = event.latLng.lat();
	var lng = event.latLng.lng();
	var latlng = new google.maps.LatLng(lat,lng);
	pointArr.push(latlng);
	}
	if(pointArr.length == 0)
	{
		if(typeof(globalShape.latLngs) == "undefined")
		{
			var pathArr = globalShape.LLoutline;
		}
		else
		{
			var pathArr = globalShape.latLngs.j[0].j;
		}
	}
	else
	{
		var pathArr = pointArr
	}
	var polygon = new google.maps.Polygon({
			type:'polygon',
			path: pathArr,
			geodesic: true,
			strokeColor: $('#polygonForm input[name=strokeColor]').val(),
			strokeOpacity: parseFloat($('#polygonForm input[name=strokeOpacity]').val()),
			strokeWeight: $('#polygonForm input[name=strokeWeight]').val(),
			fillColor: $('#polygonForm input[name=fillColor]').val(),
			fillOpacity: $('#polygonForm input[name=fillOpacity]').val(),
			index:makeid(8)
		});
		globalShape = polygon;
	if(globalShape.setMap == undefined) globalShape.mapObject.setMap(null);
	else globalShape.setMap(null);
	var shapeObj = {
		mapObject: polygon,
		name:$('#polygonForm input[name=name]').val(),
		parentID: globalShape!=undefined && globalShape.parentID!=undefined ? globalShape.parentID : undefined,
		description:$('#polygonForm input[name=description]').val(),
		type:polygon.type,
		style: {
			strokeColor:polygon.strokeColor,
			strokeOpacity:polygon.strokeOpacity,
			strokeWeight:polygon.strokeWeight,
			fillColor:polygon.fillColor,
			fillOpacity:polygon.fillOpacity
		},
		LLoutline:polygon.latLngs.Kb[0].j
	}
	drawArr.push(polygon);
	for(x in drawArr) { drawArr[x].setMap(null); };
	polygon.setMap(map);
	globalShape = shapeObj;
}

function saveCircle(event=undefined,shape=undefined){
	var shapeID;
	var lat1;
	var lng1;
	var center;
	if(shape==undefined){
		shapeID=makeid(8);
		lat1 = event.latLng.lat();
		lng1 = event.latLng.lng();
		center = new google.maps.LatLng(lat1,lng1);
	}else{
		shapeID=shape.index;
		if(shape.mapObject == undefined)
		{
			lat1 = shape.center.lat;
			lng1 = shape.center.lng;
			center = shape.center;
			shape.setMap(null);
		}
		else{
			lat1 = shape.mapObject.center.lat;
			lng1 = shape.mapObject.center.lng;
			center = shape.mapObject.center;
			shape.mapObject.setMap(null);
		}
		
		
	}
	
	var circle = new google.maps.Circle({
		type:'circle',
		strokeColor: $('#circleForm input[name=strokeColor]').val(),
		strokeOpacity:$('#circleForm input[name=strokeOpacity]').val(),
		strokeWeight: $('#circleForm input[name=strokeWeight]').val(),
		fillColor: $('#circleForm input[name=fillColor]').val(),
		fillOpacity: $('#circleForm input[name=fillOpacity]').val(),
		map: map,
		center: center,
		radius: parseFloat($('#circleForm input[name=radius]').val()),	
		index: shapeID
	});
	
	var shapeObj = {
			mapObject: circle,
			name:$('#circleForm input[name=name]').val(),
			type:circle.type,
			style: {
				strokeColor:circle.strokeColor,
				strokeOpacity:circle.strokeOpacity,
				strokeWeight:circle.strokeWeight,
				fillOpacity:circle.fillOpacity,
				fillColor:circle.fillColor
			},
			LLcenter:circle.center,
			radius:circle.radius,
			infoWindow:true,
			description:$('#circleForm input[name=description]').val(),
			index: shapeID,
	};
	google.maps.event.addListener(circle, 'click', function(event) {
		$('#delete').show();
		globalShape = shapeObj;
		$('#circleForm').show();
		$('#circleForm input[name=name]').val(shapeObj.name);
		$('#circleForm input[name=radius').val(shapeObj['radius']);
		$('#circleForm  input[name=description]').val(shapeObj['description']);
		$('#circleForm  input[name=strokeColor]').val(shapeObj['style']['strokeColor']);
		$('#circleForm  input[name=strokeOpacity]').val(shapeObj['style']['strokeOpacity']);
		$('#circleForm  input[name=strokeWeight]').val(shapeObj['style']['strokeWeight']);
		$('#circleForm  input[name=fillColor]').val(shapeObj['style']['fillColor']);
		$('#circleForm  input[name=fillOpacity]').val(shapeObj['style']['fillOpacity']);
	});
	if(buildingActive == true)
	{
		bldgArr[shapeID]=shapeObj;
		updateList(bldgArr,'#buildingForm');
		editArr[shapeID]=shapeObj;
	}
	else if(parkingActive == true)
	{
		prkngArr[shapeID]=shapeObj;
		updateList(prkngArr,'#parkingForm');
		editArr[shapeID]=shapeObj;
	}
	else if(tourActive == true)
	{
		tourArr[shapeID]=jsonStr;
		updateList(tourArr,'#tourForm');
		editArr[shapeID]=shapeObj;
	}
	else
	{
		shapes[shapeID]=shapeObj;
		$('.form-shape').hide();
	}
	$('#delete').hide();
	$('#dropdownMenuLink').removeClass('disabled');
	$('#property-head').hide();
	$('#cancel').hide();
	isEditing=false;
	shapeActive='';
	$('#save').removeClass('disabled');
}

$('#btn-circle-create').on('click',function() {
	if(buildingActive) $('.form-shape').hide();
	$('#dropdownMenuLink').addClass('disabled');
	isEditing=true;
	shapeActive='circle';
	$('#circleForm').show();
	$('#property-head').show();
	$('#cancel').show();
});

$('#btn-marker-create').on('click',function() {
	if(buildingActive) $('.form-shape').hide();
	$('#dropdownMenuLink').addClass('disabled');
	isEditing=true;
	shapeActive='marker';
	$('#markerForm').show();
	$('#property-head').show();
	
	$('#cancel').show();
});

$('#btn-polyline-create').on('click',function() {
	if(buildingActive) $('.form-shape').hide();
	$('#dropdownMenuLink').addClass('disabled');
	isEditing=true;
	shapeActive='polyline';
	$('#polylineForm').show();
	$('#property-head').show();
	$('#cancel').show();
});

$('#btn-polygon-create').on('click',function() {
	if(buildingActive) $('.form-shape').hide();
	$('#dropdownMenuLink').addClass('disabled');
	isEditing=true;
	shapeActive='polygon';
	$('#polygonForm').show();
	$('#property-head').show();
	$('#cancel').show();
});
