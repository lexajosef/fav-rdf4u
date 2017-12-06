// QUERY
function afterQuery() {
    var preds = [];
    var counts = [];

    var chks = "";

    var tblProps = $("#tblProperties");
    tblProps.empty();

    triples.forEach(function(triple) {
        var pred = triple.predicate.value;
        if ($.inArray(pred, preds) === -1) { 
            preds.push(pred);
            counts[pred]=1;
        } else {
            counts[pred]++;
        }
    });
    
    preds.sort();
    
    preds.forEach(function(pred) {
        tblProps.append(
            "<div class='checkbox'>"
                + "<label title='"+ pred +"'>"
                    + "<input id='chkProp' onchange='filterProperties();' type='checkbox' checked/>" 
                    + L(pred) 
                + "</label>"
                + "<span class='badge'>" + counts[pred] + "</span> "
            + "</div>"
        );
    });

}

function filterProperties() {
    ignoredProps = [];
    var chkProps = $("#chkProp:not(:checked)").parent();
    chkProps.each(function(i) {
        ignoredProps.push($(chkProps[i]).attr("title"));
    });

    filterUpdate(vw1,vw2);
}

function toDisplayLabel(elem) {
    isToDisplayLabel = $(elem).is(":checked");
    filterUpdate(vw1, vw2);
}

function toMergeNodes(elem) {
    isToMerge = $(elem).is(":checked");
    filterUpdate(vw1, vw2);
}

function toIgnoreMetaOnto(elem) {
    isToIgnoreMetaOnto = $(elem).is(":checked");
    filterUpdate(vw1, vw2);
}

function toIgnoreMetaProperty(elem) {
    isToIgnoreMetaProperty = $(elem).is(":checked");
    filterUpdate(vw1, vw2);
}

function toIgnoreTransitive(elem) {
    isToIgnoreTransitive = $(elem).is(":checked");
    filterUpdate(vw1, vw2);
}

function toIgnoreTypeHierarchy(elem) {
    isToIgnoreTypeHierarchy = $(elem).is(":checked");
    filterUpdate(vw1, vw2);
}

function toIgnoreWeb(elem) {
    isToIgnoreWeb = $(elem).is(":checked");
    filterUpdate(vw1, vw2);
}

function generateRdfTable(triples) {
    if (!$("#cbSlider").is(':checked')) {
        triples.sort(function(a, b) {
            return a.vw - b.vw;
        });
    }
    
    var rdfTBody = $("#tblBodyRDF");
    rdfTBody.empty();
    
    triples.forEach(function(triple) {
        rdfTBody.append(
            "<tr>"
                +"<td>" + L(triple.subject.value) + "<br/><small>( <a href='" + triple.subject.value + "' target='_blank' >" + triple.subject.value + "</a> )</small></td>"
                +"<td>" + L(triple.predicate.value) + "<br/><small>( <a href='" + triple.predicate.value + "' target='_blank' >" + triple.predicate.value + "</a> )</small></td>"
                +"<td>" + L(triple.object.value) + "<br/><small>( <a href='" + triple.object.value + "' target='_blank' >" + triple.object.value + "</a> )</small></td>"
                +"<td>" + Math.round(triple.vw*100) + "</td>"
            +"</tr>");
    });
}

// call methods for create a graph from json data
function createGraph(data) {
    if (data == undefined) {
        // show error
        $(".queryResult").html("<div class='alert alert-warning' role='alert'>Fail to create a graph from the given URL.</div>");
        setTimeout(function(){ 
            $(".queryResult").hide();
        }, 10000 );

        return;
    }

    // stuff for create the graph 
    labels = data.Labels;
    triples = data.Triples;
    
    graph = triplesToGraph(triples, graph, vw1, vw2);
    afterQuery();
    generateRdfTable(triples);
    update();
}

function parseResult(response) {
    $(".queryLoader").hide();
    triples = response.results.bindings;

    // parse JSON from sparql to final JSON for graph
    var finalData = { Triples: [], Labels: []};
    var actualTripple = [];
    var uriTriplesOnly = $("#cbObjectsOnly").is(':checked');
    var checkVw = !$("#cbSlider").is(":checked");
    var minVw = 0;
    var maxVw = 0;

    jQuery.each(triples, function(i, triple) {
        // get subject, predicate and object values
        actualTripple = [];
        
        jQuery.each(triple, function(j, resource) {
            actualTripple.push({ "type": resource.type, "value": resource.value });
        });

        // create and push triple to 
        finalData.Triples.push({
            "subject": actualTripple[0],
            "predicate": actualTripple[1],
            "object" : actualTripple[2],
            "vw": checkVw ? actualTripple[3].value : ""
        });

        if (checkVw) {
            if (actualTripple[3].value > maxVw) {
                maxVw = actualTripple[3].value;
            }
            if (actualTripple[3].value < minVw) {
                minVw = actualTripple[3].value;
            }
        }
    });

    vw1 = minVw;
    vw2 = maxVw;
    $("#slider-range").slider({
        min: minVw,
        max: maxVw,
        values: [minVw, maxVw]
    });
    createGraph(finalData);
}

function findSliderValues(respBody) {
    var min = 0;
    var max = 2;

    if (!$("#cbSlider").is(":checked")) {
        jQuery.each(respBody.Triples, function(i, triple) {
            if (triple.vw > max) {
                max = triple.vw;
            }
            if (triple.vw < min) {
                min = triple.vw;
            }
        });

        vw1 = min;
        vw2 = max;
        $("#slider-range").slider({
            min: min,
            max: max,
            values: [min, max]
        });
    }
}

function queryGraph(isConstruct) {
    $(".queryLoader").show();
    $(".queryResult").hide();
    
    if (isConstruct) {
        // FROM SPARQL QUERY
        var endpoint = $("#txtEndPoint").val();    
        var query = $("#txtAreaSparql").val();
        
        $.ajax({
            type: "POST",
            url: endpoint,
            data: { query: query },
            success: parseResult,
            error: function (request, err, ex) {
                $(".queryLoader").hide();
                $(".queryResult").show();
                $(".queryResult").html("<div class='alert alert-warning' role='alert'>Fail to query the sparql.</div>");
                setTimeout(function(){ 
                    $(".queryResult").hide();
                }, 10000 ); 
            }
        });
    } else {
        // FROM JSON
        var url = $("#txtQuri").val();

        $.ajax({
            type: "GET",
            url: url,
            success: function(response) {
                $(".queryLoader").hide();
                respBody = JSON.parse(response);
                findSliderValues(respBody);
                createGraph(respBody);
            },
            error: function() {
                $(".queryLoader").hide();
                $(".queryResult").show();
                $(".queryResult").html("<div class='alert alert-warning' role='alert'>Fail to create a graph from the given URL.</div>");
                setTimeout(function(){ 
                    $(".queryResult").hide();
                }, 10000 ); 
            }
        });
    }
}
