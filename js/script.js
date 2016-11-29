var GOOGLE_ENDPOINT = "http://suggestqueries.google.com/complete/search";

var BACKOFF_DELAY = 500; // in ms.
var SEARCH_MAX_DEPTH = 3;

var WEIGHTING = [
    0.9, 0.5, 0.3
];

var OFFLINE_DEBUG_MODE = true;

var __search_states = {
    current_depth : 0,
    current_spread_aggregate : 0,
    final_struct : {}
};

var handleKeywordSearch = function(
    response, parent_ref, structure_ref, depth, res_no
) {
    __search_states.current_depth = depth;

    console.log("depth[" + depth + "]->response", response);
    console.log("depth[" + depth + "]->tree", JSON.stringify(parent_ref));

    structure_ref.word_result = response[0];
    structure_ref.weight = WEIGHTING[res_no - 1];

    structure_ref.weight_result_calculate = (
        (parent_ref ? parent_ref.weight_result_calculate : 1)  *
            structure_ref.weight
    );

    structure_ref.child = [];

    // Go deeper?
    if (depth < SEARCH_MAX_DEPTH) {
        var next_depth = __search_states.current_depth + 1;

        if (response[1] && response[1].length > 0  &&
                response[1][0] === response[0]) {
            // Pop first result if it contains the same value than query.
            response[1].shift();
        }

        (response[1] || []).forEach(function(word, index) {
            if (index < WEIGHTING.length) {
                // Trim down previous value from this word
                var word_proper = null;

                if (depth > 1) {
                    var parse_regx = new RegExp(
                        "^" + structure_ref.word_result + "(.+)$", "i"
                    );

                    if (word.match(parse_regx)) {
                        word_proper = (RegExp.$1 || "").trim();
                    }
                } else {
                    word_proper = word;
                }

                if (word_proper !== null) {
                    // Push in structure
                    var child_struct_ref = {};

                    structure_ref.child.push(child_struct_ref);

                    // Lookup next (pass structure pointer)
                    lookForRootKeyword(
                        word_proper, structure_ref, child_struct_ref,
                            next_depth, (index + 1)
                    );
                } else {
                    console.warn(
                        ["Previous value (" + structure_ref.word_result + ") ",
                            "not found in word: " + word].join("")
                    );
                }
            }
        });
    }
};

var handleKeywordSearchError = function(error) {
    console.error("error", error);
};

var lookForRootKeyword = function(
    query, parent_ref, structure_ref, depth, res_no
) {
    var backoff = (
        BACKOFF_DELAY * (++__search_states.current_spread_aggregate)
    );

    setTimeout(function() {
        var suggestEndpointURL = (
            GOOGLE_ENDPOINT +
                "?output=firefox&hl=en&q=" + encodeURIComponent(query) +
                "&jsonp=?"
        );

        // Offline test mode
        if (OFFLINE_DEBUG_MODE === true) {
            handleKeywordSearch(
                ["word",
                    ["rep1", "rep2", "rep3", "rep4", "rep5", "rep6", "rep7"]
                ],

                parent_ref, structure_ref, (depth || 1), (res_no || 1)
            );
        } else {
            $.getJSON(suggestEndpointURL)
                .done(function(response) {
                    handleKeywordSearch(
                        response, parent_ref, structure_ref, (depth || 1)
                    );
                })
                .fail(function(error) {
                    handleKeywordSearchError(error);
                });
        }
    }, backoff);
};

var lookupFinishedHandler = function(lookup_struct) {
    console.info("Lookup finished:", lookup_struct);
};

$(document).ready(function () {
    $("#input").keyup(function () {
        var char = $(this).val();
        $(this).prop('disabled',true);
        //write the sentence
        $("#result").find("p").text(char);
    });

    $("#btn-restart").click(function (e) {
        e.preventDefault();
        $("#input").val("").prop('disabled', false);
        $("#result").find("p").text("Go ahead, try again to write a letter!");
    });

    // ----------------------------
    // Alexis: up to you to bind to input events + values
    // Beware: ensure OFFLINE_DEBUG_MODE is 'true' to avoid flooding Google.
    // ----------------------------

    // Debug
    lookForRootKeyword("a", null, __search_states.final_struct);
});

