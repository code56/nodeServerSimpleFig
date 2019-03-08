/**
 * Graphing suite for Bio Tools such as Box Plot, Bar Graph and Scatter
 * Plot.
 *
 * Statistical tests can be changed to the input data and data
 * can be grouped using a range of methods.
 *
 * """graph""" is the object which stores all the information for the graph
 * i.e. various user options, the SVG element etc.
 *
 * Options contains all the optional variables that the developer can choose.
 * This allows them to set things such as headers for data or styling etc.
 */


/** --------------------------------------------------------------------------
 *
 *            Actions when the user clicks buttons
 *
 * --------------------------------------------------------------------------*/

/**
 * Updates the graph type to be a bar or a box plot.
 * 
 * The user selects a button and then the graph is updated.
 * Buttons are set in the options dictionary.
 * 
 */
var update_graph_type = function(graph_type) {
    box_bar_options.graph_type = graph_type;
    document.getElementById(box_bar_options.svg_info.div_id).innerHTML = '';
    draw_graph();

}

/**
 * Updates the statistical test performed on the data
 * and re renders the graph with the new data.
 * 
 * This just updates a variable in the options dictionary
 * which determines which statistical test is run. This
 * is performed in the:
 *      """perform_statistical_test = function (test_type, graph)""" function.
 * 
 * See that function for more info.
 * 
 */
var update_stat_tests = function (stat_test) {
    box_bar_options.data.statistical_test = stat_test;
    document.getElementById(box_bar_options.svg_info.div_id).innerHTML = '';
    draw_graph();
}


/** --------------------------------------------------------------------------
 *
 *                          Variable setup
 *
 * --------------------------------------------------------------------------*/
// Set up the graph as a global variable.
var graph = {};

var colours = ["DarkOrchid", "Orange", "DodgerBlue", "Blue", "BlueViolet", "Brown", "Deeppink", "BurlyWood", "CadetBlue",
    "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Crimson", "Cyan", "Red", "DarkBlue",
    "DarkGoldenRod", "DarkGray", "Tomato", "Violet", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen",
    "DarkOrange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSlateBlue", "DarkTurquoise",
    "DarkViolet", "DeepPink", "DeepSkyBlue", "DodgerBlue", "FireBrick", "ForestGreen", "Fuchsia",
    "Gold", "GoldenRod", "Green", "GreenYellow", "HotPink", "IndianRed", "Indigo"];

var box_bar_options = {
    // Things we want consistant accross everything 
    font_family: "'Varela Round', sans-serif",
    font_size: "12px",
    graph_type: "box",
    data: {
        statistical_test: 'log2',
        default_min_value: 0, // Means y_axis will be at most 0 (or less)
        default_max_value: 0, // Means y_axis will be at least 0 (or more)
        url: 'assets/data/stat1.tsv',
        //url: '/assets/data/ds_id_5003_scatter_gata3.tsv',

        /**
         * Value is the main value that is used for plotting the data.
         * In the case of Stemformatics, this corrosponds to the header
         * in the TSV file: """Expression_Value""".
         */  
        value: 'Expression_Value',
        standard_dev: 'Standard_Deviation',
        /**
         * Grouping the data allows us to make Box Plots on a range of data
         * groupings so users can see how the data changes when data 
         * is grouped in different ways.
         *
         * The values corrospond to headers in the TSV file, for example, 
         * data may be grouped first by probe, then for each probe there is
         * a sub group of Sample_Type etc.
         */ 
        groups: {'group_1': 'Probe', 'group_2': 'Sample_Type', 'group_3': 'Disease_State'},
        group_colour: 'group_2', // What collumn in the dataset the user wants the groups to be coloured by.
        // i.e. group_2 corrosponds to the Sample_Type
        id: 'Sample_ID', // Unique ID for each data point in the Dataset
    },
    svg_info: {
        //div_id: rootDiv.id, // The ID of the div you want to draw the graph in.
        div_id: "box-bar-plot",
        width: 2000,
        height: 450,
        margin: {top: 150, left: 15, bottom: 200, right: 50},
        stroke: "#AEB6BF",
        stroke_width: "1px",
        scale: 0.9, // Used to scale elements to fit in the elife page
        number_aixs_ticks: 10,
    },
    action_panel: {
        width: 1000,
        height: 80,
        margin: {top: 20, left: 50, bottom: 0, right: 0},
        btn_width: 150,
        btn_height: 40,
        btn_padding: 10,
        colour: "#8080ff",
        stroke_width: "3px",
        stroke: "#24232d",
        opacity: 0.6,
        border_radius: "10px",
        buttons: [
                {action:"update_stat_tests", value:"log2", text:"log2 Data"},
                {action:"update_stat_tests", value:"e2", text:"exp2 Data"},
                {action:"update_stat_tests", value:"raw", text:"Raw Data"},
                {action:"update_graph_type", value:"box", text:"Change to Box Plot"},
                {action:"update_graph_type", value:"bar", text:"Change to Bar Graph"},
            ]
    },
    box: {
        opacity: 0.5,
        stroke_width: "3px",      
        median_stroke: "#24232d",
        median_stroke_width: "4px",
    }
};

