// code by Giovanni Zambotti - 29 October 2020
// update to ESRI JS 4.17 - 29 October 2020
// code update - 29 October 2020

require([
      "esri/WebMap", 
      "esri/Map",
      "esri/views/MapView",
      "esri/config", 
      "esri/identity/OAuthInfo", 
      "esri/identity/IdentityManager",      
      "esri/widgets/Locate",
      "esri/layers/FeatureLayer",
      "esri/layers/GraphicsLayer",
      "esri/Graphic",      
      "esri/renderers/SimpleRenderer",
      "esri/symbols/SimpleMarkerSymbol",
      "esri/symbols/SimpleFillSymbol",
      "esri/renderers/UniqueValueRenderer",
      "esri/geometry/Extent",
      "esri/widgets/Popup",
      "esri/layers/VectorTileLayer", 
      
      // Calcite Maps
      "calcite-maps/calcitemaps-v0.8",

      // Calcite Maps ArcGIS Support
      "calcite-maps/calcitemaps-arcgis-support-v0.8",

      // Bootstrap
      "bootstrap/Collapse",
      "bootstrap/Dropdown",
      "bootstrap/Tab",
      // Can use @dojo shim for Array.from for IE11
      "@dojo/framework/shim/array",

      "dojo/domReady!"
    ], //function(Map, MapView, FeatureLayer, GraphicsLayer,Graphic, MapImageLayer, TileLayer, SimpleRenderer, SimpleMarkerSymbol, 
      //SimpleFillSymbol, UniqueValueRenderer) {
      function(WebMap, Map, MapView, esriConfig, OAuthInfo, esriId, Locate, FeatureLayer, GraphicsLayer, Graphic, SimpleRenderer, SimpleMarkerSymbol, 
      SimpleFillSymbol, UniqueValueRenderer, Extent, Popup, VectorTileLayer, CalciteMaps, CalciteMapsArcGIS) {

      var regions = document.getElementById("infoRegions");
      var infoBuildings = document.getElementById("infoBuildings");

      esriConfig.portalUrl = "https://prodsmap.cadm.harvard.edu/portal";
      var oAuthInfo = new OAuthInfo({appId: "yE6vvgMdxc3uxoeD"});

      esriId.registerOAuthInfos([oAuthInfo]);    
      
      const regionsList = {
        Allston: [[-71.1237912, 42.363806],[16]],
        Boston: [[-71.1027915,42.3172869],[18]],
        BostonLMA: [[-71.1024294, 42.3366361],[17]],
        Cambridge: [[-71.1168498, 42.3759086],[16]]
      } 

      //document.getElementById("foo").style.display = "none"; 
      var myzoom = 14, lon = -71.116076, lat = 42.35800;

      var xMax = -7915458.81211143;
      var xMin = -7917751.9229597915;
      var yMax = 5217414.497463334;
      var yMin = 5216847.191394078;

      var vtlLayer = new VectorTileLayer({
        // URL to the vector tile service
        url: "https://www.arcgis.com/sharing/rest/content/items/7dc6cea0b1764a1f9af2e679f642f0f5/resources/styles/root.json"
      });     
      
      //var grestroomsURL = "https://devtmap.cadm.harvard.edu/server/rest/services/Hosted/all_gender_restrooms/FeatureServer"
      var grestroomsURL = "https://prodtmap.cadm.harvard.edu/server/rest/services/Hosted/inclusive_restrooms/FeatureServer"
      var grestroomsPopup = { // autocasts as new PopupTemplate()
        title: "{buildingroomname}"
      };
      
      var buildingRenderer = new SimpleRenderer({
        symbol: new SimpleFillSymbol({
          color: [0, 121, 193, 0.5],
          style: "solid",
          outline: {
            width: 1,
            color: "black"
          }
        })
      });
  
      var grestroomsLayer = new FeatureLayer({
        url: grestroomsURL,
        outFields: ["*"],
        visible: true,
        renderer: buildingRenderer
      });        
      // GraphicsLayer for displaying results
      var resultsLayer = new GraphicsLayer();
      
      var map = new WebMap({
        portalItem: {
          // autocasts as new PortalItem()
          id: "5ecfa491632743b3a72faeb6a11381a5"
        },
        /*basemap: "topo",*/
        layers: [grestroomsLayer, resultsLayer]
      });

      map.load().catch(function(error) {
        console.error(error);        
        var element = document.getElementById("feedbackWebMap");
        element.setAttribute("class", "js-modal modal-overlay modifier-class is-active");
      });

      var view = new MapView({
        container: "mapViewDiv",
        map: map,
        center: [lon, lat], /*-71.11607611178287, 42.37410778220068*/
        zoom: myzoom,        
        padding: {top: 50, bottom: 0}, 
        breakpoints: {xsmall: 768, small: 769, medium: 992, large: 1200}        
      });
      
      grestroomsLayer.popupTemplate = grestroomsPopup;

      // Disables map rotation
      view.constraints = {rotationEnabled: false};
     
      view.popup.dockOptions = {position: "bottom-left"}
                  
      /********************************
      * Create a locate widget object.
      *********************************/        
      var locateBtn = new Locate({view: view});

      // Add the locate widget to the top left corner of the view
      view.ui.add(locateBtn, {position: "top-left"});

      // add on mouse click on a map, clear popup and open it 

      view.on("click", function(evt) {        
        evt.stopPropagation()                       
        var infoBuildings = document.getElementById("infoBuildings");  
        //console.log(infoBuildings)
        // don't open popup before campus area selection          
        if(infoBuildings.length == 1){
          view.popup.visible = false;
          //alert("Please, select a building from the pulldown menu!")
          //showalert("test")
        }          
        else{
          infoBuildings.options[0].selected = true;        
          var screenPoint = evt.screenPoint;        
          // set location for the popup
          view.popup.location = evt.mapPoint;
          view.popup.visible = false;
          view.hitTest(screenPoint).then(getSingleBuilding);  
        }                
      });

      /*function showalert(message) {
        var div = document.getElementById('foo');
        console.log(div)
        var newNode = document.createElement('div');
        newNode.innerHTML = '<div id="alertdiv" class="alert alert-warning"><a class="close" data-dismiss="alert">×</a><span>'+message+'</span></div>';
        div.appendChild(newNode)
          //document.getElementById('foo').append('')
          setTimeout(function() { // this will automatically close the alert and remove this if the users doesnt close it in 5 secs
            document.getElementById('alertdiv').remove();
          }, 5000);
        }*/
      
      // create the popup and select the building footprint          
      function getSingleBuilding(response) {
        resultsLayer.popupTemplate = grestroomsPopup;         
        resultsLayer.removeAll();
        var graphic = response.results[0].graphic;
        var attributes = graphic.attributes;        
        var name = attributes.primary_building_name;
        var infoBuildings = document.getElementById("infoBuildings");
        
        var pGraphic = new Graphic({
          geometry: response.results[0].graphic.geometry,
          symbol: new SimpleFillSymbol({
            color: [ 255,0, 0, 0.4],
            style: "solid",
            outline: {  // autocasts as esri/symbols/SimpleLineSymbol
              color: "red",
              width: 2
            }
          })
        });
        
        resultsLayer.add(pGraphic);

        var image = attributes.root + ".jpg";
        console.log(image)
        // create content for the popup
        var popupDiv = document.createElement("img")
        var zimg = "https://prodsmap.cadm.harvard.edu/images/Buildings/" + image;
        popupDiv.src = zimg;
        popupDiv.alt = attributes.primary_building_name + " building image";

        var popupHref = document.createElement("a");
        var createAText = document.createTextNode('More Information');
        popupHref.setAttribute('href', attributes.source);
        popupHref.target = '_blank';
        popupHref.appendChild(createAText);
        
        var rCount = attributes.restroom_count;
        var rlocations = attributes.restroom_locations;
        var rusitub = attributes.usi_tub;
        
        var rlocationsArr = rlocations.split(',');

        var list = document.createElement('ul');
        list.setAttribute("id", "app");
        console.log(list)
        rlocationsArr.forEach(function (wizard) {
          var li = document.createElement('li');
          li.textContent = wizard;
          list.appendChild(li);
        });
                
        var zcontent = popupDiv.outerHTML + "<br/><br/>Total number of restrooms: " + rCount + "<br />Location description: " + list.innerHTML + "<br />Tub: " + rusitub + "<br />" + popupHref.outerHTML;
        
        view.popup.open({
          title: attributes.primary_building_name,
          content:  zcontent
        });

        regions.value = attributes.campus_area;
        infoBuildings.value = attributes.primary_building_name;        
      } 

      /********************************
      * Process the regions selection
      *********************************/  

      function querygRestroomsRegion(myval) {
        var query = grestroomsLayer.createQuery();
        query.where = "campus_area = '" + myval + "'"
        query.orderByFields = ['primary_building_name ASC']
        return grestroomsLayer.queryFeatures(query);        
      }
                 
        

      regions.addEventListener("change", function() {        
        var selectedRegions = regions.options[regions.selectedIndex].value;        
        // remove all the buildings from the options select
        for (i = 1; i < infoBuildings.length; i++) {             
            infoBuildings.remove(i); 
            i--;           
        }        

        if(infoBuildings.length == 1){
          var list = document.getElementById('infoBuildings');
          var option = document.createElement('option');                
          option.text = 'Select a buildings...';                        
          option.setAttribute('selected', true);
          option.setAttribute('disabled', true);
          option.setAttribute('hidden', true);
          list.add(option);
          console.log(infoBuildings.length) 
        }

        const keys = Object.entries(regionsList)
          for (const key of keys) {            
            if(key[0] == selectedRegions){
              console.log(key[1][0], key[1][1])
              view.center = key[1][0]
              view.zoom = key[1][1];
              querygRestroomsRegion(selectedRegions).then(resultsgRestroomsQuery);            
            }            
        }
      });
      
      /********************************
      * Process to select a specific building
      *********************************/  
      function resultsgRestroomsQuery(results) { 
        var list = document.getElementById('infoBuildings');
        var obj = results.features;
        console.log(obj)
        for(var i in obj){                      
          var option = document.createElement('option');                
          option.text = obj[i].attributes.primary_building_name;
          option.value = obj[i].attributes.primary_building_name;
          list.add(option);          
        }
      }

      var buildingInfo = document.getElementById("infoBuildings");

      buildingInfo.addEventListener("change", function() {        
        var selectedBuildings = buildingInfo.options[buildingInfo.selectedIndex].value;        
        console.log(selectedBuildings)
        //queryLactationBuldings(selectedBuildings)
        querygRestroomsBuldings(selectedBuildings).then(displayResultsBuldings);
        //view.popup.visible = true;
      });

      function querygRestroomsBuldings(myval) {
        var query = grestroomsLayer.createQuery();
        query.where = "primary_building_name = '" + myval + "'";
        query.outSpatialReference = 4326;
        console.log(query)
        return grestroomsLayer.queryFeatures(query);        
      }      

      function displayResultsBuldings(results) {   
        resultsLayer.removeAll();
        var features = results.features.map(function(graphic) {
          graphic.symbol = new SimpleFillSymbol({
            color: [ 255,0, 0, 0.4],
            style: "solid",
            outline: {  // autocasts as esri/symbols/SimpleLineSymbol
              color: "red",
              width: 2
            }
          });
          return graphic;
        });
                
        var list = document.createElement('ul');
        var obj = results.features[0].attributes;
        
        var popupDiv = document.createElement("img")
        var zimg = "https://prodsmap.cadm.harvard.edu/images/Buildings/" + results.features[0].attributes.root + ".jpg";
        popupDiv.src = zimg;
        popupDiv.alt = results.features[0].attributes.primary_building_name + " building image";

        var popupHref = document.createElement("a");
        var createAText = document.createTextNode('More Information');
        popupHref.setAttribute('href', results.features[0].attributes.source);
        popupHref.target = '_blank';
        popupHref.appendChild(createAText); 

        var rCount = results.features[0].attributes.restroom_count;
        var rlocations = results.features[0].attributes.restroom_locations;
        var rusitub = results.features[0].attributes.usi_tub;

        var rlocationsArr = rlocations.split(',');
        var list = document.createElement('ul');
        list.setAttribute("id", "app");
        console.log(list)
        rlocationsArr.forEach(function (wizard) {
          var li = document.createElement('li');
          li.textContent = wizard;
          list.appendChild(li);
        });
                
        var zcontent = popupDiv.outerHTML + "<br/><br/>Total number of restrooms: " + rCount + "<br />Location description: "+ list.innerHTML + "<br />Tub: " + rusitub + "<br />" + popupHref.outerHTML;
                
        view.center = [ results.features[0].geometry.centroid.longitude, results.features[0].geometry.centroid.latitude]
        console.log(view.center)
        view.popup.open({
          title: results.features[0].attributes.primary_building_name,
          content: zcontent,
          //updateLocationEnabled: false,
          location: view.center
        }); 
               
        resultsLayer.addMany(features);
      }              
    });