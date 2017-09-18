/* eslint-env jquery */
/* eslint-disable no-var */

$(function () {
  $('form').submit(function (e) {
    e.preventDefault();
    var password = $('#password').val();
    var password2 = $('#password2').val();
    if (password === password2) {
      this.submit();
    }
    else {
      $('.alert').alert('close');
      $(this).prepend('<div class="alert alert-warning alert-dismissible" role="alert">' +
        '  <button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '    <span aria-hidden="true">&times;</span>' +
        '  </button>Passwords do not match</div>');
    }
  });
});