var get_options = function () {
    return box_bar_options;
}

/** --------------------------------------------------------------------------
 *
 *                          Main function
 *
 * Main function which directs the drawing of the graph
 *
 * 1. Read in the users' data from a URL or uploaded file.
 * 2. Perform statistical tests
 *
 * Add this data to the graph object as """raw_data""".
 * 
 * --------------------------------------------------------------------------*/
var setup_graph_data = function (data_url) {
    d3.tsv(data_url, function (error, data) {
        // Setup the main graph object
        graph.options = get_options();
        var options = graph.options;
	    graph.options.data.url = data_url;
        /** Ensure that the data is being read in as an 
          * integer rather than a string.
          * Add to a list as """raw_values""". */

        graph.parsed_data = [];
        graph.parsed_data_raw = [];
        // Keep track of the max and min values for the dataset
        var min_value = graph.options.data.default_min_value;
        var max_value = graph.options.data.default_max_value;

        data.forEach(function (d) {
            var tmp = {};
            tmp.id = d[options.data.id];
            tmp.value = +d[options.data.value];
            tmp.standard_dev = +d[options.data.standard_dev];

            var raw_tmp = {};
            raw_tmp.id = d[options.data.id];
            raw_tmp.value = +d[options.data.value];
            raw_tmp.standard_dev = +d[options.data.standard_dev];


            // Add each of the groups to the data
            for (var sub_group in options.data.groups) {
                tmp[sub_group] = d[options.data.groups[sub_group]];
                raw_tmp[sub_group] = d[options.data.groups[sub_group]];
            };
            
            // Add to our array of parsed_data
            graph.parsed_data.push(tmp);
            graph.parsed_data_raw.push(raw_tmp);

            // Check if this value is the new max or min
            if (tmp.value < min_value) {
                min_value = tmp.value;
            }
            if (tmp.value > max_value) {
                max_value = tmp.value;
            }

        });

        /**
         * Final step is to ensure the data is correctly sorted 
         * so that when we make the groups we are doing so correctly.
         * This means we need to sort the data on """ options.groups """
         * in a multi level function.
         */ 
        graph = sort_data(graph);     
        graph.max_value = max_value;
        graph.min_value = min_value;
        graph.raw_data = data;
        draw_graph();
    })

}

/**
 * new_graph == true means that it is a new graph 
 * so we need to parse the data again
 */
var draw_graph = function () {
        var options = graph.options;
        /** -------------------------------------------------
         * Data has been read in start drawing the graphs etc.
         * -------------------------------------------------*/

        // -------- Start Processing data ------------------//

        // Perform statistical tests
        graph = perform_statistical_test(options.data.statistical_test, graph);

        // Group the data
        graph = group_data(graph);
        
        // --------- End processing data ------------------//

        // --------- Start Setting up graph ---------------//
        
        // Setup the svg
        graph = setup_svg(graph);

        // Setup (and draw) the axis
        graph = setup_axis(graph);
    
        // Draw the graph
        if (options.graph_type == 'box') {
            graph = make_box_plot(graph);
        }
        if (options.graph_type == 'bar') {
            graph = make_bar_graph(graph);
        }
        
        // ----------- Non graph setup i.e. action panel ---------//
       
        // Add the buttons
        graph = create_buttons(graph);

};


