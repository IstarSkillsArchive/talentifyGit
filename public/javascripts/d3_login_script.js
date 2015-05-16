var d3_login_display = function(data, text, div, flag_x_axis_label, x_axis_label) { 
	var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = ($('#'+div).width()) - margin.left - margin.right,
    height = 182 - margin.top - margin.bottom;
	
	function make_x_axis() {        
	    return d3.svg.axis()
	        .scale(x)
	         .orient("bottom")
	         .ticks(5)
	}
	
	function make_y_axis() {        
	    return d3.svg.axis()
	        .scale(y)
	        .orient("left")
	        .ticks(5)
	}
    
	var x = d3.scale.ordinal()
	.rangeRoundBands([0, width], .1);
	
	var y = d3.scale.linear()
	.range([height, 0]);
	
	var xAxis = d3.svg.axis()
	.scale(x)
	.orient("bottom");
	
	var yAxis = d3.svg.axis()
	.scale(y)
	.orient("left")
	.ticks(5);
	
	var tooltip = d3.select("body").append("div")   
    .attr("class", "d3-tip")               
    .style("display", "none");
	
	var svg = d3.select("div#"+div).append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	;
	
	//d3.tsv("data.tsv", type, function(error, data) {
	x.domain(data.map(function(d) { return d.day; }));
	y.domain([0, d3.max(data, function(d) { return d.count; })]);
	
	if(flag_x_axis_label == 'false') { //hide x axis label
		svg.append("g")
		  .attr("class", "x axis")
		  .attr("transform", "translate(0," + height + ")")
		  .call(xAxis)
		  .selectAll(".tick").style("display","none");
		  /*.selectAll("text")  
	            .style("text-anchor", "end")
	            .attr("dx", "-.8em")
	            .attr("dy", ".15em")
	            .attr("transform", function(d) {
	                return "rotate(-65)" 
	                })
	             .style("stroke","white")
	             .style("opacity",0);*/
	} else { //show x axis label
		svg.append("g")
		  .attr("class", "x axis")
		  .attr("transform", "translate(0," + height + ")")
		  .call(xAxis)
		  /*.selectAll("text")  
	            .style("text-anchor", "end")
	            .attr("dx", "-.8em")
	            .attr("dy", ".15em")
	            .attr("transform", function(d) {
	                return "rotate(-65)" 
	                })*/;
	}
	
	svg.append("g")
	  .attr("class", "y axis")
	  .call(yAxis)
	  .append("text")
	  .attr("transform", "rotate(-90)")
	  .attr("y", 6)
	  .attr("dy", ".71em")
	  .style("text-anchor", "end")
	  .style("fill","#43494d").style("stroke-width",0)
	  .text(text);
	
	svg.selectAll(".tick").style("stroke-width",0);
	svg.selectAll("text").style("fill","#43494d").style("stroke-width",0).style("font-family",'"Open Sans"');
	
	// draw y grid lines
	/*svg.append("g")         
    .attr("class", "grid x")
    .attr("transform", "translate(0," + height + ")")
    .call(make_x_axis()
        .tickSize(-height, 0, 0)
        .tickFormat("")
    );*/
	//end draw y grid lines
	
	//draw x grid lines
	svg.append("g")         
    .attr("class", "grid y")
    .call(make_y_axis()
        .tickSize(-width, 0, 0)
        .tickFormat("")
    );
	//end draw x grid lines
	
	svg.selectAll(".bar")
	  .data(data)
	.enter().append("rect")
	  .attr("class", function(d) { 
		  return d.color != null ? d.color+"-login-bar" : "login-bar"; 
	  }).attr("x", function(d) { return x(d.day); })
	  .attr("width", x.rangeBand())
	  .attr("y", function(d) { return y(d.count); })
	  .attr("height", function(d) { return height - y(d.count); })
	  .on("mouseover", function(d) {      
	    tooltip.transition().duration(200).style("display", "inline-block");      
	    tooltip.html(x_axis_label+":"+d.day+"<br/>"+d.count)  
	      .style("left", (d3.event.pageX) + "px")     
	      .style("top", (d3.event.pageY - 28) + "px");    
	  })                  
	  .on("mouseout", function(d) {       
	    tooltip.transition().duration(500).style("display", "none"); 
	   });
	
	//});

	function type(d) {
		d.count = +d.count;
		return d;
	}
};

