//pop10 = satellite imagery (geotiff) 
//training_pop10 = training sites (.shp)
//set center with satellite imagery
Map.centerObject(pop10, 13)
// Mosaic the Image to stitch all parts and select relevant Bands
var studyarea = pop10.select("b1", "b2" ,"b3", "b4", "b5", "b6", "b7", "b8");

// Visualization Parameters
var rgbVis = {
  min: 0.0,
  max: 1500,
  bands: [ 'b4', 'b3', 'b2'],
};

// run this line to visualize the satellite imagery
//Map.addLayer(mosaic, rgbVis);


//Random Forest Script-------------------------------------------------------------------------------

//add training data 
var newfc = training_pop10

//see training points 
print(newfc);


// Sample the input imagery to get a FeatureCollection of training data.
var bands = ["b1", "b2", "b3" , "b4"."b5", "b6", "b7", "b8"];

//Split sample data for training and validation
var sample = newfc.randomColumn();
var split = 0.80;  // Roughly 80% training, 20% testing.
var training = sample.filter(ee.Filter.lt('random', split));
var validationdata = sample.filter(ee.Filter.gte('random', split));

// Define the bands to be used to train your data
var training = studyarea.sampleRegions({
  collection: newfc,
  properties: ['id'], 
});


// Make a Random Forest classifier and train it
var classifier = ee.Classifier.smileRandomForest(1000).train({
      features: training,
      classProperty: 'id',
      inputProperties: bands
    });

// Classify the input imagery.
//var classified = studyarea.select(bands).classify(classifier);
var classified = studyarea.classify(classifier);

// The following code will produce Variable Importance Metrics
var dict = classifier.explain();
print('Explain:',dict);

var variable_importance = ee.Feature(null, ee.Dictionary(dict).get('importance'));

var chart =
  ui.Chart.feature.byProperty(variable_importance)
    .setChartType('ColumnChart')
    .setOptions({
      title: 'Random Forest Variable Importance',
      legend: {position: 'none'},
      hAxis: {title: 'Bands'},
      vAxis: {title: 'Importance'}
    });

print(chart); 

//Display Classification
var rfviz = {min: 1, max: 5, palette: [
  'grey', //dredged- brown
  'lightgreen', // low marsh -light green
  'darkgreen', //high marsh
  'pink', //tree - dark  green
  'lightblue']}; //water -blue

Map.addLayer(classified, rfviz, 'RF classification');

//CONDUCT ACCUARACY ASSESSMENT IN TERRSET USING ERRMAT 

// Conduct the accuracy Accessment
var validation = classified.sampleRegions({
  collection: validationdata,
  properties: ['id'],
});
print(validation);
print('Validation', validationdata);
var testAccuracy = validation.errorMatrix('id', 'classification');
print(testAccuracy);
print('Error matrix: ', testAccuracy);
print('Validation overall accuracy: ', testAccuracy.accuracy());
print('Training kappa: ', testAccuracy.kappa());

/* Export the image, specifying scale and region.
 Export.image.toDrive({
   image: classified,
   description: 'RF',
   region: pop19, 
   scale: 10,
   crs: 'EPSG:4326',
   fileFormat: 'GeoTIFF'
   });
*/
