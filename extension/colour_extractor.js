chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.greeting == 'popup_opened') {
    // TODO: extract colors from page, send them in response to popup
  }
});
