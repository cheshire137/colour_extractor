document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.sendRequest(
      tab.id,
      {greeting: 'popup_opened', tab_id: tab.id},
      function() {
        // TODO: display colors extract from page in the popup
      }
    );
  }
});
