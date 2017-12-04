// CONFIG - BEGIN
var metaOntoNs = [
	"http://www.w3.org/1999/02/22-rdf-syntax-ns#",
	"http://www.w3.org/2000/01/rdf-schema#",
	"http://www.w3.org/2002/07/owl#"
];

var svgW = 5000;
var svgH = 5000;
var vw1 = 0.25;
var vw2 = 0.75;

var ignoredProps = [];
var labels = [];

var isToDisplayLabel = true;
var isToMerge = true;
var isToIgnoreWeb = true;
var isToIgnoreMetaOnto = true;
var isToIgnoreTransitive = true;
var isToIgnoreTypeHierarchy = true;
var isToIgnoreMetaProperty = true;

var METADATA =[];

var triples = [
	{
		subject: { type: "uri", value: "ex:ThaiLand" },
		predicate: { type: "uri", value: "ex:hasFood" },
		object: { type: "uri", value: "ex:TomYumKung" },
		vw: 0.1
	},
	{
		subject: { type: "uri", value: "ex:TomYumKung" },
		predicate: { type: "uri", value: "ex:isFoodOf" },
		object: { type: "uri", value: "ex:ThaiLand" },
		vw: 0.2
	},
	{
		subject: { type: "uri", value: "ex:TomYumKung" },
		predicate: { type: "uri", value: "rdf:type" },
		object: { type: "uri", value: "ex:SpicyFood" },
		vw: 0.2
	},
	{
		subject: { type: "uri", value: "ex:TomYumKung" },
		predicate: { type: "uri", value: "ex:includes" },
		object: { type: "uri", value: "ex:shrimp" },
		vw: 0.3
	},
	{
		subject: { type: "uri", value: "ex:TomYumKung" },
		predicate: { type: "uri", value: "ex:includes" },
		object: { type: "uri", value: "ex:chilly" },
		vw: 0.4
	},
	{
		subject: { type: "uri", value: "ex:TomYumKung" },
		predicate: { type: "uri", value: "ex:requires" },
		object: { type: "uri", value: "ex:chilly" },
		vw: 0.5
	},
	{
		subject: { type: "uri", value: "ex:TomYumKung" },
		predicate: { type: "uri", value: "ex:hasSpicy" },
		object: { type: "uri", value: "ex:chilly" },
		vw: 0.6
	},
	{
		subject: { type: "uri", value: "ex:TomYumKung" },
		predicate: { type: "uri", value: "ex:includes" },
		object: { type: "uri", value: "ex:lemon" },
		vw: 0.7
	},
	{
		subject: { type: "uri", value: "ex:lemon" },
		predicate: { type: "uri", value: "ex:hasTaste" },
		object: { type: "uri", value: "ex:sour" },
		vw: 0.8
	},
	{
		subject: { type: "uri", value: "ex:chilly" },
		predicate: { type: "uri", value: "ex:hasTaste" },
		object: { type: "uri", value: "ex:spicy" },
		vw: 0.9
	}
];

// Random Weights
triples.forEach(function(triple) {
	triple.vw = Math.round(Math.random() * 9 + 1) / 10;
});

// CONFIG - END

function L(id) {
	if (labels != undefined) {
		var l = labels[id];
		if (l == null) {
			l = id;
		}
	} else {
		l = id;
	}

	return l;
}

function checkIsMetaOnto(uri) {
	var isOnto = false;
	metaOntoNs.forEach(function(ns) {
		if (uri.indexOf(ns) == 0) {
			isOnto = true;
		}
	});

	return isOnto;
}

function checkIsTransitive(subj, pred, obj) {
	var res = false;
	var sMid = [];
	var oMid = [];

	triples.forEach(function(triple) {
		if (pred == triple.predicate.value) {
			if (subj == triple.subject.value) {
				sMid.push(triple.object.value);
			}
			if (obj == triple.object.value) {
				oMid.push(triple.subject.value);
			}
		}
	});

	if (sMid.length > 0 && oMid.length > 0) {
		oMid.filter(function(n) {
			if (sMid.indexOf(n) > -1) {
				res = true;
				return res;
			}
		});
	}
	
	return res;
}

function checkIsTypeHierarchy(subj, obj) {
	var res = false;
	var sMid = [];
	var oMid = [];

	triples.forEach(function(triple) {
		if (triple.subject.value != triple.object.value) {
			if (triple.predicate.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
				if (subj == triple.subject.value) {
					sMid.push(triple.object.value);
				}
			} else if (triple.predicate.value == "http://www.w3.org/2000/01/rdf-schema#subClassOf") {
				if (obj == triple.object.value) {
					oMid.push(triple.subject.value);
				}
			}
		}
	});

	if (sMid.length > 0 && oMid.length > 0){
		oMid.filter(function(n) {
			if (sMid.indexOf(n) > -1) {
				res = true;
				return res;
			}
		});
	}
	
	return res;
}

