// Saves options to chrome.storage
function save_options() {
  var url = document.getElementById('mylar_url').value;
  var key = document.getElementById('mylar_apikey').value;
  chrome.storage.sync.set({
    mylar_url: url,
    mylar_apikey: key
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    mylar_url: 'http://localhost:8080',
    mylar_apikey: ''
  }, function(items) {
    document.getElementById('mylar_url').value = items.mylar_url;
    document.getElementById('mylar_apikey').value = items.mylar_apikey;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);