/** --------------------------------------------------------------------------
 *
 *                          Data Processing
 *
 * This section processes the data. 
 *
 * 1.   Data is read in from a file, this is either uploaded by the user or
 *      a link/path to the data is input.
 * 
 * 2.   Statistical tests are performed on the data. This is at the moment
 *      limited to Log2 Expression (this is optional).
 *
 * 3.   Sort the data by grouping, i.e. first group_1, then within that 
 *      grouping by group_2 etc.
 *
 * 4.   Data is grouped, there can be three groupings, for example:
 *      Group by Probe, Sample Type and Disease State.
 *
 * --------------------------------------------------------------------------*/


/**
 * Sorts the data based on the groups specifed in the options.
 *
 * Multi dimensional sort, so if a[group_1] < b[group_1] or 
 * a[group_1] > b[group_1] then it will return, otherwise they 
 * are the same and must be sorted one level lower etc.
 *
 * https://stackoverflow.com/questions/2784230/javascript-how-do-you-sort-an-array-on-multiple-columns
 */
var sort_data = function (graph) {
    graph.parsed_data.sort(function (a, b) {
        for (var sub_group in graph.options.data.groups) {
            if (a[sub_group] < b[sub_group]) {
                return -1;
            }
            if (a[sub_group] > b[sub_group]) {
                return 1;
            }
        }
        return 0;
    })
    return graph;
};


/**
 * Assigns colours to a particular group element, 
 * This is set in options.data.colour_group
 * i.e group_1
 */
var setup_colours_for_group = function (group_list) {

    var count = 0;
    var assigned_colours = {};
    for (var i = 0; i < group_list.length; i++) {
        if (count == colours.length) {
            count = 0;
        }
        assigned_colours[group_list[i]] = colours[count];
        count++;
    }
    return assigned_colours;
}

/** --------------------------------------------------------------------------
 * 
 *                          Statistical tests
 * 
 * 
 * Perform any statistical tests the user may want before grouping the data.
 * Currently this only supports log_2 or e_2 (i.e. anti
 * log_2).
 *
 * Both the value and the standard deviation are re-calculated.
 * 
 * --------------------------------------------------------------------------*/
var perform_statistical_test = function (test_type, graph) {
    
    if (test_type == 'log2') {
        graph = perform_log2_test(graph);
        return graph;
    }    
    if (test_type == 'e2') {
        graph = perform_ex2_test(graph);
        return graph;
    }
    if (test_type == 'raw') {
        graph = return_raw_graph(graph);
        return graph;
    }
    // Otherwise leave unchanged.
    return graph;
};

var return_raw_graph = function (graph) {
    var min_value = graph.options.data.default_min_value;
    var max_value = graph.options.data.default_max_value;

    for (var d in graph.parsed_data_raw) {
        graph.parsed_data[d].value = (graph.parsed_data_raw[d].value);
        graph.parsed_data[d].standard_dev = (graph.parsed_data_raw[d].standard_dev);
        if (graph.parsed_data[d].value < min_value) {
            min_value = graph.parsed_data[d].value;
        }
        if (graph.parsed_data[d].value > max_value) {
            max_value = graph.parsed_data[d].value;
        }
    }
    graph.max_value = max_value;
    graph.min_value = min_value;
    return graph;

};

var perform_log2_test = function (graph) {
    // Log2 the data i.e. data = ln(data)
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log2
    var min_value = graph.options.data.default_min_value;
    var max_value = graph.options.data.default_max_value;

    for (var d in graph.parsed_data_raw) {
        graph.parsed_data[d].value = Math.log2(graph.parsed_data_raw[d].value);
        graph.parsed_data[d].standard_dev = Math.log2(graph.parsed_data_raw[d].standard_dev);
        if (graph.parsed_data[d].value < min_value) {
            min_value = graph.parsed_data[d].value;
        }
        if (graph.parsed_data[d].value > max_value) {
            max_value = graph.parsed_data[d].value;
        }
    }
    graph.max_value = max_value;
    graph.min_value = min_value;
    return graph;
}

