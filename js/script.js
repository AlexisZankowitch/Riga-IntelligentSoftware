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
        $("#result").find("p").text("Write a letter");
    })
});

