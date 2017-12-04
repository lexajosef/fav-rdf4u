// Slider
$(function() {
    // Loader
    $(".queryLoader").hide();
    $(".queryResult").hide();

    // Slider
    $("#slider-range").slider({
        disabled: true,
        range: true,
        min: 0,
        max: 100,
        values: [vw1*100, vw2*100],
        slide: function(event, ui) {
            $("#amount").text(ui.values[0] + " - " + ui.values[1]);
        },
        stop: function(event, ui) {
            vw1 = ui.values[0] / 100.0;
            vw2 = ui.values[1] / 100.0;
            filterUpdate(vw1, vw2);filterUpdate(vw1, vw2);
        }
    });

    $("#amount").text($("#slider-range").slider("values", 0) +
        " - " + $("#slider-range").slider("values", 1));

    // Tab Graph / RDF
    $('#rdfpanel a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });
});

function changeSlider(vw1, vw2) {
    $("#slider-range").slider('values', [vw1*100, vw2*100]);
    $('#slider-range').trigger('refresh');
    this.vw1 = vw1;
    this.vw2 = vw2;
    filterUpdate(vw1, vw2);	
    $("#amount").text(Math.round(vw1*100) + " - " + Math.round(vw2 * 100));
}

// Listen to slider checkbox change and do stuff
$("#cbSlider").change(function() {
    if (this.checked) {
        $("#slider-range").slider({ disabled: true });
        $("#sliderButtons button").each(function() {
            this.disabled = true;
        });
    } else {
        $("#slider-range").slider({ disabled: false });
        $("#sliderButtons button").each(function() {
            this.disabled = false;
        });
    }

    filterUpdate(vw1, vw2);
});

$("#cbObjectsOnly").change(function() {
    filterUpdate(vw1, vw2);
});
