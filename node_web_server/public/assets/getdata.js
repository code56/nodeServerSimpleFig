$(document).ready(function() {
  $.ajax({
      url: 'localhost:8183/',
      method: "POST",
      success: function(data) {
          $("#test").append(data);
      },
      error: function(jqXHR, textStatus, errorThrown) {
          alert('error ' + textStatus + " " + errorThrown);
      }
  });
});