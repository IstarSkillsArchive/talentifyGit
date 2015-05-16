var d3_display = function(data, i, txt) {
	/*var data =[
				{name:'skill1', rating:300},
				{name:'skill2', rating:200},
				{name:'skill3', rating:150},
				{name:'skill4', rating:300},
				{name:'skill5', rating:400},
				{name:'skill6', rating:250}
			];*/
	/*var data =[
				{name:'skill1', rating:{manager:10, coach: 8}},
				{name:'skill2', rating:{manager:8, coach: 7}},
				{name:'skill3', rating:{manager:7, coach: 6}},
				{name:'skill4', rating:{manager:6, coach: 5}},
				{name:'skill5', rating:{manager:5, coach: 4}},
				{name:'skill6', rating:{manager:4, coach: 3}}
			];*/
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = ($('#chart'+i).width()) - margin.left - margin.right,
    height = 182 - margin.top - margin.bottom;
    
    function make_x_axis() {        
    return d3.svg.axis()
        .scale(x)
         .orient("bottom")
         .ticks(5);
}

function make_y_axis() {        
    return d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5);
}

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1);

var x1 = d3.scale.ordinal();

var y = d3.scale.linear()
    .range([height, 0]);

var color = d3.scale.ordinal()
.range(["#1f86c7", "#fbb23e", "#16b6b8", "#e33244"]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    ;

var svg = d3.select("div#chart"+i).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var labels = d3.keys(data[0].rating).filter(function(key) { return key; });

  data.forEach(function(d) {
    d.scores = labels.map(function(name) { return {name: name, value: +d.rating[name]}; });
  });
  
  /*data.forEach(function(d) {
    for (var key in d.scores) {
    	var x2 = d.scores[key];
    	for (var k in x2) {
    		alert(k + " : " + x2[k]);
    	}
    }
  });*/


//d3.tsv("/javascripts/data.tsv", type, function(error, data) {
  x.domain(data.map(function(d) { return d.name; }));
  x1.domain(labels).rangeRoundBands([0, x.rangeBand()]);
  y.domain([0, d3.max(data, function(d) { return d3.max(d.scores, function(d) { return d.value; }); })]);
  //y.domain([0, d3.max(data, function(d) { return d.rating; })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text(txt != null ? txt : 'Rating');
  
  svg.selectAll(".tick").style("stroke-width",0);
  svg.selectAll("text").style("fill","#43494d").style("stroke-width",0).style("font-family",'"Open Sans"');
  
//draw x grid lines
	svg.append("g")         
  .attr("class", "grid y")
  .call(make_y_axis()
      .tickSize(-width, 0, 0)
      .tickFormat("")
  );
	//end draw x grid lines
  
  var skill = svg.selectAll(".bar")
  .data(data)
.enter().append("g")
  .attr("class", "g")
  .attr("transform", function(d) { return "translate(" + x(d.name) + ",0)"; });

skill.selectAll("rect")
  .data(function(d) { return d.scores; })
.enter().append("rect")
  .attr("width", x1.rangeBand())
  .attr("x", function(d) { return x1(d.name); })
  .attr("y", function(d) { return y(d.value); })
  .attr("height", function(d) { return height - y(d.value); })
  .style("fill", function(d) { return color(d.name); })
  .style("stroke", function(d) { return color(d.name); })
  .style("opacity", 0.7);

  
  
  /*svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
    //.attr("class", "bar")
     .attr("width", x1.rangeBand())
      .attr("x", function(d) { return x1(d.name); })
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .style("fill", function(d) { return color(d.name); });
  */
  
      //.attr("x", function(d) { return x(d.name); }/*function(d, i) { i * (width / data.length); }*/)
      /*.attr("width", x.rangeBand())
      //.attr("y", 0)
      .attr("y", function(d) { return y(d.rating); })
      //.attr("height", height);
      .attr("height", function(d) { return height - y(d.rating); });
	*/
//});

	var legend = svg.selectAll(".legend")
	.data(labels.slice().reverse())
	.enter().append("g")
	.attr("class", "legend")
	.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
	
	legend.append("rect")
	.attr("x", width - 18)
	.attr("width", 18)
	.attr("height", 18)
	.style("fill", color)
	.style("opacity", 0.7);
	
	legend.append("text")
	.attr("x", width - 24)
	.attr("y", 9)
	.attr("dy", ".35em")
	.style("text-anchor", "end")
	.text(function(d) { return d; })
	.style("fill","#43494d").style("stroke-width",0).style("font-family",'"Open Sans"');
	   
	function type(d) {
	  d.value = +d.value;
	  return d;
	}

};

