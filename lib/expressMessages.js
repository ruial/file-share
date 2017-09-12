module.exports = function (req) {
  const flash = req.flash();
  let output = '';
  for (let [type, messages] of Object.entries(flash)) {
    if (type === 'info') type = 'primary';
    if (type === 'error') type = 'danger';
    for (let message of messages) {
      output += `
<div class="alert alert-${type} alert-dismissible fade show" role="alert">
  <button type="button" class="close" data-dismiss="alert" aria-label="Close">
    <span aria-hidden="true">&times;</span>
  </button>
  ${message}
</div>
`;
    }
  }
  return output;
};