var perform_ex2_test = function (graph) {
    // e the data i.e. data = e^(data)
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/exp
    var min_value = graph.options.data.default_min_value;
    var max_value = graph.options.data.default_max_value;

    for (var d in graph.parsed_data_raw) {
        graph.parsed_data[d].value = Math.exp(graph.parsed_data_raw[d].value);
        graph.parsed_data[d].standard_dev = Math.exp(graph.parsed_data_raw[d].standard_dev);
        if (graph.parsed_data[d].value < min_value) {
            min_value = graph.parsed_data[d].value;
        }
        if (graph.parsed_data[d].value > max_value) {
            max_value = graph.parsed_data[d].value;
        }
    }        
    graph.max_value = max_value;
    graph.min_value = min_value;
    return graph;
}

/**
 * Group the data. 
 *
 * Data is grouped depending on what type of graph we want to draw.
 * i.e. a scatter plot is grouped by probe (only one grouping)
 * while a box is grouped by probe and sample_type.
 *
 * This is set in the """options""" in """options.data.groups"""
 * which is a dictionary with the sub groups pre defined.
 *
 * For exammple: 
 *      {'group_1': 'Probe', 'group_2': 'Sample_Type', 'group_3': 'Disease_State'},
 *
 *  Where the values corrospond to headers in the TSV file
 */
var group_data = function (graph) {
    var parsed_data = graph.parsed_data;
    var options = graph.options;
    // Store a list of the group names so we can use
    // these later.
    var x_axis_group_labels = {};
    var group_id = 0; // ID each group based on the name
    // so we can do a linear scale rather than ordinal.
    var group_names = []; // Keep track of the group names so we don't get duplicates

    var grouped_data = {}; // Store the samples that belong to each group

    // Also want to keep a list of the names we are colouring on
    // so that we can assign each group a separate colour.
    var colour_group = [];
    // Which collumn we want to group the colours on
    var colour_tag = options.data.group_colour;

    for (var d in parsed_data) {
        var group_name = "";
        for (var sub_group in options.data.groups) {
            // Want to make a string as the group and 
            // add this to the data point. Will be used
            // to make a scale later on.
            if (sub_group == 'group_1') {
                group_name = parsed_data[d][sub_group];
            } else {
                group_name += "-" + parsed_data[d][sub_group];           
            }
            if (sub_group == colour_tag) {
                if (colour_group.includes(parsed_data[d][sub_group]) == false) {
                    colour_group.push(parsed_data[d][sub_group]);
                }
            }
        }
        parsed_data[d].group_name = group_name;
        parsed_data[d].group_id = group_id;

        if (group_names.includes(group_name)) {
            grouped_data[group_name].push(parsed_data[d]);

        } else {
            x_axis_group_labels[group_id] = group_name;
            // Need to make a new array for this group ID
            grouped_data[group_name] = [];
            // Add the data point to this array
            grouped_data[group_name].push(parsed_data[d]);
            group_id += 1;
            group_names.push(group_name);
        }
    }
    graph.assigned_colours = setup_colours_for_group(colour_group);
    graph.parsed_data = parsed_data;
    graph.x_axis_group_labels = x_axis_group_labels;
    graph.number_of_groups = group_id;
    graph.grouped_data = grouped_data;
    return graph;
}


/** --------------------------------------------------------------------------
 *
 *                          Graph Setup
 *
 * This section sets up the general graph elements. 
 *
 * 1.   Sets up the SVG element.
 * 
 * 2.   Creates the axis and adds to the graph. 
 *
 * 3.   Draws the groups lines (i.e. how we will be splitting the data) 
 *
 * --------------------------------------------------------------------------*/


/**
 * Sets up the SVG element.
 */
var setup_svg = function (graph) {
    var options =  graph.options.svg_info;

    /*var svg = d3.select("body").append("svg")
            .attr("width", options.width + options.margin.left + options.margin.right)
            .attr("height", options.height + options.margin.top + options.margin.bottom); */// Add the height of the action panel
    
    var svg = d3.select("#" + options.div_id).append("svg")
	   .attr("preserveAspectRatio", "xMinYMin meet")       
	   .attr("viewBox", "0 0 " + (options.width + options.margin.left + options.margin.right) + " " + (options.height + options.margin.top + options.margin.bottom))	
   	   .classed("svg-content-responsive", true);

    var group = svg.append("g")
            .attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")scale(" + options.scale + ")");
    var options =  graph.options.action_panel;

    var action_panel = svg.append("g")
            .attr("transform", "translate(" + graph.options.action_panel.margin.left + "," + graph.options.action_panel.margin.top + ")scale("+ options.scale + ")");

    graph.action_panel = action_panel;
    
    // Want to add everything to the inner group rather than the main svg 
    graph.svg = group;
    return graph;
}

