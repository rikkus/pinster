function save_options() {
    chrome.storage.sync.set({
        "apiToken": document.getElementById("api-token").value.trim()
    }, function () {
        var statusElement = document.getElementById('status');
        statusElement.textContent = 'Saved';
        setTimeout(function () {
            statusElement.textContent = ' ';
        }, 1500);
    });
}
function load_options() {
    chrome.storage.sync.get({
        "apiToken": ''
    }, function (items) {
        if (chrome.runtime.lastError === undefined) {
            document.getElementById('api-token').value = items.apiToken;
        }
    });
}
document.addEventListener('DOMContentLoaded', load_options);
document.getElementById('save').addEventListener('click', save_options);
//# sourceMappingURL=options.js.map