function updateNodeLiterals(literals) {
    var tbody = $("#tblMetadataBody");
    tbody.empty();

    if (literals.length == 0) {
        tbody.append(
            "<tr>"
                + "<td>No literals for selected node.</td>"
                + "<td></td>"
            +"</td>"
        );
    }

    literals.forEach(function(literal) {
        tbody.append(
            "<tr>"
                + "<td>" + literal.predicate + "</td>"
                + "<td>" + literal.object + "</td>"
            +"</td>"
        );
    });
}