/**
 * Sets up the x and y axis.
 */
var setup_axis = function (graph) {

    var svg = graph.svg;
    var options = graph.options;
    // Setup the x axis, the domain is the list of groups
    // created in the function group_data(). 
    var x_scale = d3.scale.linear()
            .domain([0, graph.number_of_groups])
            .range([0, options.svg_info.width])

    var x_axis = d3.svg.axis()
            .scale(x_scale)
            .orient("bottom")
            .ticks(graph.number_of_groups);


    // Setup y scale based on max and min values of the data
    var y_scale = d3.scale.linear()
            .domain([graph.min_value, graph.max_value]) 
            .range([options.svg_info.height, 0]);

    var y_axis = d3.svg.axis()
            .scale(y_scale)
            .orient("left")
            .ticks(options.svg_info.number_aixs_ticks); 

    // Add the scales to the svg element
    svg.append("g")
        .attr("class", "x_axis")
        .attr("stroke", options.svg_info.stroke)
        .attr("fill", options.svg_info.stroke)
        .attr("stroke-width", options.svg_info.stroke_width)
        .attr("font-family", options.font_family)
        .attr("font-size", options.font_size)
        .attr("transform","translate(" + options.svg_info.margin.left +"," + options.svg_info.height + ")")
        .call(x_axis)
        .selectAll("text")
            .attr("y", - x_scale(1)/4 )
            .attr("x", x_scale(1)/2 )
            .text(function(d) {return graph.x_axis_group_labels[d];})
            .attr("dy", ".35em")
            .attr("transform", "rotate(45)")
            .style("text-anchor", "start");

    svg.append("g")
        .attr("class", "y_axis")
        .attr("stroke", options.svg_info.stroke)
        .attr("fill", options.svg_info.stroke)
        .attr("stroke-width", options.svg_info.stroke_width)
        .attr("font-family", options.font_family)
        .attr("font-size", options.font_size)
        .attr("transform","translate(" + options.svg_info.margin.left  + ",0)")
        .call(y_axis);
 
    graph.size_of_group = x_scale(1)/2;
    graph.svg = svg;
    graph.x_scale = x_scale;
    graph.y_scale = y_scale;

    return graph;
}


/** --------------------------------------------------------------------------
 *
 *                          Box or Bar Graph
 *
 * --------------------------------------------------------------------------*/

/**
 * Makes the box plot, performs calcualtions and 
 * draws a box plot for each of the groups in the dataset.
 */
var make_bar_graph = function (graph) {
    // The box size is set to be half the size of the group
    // This is calculated in the setup_axis function.
    var box_size = graph.size_of_group/2;
    var grouped_data = graph.grouped_data;
    var options = graph.options;
    // For each of the groups we want to make a box plot
    for (var g in grouped_data) {
        // Need to calculate the box plot values based on the
        // samples in this group
            // return [min, min_quartile_median, median, max_quartile_median, max];
        var box_plot_vals = box_plot_calculations(grouped_data[g]);
        var x_value = graph.x_scale(grouped_data[g][0].group_id + 1.25);
        var colour = graph.assigned_colours[grouped_data[g][0][options.data.group_colour]];
        var horizontal_line_vals = {'lwr': box_plot_vals[1], 'median': box_plot_vals[2], 'upr': box_plot_vals[3]}

        make_box(graph, 0, box_plot_vals[2], x_value, box_size, colour);
        add_vertical_line_to_box(graph, box_plot_vals[1], box_plot_vals[3], x_value, box_size, colour);
        // Draw the box plot
        for (var type in horizontal_line_vals) {
            // Type indicates whether it is the lower bound, upper bound
            // or the median line.
            // Colour is assigned based on the users choice of which 
            // group they want to choose for colouring.
            add_horizontal_line_to_box(graph, type, horizontal_line_vals[type], x_value, box_size, colour);
        }

    };
    return graph;
};


/**
 * Makes the box plot, performs calcualtions and 
 * draws a box plot for each of the groups in the dataset.
 */
