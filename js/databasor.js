var GOOGLE_ENDPOINT = "http://suggestqueries.google.com/complete/search";

var BACKOFF_DELAY = 100; // in ms.
var SEARCH_MAX_DEPTH = 5;

var check_end;
var send;
var sum = 0;
var total = 0;

var WEIGHTING = [
    0.9, 0.5, 0.3
];

//DEBUG
var counterLevel = [0,0,0,0,0];

var OFFLINE_DEBUG_MODE = false;
var search = true;

var __search_states;

var handleKeywordSearch = function(
    response, parent_ref, structure_ref, depth, res_no
) {
    __search_states.current_depth = depth;
    counterLevel[depth-1]++;
    sum = counterLevel.reduce(function(pv, cv) { return pv + cv; }, 0);

    $("#search-progress-bar").css("width",sum*100/total+"%");

    /*console.log("depth[" + depth + "]->response", response);
    console.log("depth[" + depth + "]->tree", parent_ref);*/

    structure_ref.word_result = (response[0] || "").trim();
    structure_ref.weight = (parent_ref)?WEIGHTING[res_no-1]:1;

    structure_ref.weight_result_calculate = (
        (parent_ref ? parent_ref.weight_result_calculate : 1)  *
        structure_ref.weight
    );

    structure_ref.child = [];

    // Go deeper?
    if (depth < SEARCH_MAX_DEPTH ) {
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

                word = (word  || "").trim();

                if (depth > 1 && word !== structure_ref.word_result) {
                    var parse_regx = new RegExp(
                        "^" + structure_ref.word_result +
                            "[\\s]+([\\S]+.*)$", "i"
                    );
                    if (word.match(parse_regx)) {
                        word_proper = (RegExp.$1 || "").trim();
                    } else {
                        // Fallback.
                        word_proper = word;
                    }
                } else {
                    word_proper = word;
                }

                if (word_proper !== null) {
                    console.info(
                        "Sanitized: " + structure_ref.word_result +
                        "->" + word_proper
                    );
                    // Push in structure
                    var child_struct_ref = {};

                    structure_ref.child.push(child_struct_ref);

                    // Lookup next (pass structure pointer)
                    lookForRootKeyword(
                        word_proper, structure_ref, child_struct_ref,
                        next_depth, index + 1
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
    __search_states.final_struct = myjson;
    result.text("Sorry Google banished you....");
    var _t = '<input type="button" value="Use JSON" class="btn btn-danger" id ="use-json"/>';
    $("#restart").find("div").append($(_t));
    $('#use-json').click(function (e) {
        e.preventDefault();
        counterLevel[SEARCH_MAX_DEPTH-1] = Math.pow(3, SEARCH_MAX_DEPTH-1);
        firstStep();
    })
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
                        response, parent_ref, structure_ref, (depth || 1), res_no
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

var firstStage = function () {
    firstLevel = __search_states.final_struct;
    return (counterLevel[1] == 3 )
};

var checkFinish = function () {
    return (counterLevel[SEARCH_MAX_DEPTH-1] == Math.pow(3, SEARCH_MAX_DEPTH-1) )
};

var startSearch = function (char) {
    resetState();
    var _t =
        '<div class="progress">' +
            '<div id="search-progress-bar" class="progress-bar progress-bar-info">'+
            '</div>'+
        '</div>';
    $("#progress").append($(_t));
    lookForRootKeyword(char, null, __search_states.final_struct);
};

var stopSearch = function () {
    search = false;
};

var resetState = function () {
    SEARCH_MAX_DEPTH = $("#depth").val();
    check_end = 0;
    send = false;
    counterLevel = [0,0,0,0,0];
    sum = 0;
    total = 0;
    __search_states = {
        current_depth : 0,
        current_spread_aggregate : 0,
        final_struct : {}
    };
    search = true;
    for (var o=0; o<SEARCH_MAX_DEPTH; o++){
        total += Math.pow(3,o);
        console.log(total);
    }
};