function filterNodesById(nodes, id) {
	if (isToMerge) {
		return nodes.filter(function(n) {
			return L(n.id) === L(id); 
		}); //Try to merge node
	} else {
		return nodes.filter(function(n) { 
			return n.id === id; 
		});
	}
}

function filterNodesByType(nodes, value) {
	return nodes.filter(function(n) { 
		return n.type === value; 
	});
}

function filterUpdate(vw1, vw2) {
	graph = triplesToGraph(triples, graph, vw1, vw2);
	update();
}

function showNodeLiteralData(subjectId) {
	var findedLiterals = [];

	triples.forEach(function(triple) {
		if (triple.subject.value == subjectId) {
			if (triple.object.type == 'literal') {
				findedLiterals.push({ 
					predicate: triple.predicate.value.split('/').pop(),
					object: triple.object.value
				});
			}
		}
	});

	updateNodeLiterals(findedLiterals);
}

function triplesToGraph(triples, xGraph, vw1, vw2) {
	vw1 = typeof vw1 !== 'undefined' ? vw1 : 0;
	vw2 = typeof vw2 !== 'undefined' ? vw2 : 1;

	svg.html("");
	
	// Graph
	var graph = { nodes:[], links:[], triples:[] };
	// Initial Graph from triples
	triples.forEach(function(triple) {
		// First checkbox say, if we want to see triples only between two objects
		// Second checkbox say, that we don't want to check triple vw (if checkbox is checked)
		if ((!$("#cbObjectsOnly").is(':checked') || triple.object.type != "literal") 
				&& ($("#cbSlider").is(':checked') || (triple.vw >= vw1 && triple.vw <= vw2))) {
			var subjId = triple.subject.value;
			var predId = triple.predicate.value;
			var objId = triple.object.value;

			// Ignore Web
			if (isToIgnoreWeb) {
				if (subjId.indexOf("?") > -1 || objId.indexOf("?") > -1) {
					return;
				}
			}

			// Ignore RDF/RDFS/OWL Resources
			if (isToIgnoreMetaOnto) {
				if (checkIsMetaOnto(subjId) || checkIsMetaOnto(objId)) {
					return;
				}
			}

			// Ignore RDF/RDFS/OWL Properties
			if (isToIgnoreMetaProperty) {
				if (checkIsMetaOnto(predId)) {
					return;
				}
			}

			// Remove transitive
			if (isToIgnoreTransitive) {
				if (checkIsTransitive(subjId, predId, objId)) {
					return;
				}
			}
			
			// Remove type + subclassof
			if (isToIgnoreTypeHierarchy && predId=="http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
				if (checkIsTypeHierarchy(subjId, objId)) {
					return;
				}
			}

			if ($.inArray(predId, ignoredProps) === -1 && subjId != objId) {
				// Subject side
				var toAddSubj = false;

				var xSubjNode = filterNodesById(xGraph.nodes, subjId)[0];
				var subjNode  = filterNodesById(graph.nodes, subjId)[0];
				
				if (subjNode == null) {
					subjNode = { id: subjId, label: subjId.split('/').pop(), weight: 1, type: "node" };
					
					if (xSubjNode != null) {
						subjNode.x = xSubjNode.x;
						subjNode.y = xSubjNode.y;
					}

					toAddSubj = true;
					//graph.nodes.push(subjNode);
				}

				// Object side
				var toAddObj = false;

				var xObjNode = filterNodesById(xGraph.nodes, objId)[0];
				var objNode = filterNodesById(graph.nodes.concat(subjNode), objId)[0];

				if (objNode == null) {
					objNode = { id: objId, label: objId.split('/').pop(), weight: 1, type: "node" };
					
					if (xObjNode != null) {
						objNode.x = xObjNode.x;
						objNode.y = xObjNode.y;
					}
					
					toAddObj=true;
					//graph.nodes.push(objNode);
				}

				// Property side
				subjId = subjNode.id;
				objId = objNode.id;
				
				var trId = subjId + predId + objId ; 
				if (isToMerge) {
					trId = L(subjId) + L(predId) + L(objId); //Try to merge nodes
				}
				var xPredNode = filterNodesById(xGraph.nodes, trId)[0];
				var predNode  = filterNodesById(graph.nodes, trId)[0];
				
				if(predNode == null && subjId !== objId) {
					predNode = { id: trId, pid: predId , label: predId.split('/').pop(), weight: 1, type: "pred" };
					
					if (xPredNode != null) {
						predNode.x = xPredNode.x;
						predNode.y = xPredNode.y;
					}
				
					if (toAddSubj) {
						graph.nodes.push(subjNode);
					}
					if (toAddObj) {
						graph.nodes.push(objNode);
					}
					graph.nodes.push(predNode);
					
					var blankLabel = "";
					
					graph.links.push({source:subjNode, target:predNode, predicate:blankLabel, weight:1});
					graph.links.push({source:predNode, target:objNode, predicate:blankLabel, weight:1});
					
					graph.triples.push({s:subjNode, p:predNode, o:objNode});
				}
			}
		}
	});
	
	return graph;
}


