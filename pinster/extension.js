/*jslint es6*/
"use strict";

const XHR_DONE = 4;
const HTTP_OK = 200;
const MEDIUM_ICON_PATH = 'icons/pinster-48.png';
const ADD_URL = 'https://api.pinboard.in/v1/posts/add';

const NOTIFICATION_ID_PREFIX = "pin-";
const NOTIFICATION_ID_SUFFIX_LATER = "later";
const NOTIFICATION_ID_SUFFIX_BOOKMARK = "bookmark";
const NOTIFICATION_ID_SUFFIX_ERROR = "error";
const ERROR_ADDING_BOOKMARK = "Error adding bookmark";

function notification_id(ok, later) {
    return NOTIFICATION_ID_PREFIX +
        (ok ?
            (later ?
                NOTIFICATION_ID_SUFFIX_LATER :
                NOTIFICATION_ID_SUFFIX_BOOKMARK
            ) :
            NOTIFICATION_ID_SUFFIX_ERROR
        );
}

function notification_title(ok, later) {
    return ok ? (later ? "Read later added" : "Bookmark added") : "Error";
}

function notification_message(ok, tabTitle, errorMessage) {
    return ok ? tabTitle : ("Error communicating with pinboard.in: " + errorMessage);
}

function notification_data(ok, later, tabTitle, errorMessage) {
    return {
        id: notification_id(ok, later),
        title: notification_title(ok, later),
        message: notification_message(ok, tabTitle, errorMessage)
    };
}

function notify(id, title, message) {
    console.log({id: id, title: title, message: message});
    console.log(chrome.runtime.lastError);
    const iconUrl = chrome.runtime.getURL(MEDIUM_ICON_PATH);
    chrome.notifications.create(
        id, {
            iconUrl: iconUrl,
            title: title,
            type: "basic",
            message: message
        }
    );
}

function build_url(url, params) {
    return (params.length == 0) ? url :
        url + '?' + Object.entries(params).map(a => a[0] + '=' + encodeURI(a[1])).join('&');
}

function add_url(apiToken, url, title, later) {
    return build_url(ADD_URL, {
        auth_token: encodeURI(apiToken),
        url: url,
        description: title,
        toread: later ? "yes" : "no"
    });
}

function parse_response(responseText) {
    try {
        var doc = new DOMParser().parseFromString(responseText, "text/xml");
        var resultCode = doc.documentElement.getAttribute("code");
        return { ok: (resultCode == 'done'), message: resultCode };
    }
    catch (error) {
        return { ok: false, message: error.message };
    }
}

function add_bookmark(apiToken, url, tabTitle, later) {
    try {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XHR_DONE && xhr.status == HTTP_OK) {
                const { ok: ok, message: message } = parse_response(xhr.responseText);
                const notificationData = notification_data(ok, later, tabTitle, message);
                notify(notificationData.id, notificationData.title, notificationData.message);
            }
        };
        xhr.onerror = function () {
            var message = (chrome.runtime.lastError ? chrome.runtime.lastError : "Unknown");
            notify(NOTIFICATION_ID_PREFIX + NOTIFICATION_ID_SUFFIX_ERROR, ERROR_ADDING_BOOKMARK, message);
        };
        xhr.open("GET", add_url(apiToken, url, tabTitle, later), true);
        xhr.send();
    } catch (error) {
        notify(NOTIFICATION_ID_PREFIX + NOTIFICATION_ID_SUFFIX_ERROR, ERROR_ADDING_BOOKMARK, error.message)
    }
}

function pin(later) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        chrome.storage.sync.get({"apiToken": ''}, function (items) {
            if (typeof chrome.runtime.lastError == 'undefined') {
                add_bookmark(items.apiToken, tabs[0].url, tabs[0].title, later);
            } else {
                notify(NOTIFICATION_ID_PREFIX + NOTIFICATION_ID_SUFFIX_ERROR, ERROR_ADDING_BOOKMARK, chrome.runtime.lastError)
            }
        });
   });
}

chrome.commands.onCommand.addListener(function(command) {
    switch (command) {
        case 'pin-bookmark': pin(false); break;
        case 'pin-later': pin(true); break;
    }
});
