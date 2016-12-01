var firstLevel = -1;
var tree = -1;
var choices;
var result;
var i;

$(document).ready(function () {
    choices = $("#choice");
    result = $("#result").find("p");
    $("#input").keyup(function () {
        var char = $(this).val().charAt(0);
        $(this).prop('disabled',true);
        startSearch(char);
        result.text("Wait please....");
    });

    $("#btn-restart").click(function (e) {
        e.preventDefault();
        stopSearch();
        choices.toggle();
        $("#input").val("").prop('disabled', false);
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

var firstStep = function (firstLevel) {
    firstLevel.child.forEach(function (e, index) {
        var _t =
            '<div class="form-group col-md-8 text-xs-center offset-md-2">'+
                '<input disabled type="button" value="'+ e.word_result +'" class="btn btn-danger" data-child="'+ index +'"/>'+
            '</div>';
        choices.append($(_t));
    });
    choices.toggle();
    result.text("Database creation...wait please");
    bindEvent();
    timeout();
};

var bindEvent = function () {
    choices.find("input:button").click(function (e) {
        var index = $(this).data("child");
        result.text($(this).val());
        i = 0;
        console.log(__search_states.final_struct.child[index]);
        var treeResult = processTree(__search_states.final_struct.child[index]);
        treeResult = createDict(treeResult).sort(function (a, b) {
            return a[1] - b[1]
        });
        for (var k in treeResult){
            console.log(treeResult[k].key);
        }
    });
};

function enableButtons() {
    choices.find("input:button").each(function (index, e) {
        $(e).removeClass("btn-danger").addClass("btn-success");
        $(e).prop('disabled',false);
    });
    result.text("Please choose one option");
}
var timeout = function() {
    setTimeout(function () {
        if (checkFinish())
            enableButtons();
        else
            timeout();
    }, 300);
};

function processTree(tree) {
    var dict = createDict(tree, dict);
    recalculateWeight(dict);
    placeResult(tree, dict, 0);
    return tree;
}

function createDict(tree){
    var dict = [];
    tree.child.forEach(function (ele, index) {
        dict.push({
            key: ele.word_result,
            value: ele.weight_result_calculate
        });
        if (ele.child && ele.child.length>0 && ele.child[0].child != undefined){
            createDict(ele, dict);
        }
    });
    return dict;
}

function recalculateWeight(dict) {
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

function placeResult(tree, dict){
    tree.child.forEach(function (ele, index) {
        ele.weight_result_calculate = dict[i].value;
        i++;
        if (ele.child && ele.child.length>0 && ele.child[0].child != undefined){
            placeResult(ele, dict, i);
        }
    });
}