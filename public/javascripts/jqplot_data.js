var data = [
['Language', 12],['Negotiation', 9], ['Demonstration', 14], 
['Convincing', 16],['Proposal', 7]];

var plot1 = $.jqplot ('chart1', [data], { 
  seriesDefaults: {
    renderer: $.jqplot.PieRenderer, 
    rendererOptions: {
      showDataLabels: true
    }
  }, 
  legend: { show:true, location: 'e' }
});

var arr = [[11, 123, 1236, "English"], [45, 92, 1067, "Written"], 
   [24, 104, 1176, "Presentation"], [2, 13, 1026, "Body Language"]];
    
   var plot2 = $.jqplot('chart2',[arr],{
       seriesDefaults:{
           renderer: $.jqplot.BubbleRenderer,
           rendererOptions: {
               bubbleGradients: true
           },
           shadow: true
       }
   });	
   
   var s1 = [2, 6, 7, 10];
   var s2 = [7, 5, 3, 4];
   var s3 = [14, 9, 3, 8];
   var plot3 = $.jqplot('chart3', [s1, s2, s3], {
     // Tell the plot to stack the bars.
     stackSeries: true,
     captureRightClick: true,
     seriesDefaults:{
       renderer:$.jqplot.BarRenderer,
       rendererOptions: {
           // Put a 30 pixel margin between bars.
           barMargin: 30,
           // Highlight bars when mouse button pressed.
           // Disables default highlighting on mouse over.
           highlightMouseDown: true   
       },
       pointLabels: {show: true}
     },
     axes: {
       xaxis: {
           renderer: $.jqplot.CategoryAxisRenderer
       },
       yaxis: {
         padMin: 0
       }
     },
     legend: {
       show: true,
       location: 'e'
       //placement: 'outside'
     }      
   });
   
   var plot4 = $.jqplot ('chart4', [[3,7,9,1,4,6,8,2,5], [7,3,1,9,2,8,6,5,4]]);
   
   var plot5 = $.jqplot ('chart5', [[3,7,9,1,4,6,8,2,5], [[2, 1],[5,3.12],[13,5.1],[33,7.6],[9,8.9],[11,21.9]], [[1, 2],[3,5.12],[5,13.1],[7,33.6],[9,85.9],[11,219.9]]]);