var make_box_plot = function (graph) {
    // The box size is set to be half the size of the group
    // This is calculated in the setup_axis function.
    var box_size = graph.size_of_group/2;
    var grouped_data = graph.grouped_data;

    var options = graph.options;
    // For each of the groups we want to make a box plot
    for (var g in grouped_data) {
        // Need to calculate the box plot values based on the
        // samples in this group
	    // return [min, min_quartile_median, median, max_quartile_median, max];
        var box_plot_vals = box_plot_calculations(grouped_data[g]);
        var x_value = graph.x_scale(grouped_data[g][0].group_id + 1.25);
        var colour = graph.assigned_colours[grouped_data[g][0][options.data.group_colour]];

        var horizontal_line_vals = {'lwr': box_plot_vals[0], 'median': box_plot_vals[2], 'upr': box_plot_vals[4]}

        add_vertical_line_to_box(graph, box_plot_vals[0], box_plot_vals[4], x_value, box_size, colour);

        make_box(graph, box_plot_vals[1], box_plot_vals[3], x_value, box_size, colour);
 
        // Draw the box plot
        for (var type in horizontal_line_vals) {
            // Type indicates whether it is the lower bound, upper bound
            // or the median line.
            // Colour is assigned based on the users choice of which 
            // group they want to choose for colouring.
            add_horizontal_line_to_box(graph, type, horizontal_line_vals[type], x_value, box_size, colour);
        }
        
    };
    return graph;
};


/** --------------------------------------------------------------------------
 *
 *               Box and Bar Graph Calculations
 *
 * 1.   Get the median value of all points 
 *      
 * 2.   Get the median of the lower group (not including the median) and the 
 *      upper group (not including the median)
 *
 * 3.   Get the min and max of all the points
 *
 * 4.   Return:
 *          a. min
 *          b. lower quartile median
 *          c. median
 *          d. upper quartile median
 *          e. max
 * --------------------------------------------------------------------------*/

var box_plot_calculations = function (group) {
  
    var values = [];
    
    for (var i in group) {
        values.push(group[i].value);
    }

    // Sort the samples based on expression values
    values.sort(function(a, b) { return a - b;});

    var min_max_vals = return_min_max_vals(values);
    var median = get_median_value(values, 0.50);
    var max_quartile = [];
    var min_quartile = [];
    var min_quartile = (values.length % 2 == 0) ? values.slice(0, (values.length / 2) + 1) : values.slice(0, Math.floor(values.length / 2) + 1);
    var max_quartile = (values.length % 2 == 0) ? values.slice((values.length / 2) - 1, values.length) : values.slice(Math.ceil(values.length / 2) - 1, values.length);
    var min_quartile_median = get_median_value(values, 0.25);
    var max_quartile_median = get_median_value(values, 0.75);
    var min = min_max_vals[0];
    var max = min_max_vals[1];
    return [min, min_quartile_median, median, max_quartile_median, max];
}   


//Returns the max and minimum values from the daa set
var return_min_max_vals = function (values) {
    // changes done by Isha for caculating box plot for negative values
    var max_val = -50;
    var min_val = 100;

    for (var sample_value in values) {
        if (values[sample_value] < min_val) {
            min_val = values[sample_value];
        }
        if (values[sample_value] > max_val) {
            max_val = values[sample_value];
        }
    }
    return [min_val, max_val];
}


/** --------------------------------------------------------------------------
 *
 *                  Draw the Box or Bar Graph to SVG
 *
 * --------------------------------------------------------------------------*/

//Returns the median value from a set of values
//https://gist.github.com/caseyjustus/1166258
get_median_value = function (values, percent) {
    // count = values.length;
    // median = (count % 2 == 0) ? (values[(values.length/2) - 1] + values[(values.length / 2)]) / 2:values[Math.floor(values.length / 2)];
    var k = (values.length - 1) * percent;
    var f = Math.floor(k);
    var c = Math.ceil(k);
    if (f == c) {
        return values[k]
    } else {
        var d0 = values[f] * (c - k);
        var d1 = values[c] * (k - f);
        return d0 + d1;
    }
}



/**
 * Makes the vertical line between the lowest point and the highest
 */
