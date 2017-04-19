chrome.commands.onCommand.addListener(function(command) {
    console.log('Would bookmark: ', command);

    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){

        var url = tabs[0].url;
        var title = tabs[0].title;

        var addUrl = "https://api.pinboard.in/v1/posts/add?auth_token=" +
            "rikkus:137A2FE662784BEC0308" +
            "&" +
            "url=" + encodeURI(url) +
            "&" +
            "description=" + encodeURI(title);


        console.log('Calling: ', addUrl);


        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                console.log(xhr.responseText);
            }
        };

        xhr.open("GET", addUrl, true);
        xhr.send();
    }); 
});