function update() {
	// Init Layout
	var containerDiv = $("#svg-body");
	var scrollTopTo = (svgH / 2) - ($("#svg-body").height() / 2);
	var scrollLeftTo = (svgW / 2) - ($("#svg-body").width() / 2);

	$("#viz").scrollTop(scrollTopTo);
	$("#viz").scrollLeft(scrollLeftTo);

	force = d3.layout.force().size([svgW, svgH]);

	// Add Marker
	svg.append("svg:defs").selectAll("marker")
		.data(["end"])
		.enter().append("svg:marker")
		.attr("id", String)
		.attr("viewBox", "0 -5 10 10")
		.attr("refX", 30)
		.attr("refY", -0.5)
		.attr("markerWidth", 6)
		.attr("markerHeight", 6)
		.attr("orient", "auto")
		.append("svg:polyline")
		.attr("points", "0,-5 10,0 0,5")
		;
		
	// Add Links
		var links = svg.selectAll(".link")
			.data(graph.triples)
			.enter()
			.append("path")
				.attr("marker-end", "url(#end)")
				.attr("class", "link");
							
	// Add Link Names
	var linkTexts = svg.selectAll(".link-text")
		.data(graph.triples)
		.enter()
		.append("text")
			.attr("class", "link-text")
			.text(function(d) { 
				if (isToDisplayLabel) {
					return L(d.p.label);
				} else {
					return d.p.pid; 
				}
			});

		linkTexts.append("title")
			.text(function(d) { 
				if (isToDisplayLabel) {
					return d.p.pid;
				} else {
					return L(d.p.label);
				} 
			});
				
	// Add Link Names
	var nodeTexts = svg.selectAll(".node-text")
		.data(filterNodesByType(graph.nodes, "node"))
		.enter()
		.append("text")
			.attr("class", "node-text")
			.text(function(d) { 
				if (isToDisplayLabel) {
					return L(d.label);
				} else {
					return d.id;
				} 
			});

		nodeTexts.append("title")
			.text(function(d) { 
				if (isToDisplayLabel) {
					return d.id;
				} else {
					return L(d.label);
				}
			});
	
	// Add Node
	var nodes = svg.selectAll(".node")
		.data(filterNodesByType(graph.nodes, "node"))
		.enter()
		.append("circle")
			.attr("class", "node")
			.attr("r",8)
			.on("dblclick", function(d) {
				showNodeLiteralData(d.id);
				// getMetadata(d.id);
				if($('#btnMetadata').attr("aria-expanded")=="false"){
					$('#btnMetadata').click();
				}
				
			})
			.call(force.drag)
	;//nodes

	// Force
	force.on("tick", function() {
		nodes
			.attr("cx", function(d) { 
				return d.x; 
			})
			.attr("cy", function(d) { 
				return d.y; 
			})
		;
		
		links
			.attr("d", function(d) {
				return "M" 	+ d.s.x + "," + d.s.y
							+ "S" + d.p.x + "," + d.p.y
							+ " " + d.o.x + "," + d.o.y;
			})
		;
							
		nodeTexts
			.attr("x", function(d) { 
				return d.x + 12; 
			})
			.attr("y", function(d) { 
				return d.y + 3; 
			})
		;
			

		linkTexts
			.attr("x", function(d) { 
				return 4 + (d.s.x + d.p.x + d.o.x)/3; 
			})
			.attr("y", function(d) {
				return 4 + (d.s.y + d.p.y + d.o.y)/3 ;
			})
		;
	});
	
	// Run
	force
		.nodes(graph.nodes)
		.links(graph.links)
		.charge(-250)
		.linkDistance(20)
		.start()
	;
}