var add_vertical_line_to_box = function (graph, y1_value, y2_value, x_value, box_size, colour) {
    graph.svg.append("line")
        .attr("x1",  x_value)
        .attr("x2", x_value)
        .attr("y1", graph.y_scale(y1_value))
        .attr("y2", graph.y_scale(y2_value))
        .attr("shape-rendering", "crispEdges")
        .attr("stroke-width", graph.options.box.stroke_width)
        .attr("stroke", colour)

}

/**
 * Makes the box of the box plot or bar graph
 */
var make_box = function (graph, y1_value, y2_value, x_value, box_size, colour) {
    graph.svg.append("rect")
        .attr("x",  x_value - box_size)
        .attr("width", box_size * 2)
        .attr("y", graph.y_scale(y2_value))
        .attr("height", graph.y_scale(y1_value) - graph.y_scale(y2_value))
        .attr("shape-rendering", "crispEdges")
        .attr("stroke-width", graph.options.box.stroke_width)
        .attr("stroke", colour)
        .attr("fill", "white")

    graph.svg.append("rect")
        .attr("x",  x_value - box_size)
        .attr("width", box_size * 2)
        .attr("y", graph.y_scale(y2_value))
        .attr("height", graph.y_scale(y1_value) - graph.y_scale(y2_value))
        .attr("shape-rendering", "crispEdges")
        .attr("stroke-width", graph.options.box.stroke_width)
        .attr("stroke", colour)    
        .attr("fill", colour)
        .attr("opacity", graph.options.box.opacity);
}

/**
 * Adds the horizontal lines to the box plot.
 */
var add_horizontal_line_to_box = function (graph, type, y_value, x_value, box_size, colour) {
    var padding = box_size * 0.5; // Make the upper and lower "whiskers"
    var stroke_width = graph.options.box.stroke_width;
    // slightly smaller for appearence sake.
    if (type == 'median') {
        padding = box_size - 1.5;
        if (graph.options.graph_type == "box") {
            colour = graph.options.box.median_stroke;
        }
        stroke_width = graph.options.box.median_stroke_width;
    }
    graph.svg.append("line")
        .attr("x1",  x_value - padding)
        .attr("x2", x_value + padding)
        .attr("y1", graph.y_scale(y_value))
        .attr("y2", graph.y_scale(y_value))
        .attr("shape-rendering", "crispEdges")
        .attr("stroke-width", stroke_width)
        .attr("stroke", colour)
}


/** --------------------------------------------------------------------------
 *
 *                         Action Panel setup
 *
 * --------------------------------------------------------------------------*/

/**
 * Creates an action panel of buttons.
 *
 * These are specified in the options dictionary, with a key
 * as the button text and the action.
 *
 */
var create_buttons = function (graph) {
    var svg = graph.action_panel;
    var options = graph.options.action_panel;
    
        svg.selectAll('.btn')
            .data(options.buttons)
            .enter().append("rect")
                .attr("class", "btn")
                .attr("x", function (d, i) {
                        return i * (options.btn_width + options.btn_padding);
                    })
                .attr("width", options.btn_width)
                .attr("y", 0)
                .attr("height", options.btn_height)
                .attr("shape-rendering", "crispEdges")
                .attr("stroke-width", options.stroke_width)
                .attr("stroke", options.stroke)
                .attr("fill", options.colour)
                .attr("border-radius", options.border_radius)
                .attr("opacity", options.opacity)
                .on("click", function(d) {
                    if (d.action == "update_graph_type") {
                        return update_graph_type(d.value);
                    } else if (d.action == "update_stat_tests") {
                        return update_stat_tests(d.value);
                    } 
                });

        svg.selectAll('.btn-text')
            .data(options.buttons)
            .enter().append("text")
            .attr('class', "btn-text")
            .attr('x', function(d, i) {
                    return  i * (options.btn_width + options.btn_padding) + (options.btn_width/2);
                })
            .attr('y', options.btn_height * 0.6)
            .text(function (d) { return d.text; })
            .attr("stroke-width", options.stroke_width)
            .attr("font-family", graph.options.font_family)
            .attr("font-size", graph.options.font_size)
            .attr("text-anchor", "middle")
            .attr("fill", options.stroke)
            .on("click", function(d) {
                if (d.action == "update_graph_type") {
                    return update_graph_type(d.value);
                } else if (d.action == "update_stat_tests") {
                    return update_stat_tests(d.value);
                }
            }); 
   
    graph.action_panel = svg;
    return graph;
}
