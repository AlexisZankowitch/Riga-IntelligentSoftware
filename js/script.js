var firstLevel = -1;
var tree = -1;
var choices;
var result;
var iDict;
var dict = [];


$(document).ready(function () {
    choices = $("#choice");
    result = $("#result").find("p");
    $("#input").keyup(function () {
        var char = $(this).val().charAt(0);
        $(this).prop('disabled',true);
        $("#depth").prop('disabled', true);
        startSearch(char);
        result.text("Wait please....");
        timeout(firstStage, firstStep);
    });

    $("#btn-restart").click(function (e) {
        e.preventDefault();
        stopSearch();
        choices.toggle();
        $("#input").val("").prop('disabled', false);
        $("#depth").prop('disabled', false);
        $("#result").find("p").text("Go ahead, try again to write a letter!");
        choices.empty();
    });

    // ----------------------------
    // Alexis: up to you to bind to input events + values
    // Beware: ensure OFFLINE_DEBUG_MODE is 'true' to avoid flooding Google.
    // ----------------------------

    // Debug
    //lookForRootKeyword(char.charAt(0), null, __search_states.final_struct);
});

var firstStep = function () {
    firstLevel.child.forEach(function (e, index) {
        var _t =
            '<div class="form-group col-md-8 text-center col-md-offset-2">'+
                '<input disabled type="button" value="'+ e.word_result +'" class="btn btn-danger" data-child="'+ index +'"/>'+
            '</div>';
        choices.append($(_t));
    });
    choices.toggle();
    result.text("Database creation...Please wait");
    bindEvent();
    timeout(checkFinish, enableButtons);
};

var bindEvent = function () {
    choices.find("input:button").click(function (e) {
        result.text(" ");
        var index = $(this).data("child");
        result.text($(this).val());
        var treeResult = JSON.parse(JSON.stringify(__search_states.final_struct.child[index]));
        processTree(treeResult);
        var myDict = [];
        createDict(treeResult, myDict);
        myDict.sort(function (a, b) {
            return b.value - a.value
        });
        var previous = [];
        var counter = 1;
        for (var ind in myDict){
            if (counter < SEARCH_MAX_DEPTH && (previous.indexOf(myDict[ind].key)==-1)){
                previous = myDict[ind].key;
                result.text(result.text() + " " + myDict[ind].key);
                counter++;
            }
        }
    });
};

function enableButtons() {
    console.log(__search_states.final_struct);
    choices.find("input:button").each(function (index, e) {
        $(e).removeClass("btn-danger").addClass("btn-success");
        $(e).prop('disabled',false);
    });
    result.text("Please choose one option");
}
var timeout = function(check, callback) {
    setTimeout(function () {
        if (check())
            callback();
        else
            timeout(check, callback);
    }, 300);
};

function processTree(tree) {
    dict = [];
    createDict(tree, dict);
    recalculateWeight();
    iDict = 0;
    placeResult(tree);
}

function createDict(tree, dict){
    tree.child.forEach(function (ele, index) {
        dict.push({
            key: ele.word_result,
            value: ele.weight_result_calculate
        });
        if (ele.child && ele.child.length>0 && ele.child[0].child != undefined){
            createDict(ele, dict);
        }
    });
}

function recalculateWeight() {
    for (var i in dict) {
        var elem = dict[i];
        for (var j in dict){
            var search = dict[j];
            if (i!=j && elem.key === search.key){
                elem.value = elem.value +  (1-elem.value) * search.value
            }
        }
    }
}

function placeResult(tree){
    tree.child.forEach(function (ele, index) {
        ele.weight_result_calculate = dict[iDict].value;
        iDict++;
        if (ele.child && ele.child.length>0 && ele.child[0].child != undefined){
            placeResult(ele, dict);
        }
    });
}