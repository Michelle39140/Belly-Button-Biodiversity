function buildMetadata(sample) {
  //function to build the metadata panel and the gauge chart

  // Use d3 to select the panel with id of `#sample-metadata`
  var metadata = d3.select("#sample-metadata")
  
  // Use `.html("") to clear any existing metadata
  metadata.html("")

  // Use `d3.json` to fetch the metadata for a sample
  d3.json("/metadata/"+sample).then( (mdata)=> { 
    // Use `Object.entries` to add each key and value pair to the panel

      // 1. populate metadata--------------------------------
      Object.entries(mdata).forEach( 
      (d) => { 
        if (d[0]==="Sample"){
          metadata.append("li").html(`Sample: <a href='/samples/${sample}'>${d[1]}</a>`)
        } // link to the sample data
        else{
        metadata.append("li").text(`${d[0]}  :  ${d[1]}`)
        }
      })
    }
  )
}

function buildGauge (sample) {
// function to make gauge chart---------------------------------

  d3.json("/metadata/"+sample).then( (mdata)=> { 
      if (mdata["Washing Frequency"]) {
        d3.select("#gauge").html("")
        // get the level data point
        var wfreq = parseInt(mdata["Washing Frequency"].split("/")[0])
        var level = 180 * wfreq / 9;
        console.log(level)
  
        // Trig to calc meter point
        var degrees = 180 - level,
            radius = .5;
        var radians = degrees * Math.PI / 180;
        var x = radius * Math.cos(radians);
        var y = radius * Math.sin(radians);
  
        // Path: may have to change to create a better triangle
        var mainPath = 'M -.0 -0.025 L .0 0.025 L ',
            pathX = String(x),
            space = ' ',
            pathY = String(y),
            pathEnd = ' Z';
        var path = mainPath.concat(pathX,space,pathY,pathEnd);
  
        var gData = [
          { 
            type: 'scatter',
            x: [0], y:[0],
            marker: {size: 28, color:'850000'},
            showlegend: false,
            text: mdata["Washing Frequency"],
            hoverinfo: 'text'},
          { 
            values: [20, 20, 20, 20, 20, 20,20, 20, 20,180],
            rotation: 90,
            text: ["8-9", "7-8", "6-7", "5-6", "4-5", "3-4", "2-3", "1-2", "0-1",''],
            textinfo: 'text',
            textposition:'inside',
            marker: {colors:['rgba(10, 50, 0, .5)', 'rgba(30, 70, 10, .5)','rgba(50, 90, 19, .5)','rgba(70, 127, 21, .5)', 'rgba(110, 154, 22, .5)','rgba(170, 202, 42, .5)', 'rgba(202, 209, 95, .5)','rgba(210, 206, 145, .5)', 'rgba(232, 226, 202, .5)','rgba(255, 255, 255, 0)']},
            hoverinfo: 'none',
            hole: .5,
            type: 'pie',
            showlegend: false
          }];
  
        var gLayout = {
          shapes:[{
              type: 'path',
              path: path,
              fillcolor: '850000',
              line: {
                color: '850000'
              }
            }],
          title: 'Washing Frequency<br>(Scrubs per Week)',
          xaxis: {zeroline:false, showticklabels:false,showgrid: false, range: [-1, 1]},
          yaxis: {zeroline:false, showticklabels:false,showgrid: false, range: [-1, 1]}
        };
  
        Plotly.newPlot('gauge', gData, gLayout);
      }
      else{
        d3.select("#gauge").html("<h4>Washing Frequency Data is Not Available for This Sample</h4>")
      }
    })
}

function buildCharts(sample) {
  //function to build pie chart and bubble chart

  d3.json("/samples/"+sample).then(
    (sdata) => {
      // 1. pie chart ------------------------------------------
      // combine three attributes together for sorted
      var sampleL = []
      for (var i=0;i<sdata.otu_ids.length;i++){
        sampleL.push({"id":sdata.otu_ids[i],"label":sdata.otu_labels[i],"value":sdata.sample_values[i]})
      }
      // sort the sample list
      sampleL.sort( (first,second)=>second.value - first.value)
      console.log(sampleL)
      // get the top 10 samples
      var selectedSamples = sampleL.slice(0,10)
      // add line breaker to labels - to be better displayed in the hovertext 
      for (var i in selectedSamples){
        selectedSamples[i].label = selectedSamples[i].label.split(";").join("<br>")
      } 
      console.log(selectedSamples)

      // create a pie chart with selected samples
      var pieData = [{
        values: selectedSamples.map( obj => obj.value),
        labels: selectedSamples.map( obj => obj.id),
        textinfo: "label", // set text to "label" instead of "text"
        text:selectedSamples.map( obj => obj.label),
        hoverinfo: 'label+percent+text+value',
        type: 'pie',
        marker:{
          colors:["#e6194B","#f58231","#ffe119","#bfef45","#3cd44b","#42d4f4","#4363d8","#911ed4","#f032e6","#a9a9a9"]},
        insidetextfont:{
          color:"white"
        },
      }];

      var pLayout = {
        title: "Microbial Species for Selected Sample <br>(operational taxonomic units, OTUs)"
      }
      
      Plotly.newPlot('pie', pieData,pLayout);

      // 2. bubble chart----------------------------------------
      var bData = [{
        x:sdata.otu_ids,
        y:sdata.sample_values,
        type:"scatter",
        text:sdata.otu_labels.map(s=>s.split(";").join("<br>")),
        mode: 'markers',
        marker:{
          size:sdata.sample_values.map(d=>d*0.6),
          color:sdata.otu_ids
        },
        hoverinfo:'x+y+text'
      }];

      var bLayout = {
        xaxis: {
          title: 'OTU ID',
        },
        yaxis: {
          title: 'Counts',
          }
      };

      Plotly.newPlot("bubble", bData, bLayout);

})
}

function init() {
  // Grab a reference to the dropdown select element
  var selector = d3.select("#selDataset");

  // Use the list of sample names to populate the select options
  d3.json("/names").then((sampleNames) => {
    sampleNames.forEach((sample) => {
      selector
        .append("option")
        .text(sample)
        .property("value", sample);
    });

    // Use the first sample from the list to build the initial plots
    const firstSample = sampleNames[0];
    buildCharts(firstSample);
    buildMetadata(firstSample);
    buildGauge(firstSample);
  });
}

function optionChanged(newSample) {
  // Fetch new data each time a new sample is selected
  buildCharts(newSample);
  buildMetadata(newSample);
  buildGauge(newSample);
}

// Initialize the dashboard
init();

// resize charts when window size changes
function resize(){
  var rSample = d3.select("#selDataset").property("value");
  console.log("sample",rSample);
  buildCharts(rSample);
  buildGauge(rSample);
}
d3.select(window).on('resize', resize);