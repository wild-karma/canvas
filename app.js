// ### GLOBAL ENVIRONMENT SETTINGS ###
var APP_ID_DEV = '1620490794859089';
var APP_ID_PROD = '1619998651574970';
var APP_NS_DEV = 'wild-karma-dev';
var APP_NS_PROD = 'wild-karma';
var MULTI_FRIEND_SELECT_DOM_CONTAINER_ID  = 'multi-friend-select';
var MULTI_FRIEND_SELECT_DOM_FORM_ID = MULTI_FRIEND_SELECT_DOM_CONTAINER_ID + '-form';
var TAGGABLE_FRIEND_FIELDS = ['id', 'first_name', 'last_name', 'name', 'picture'];
var UNKNOWN_USER_ID = 0;


//### GLOBAL ENVIRONMENT VARIABLES ###
var currentUser = {};
var taggableFriends = [];


// ### GLOBAL ENVIRONMENT METHODS ###
var appId = function() {
    return isDev ? APP_ID_DEV : APP_ID_PROD;
};
var appNs = function() {
    return isDev ? APP_NS_DEV : APP_NS_PROD;
}
var isDev = function() {
    return document.location.hostname.indexOf("localhost") > -1;
};


//### ANALYTICS CONSTANTS ###
var TRACK_APP_NS = 'appNameSpace';
var TRACK_CONNECTION_CREATED = 'connectionCreated';
var TRACK_CONNECTION_SUGGESTED = 'connectionSuggested';
var TRACK_LOGIN = 'login';
var TRACK_LOGIN_LANDING = 'login_landing';
var TRACK_FRIEND_SELECT_DISPLAY = 'friendSelectDisplay';


//### ANALYTICS METHODS ###
var trackEvent = function(type, success) {
    var params = {};
    // https://developers.facebook.com/docs/reference/javascript/FB.AppEvents.LogEvent#parameters
    params[FB.AppEvents.ParameterNames.CONTENT_ID] = getCurrentUserId();
    params[FB.AppEvents.ParameterNames.SUCCESS] = success;
    params[TRACK_APP_NS] = appNs();
    if (!isDev()) { // will bomb if not in full FB Canvas environment
        FB.AppEvents.logEvent(type, null, params);
    }
}


// ### COMMON HELPER METHODS ###
function getCurrentUserId() {
    if (currentUser && currentUser.hasOwnProperty('id')) {
        return currentUser.id;
    }
    return UNKNOWN_USER_ID;
}

function error(obj) {
    console.error(obj);
}


// ### APP STATE METHODS ###
function onLogin(response) {
    if (response.status == 'connected') {
        FB.api('/me?fields='+TAGGABLE_FRIEND_FIELDS.toString(), function(data) {
            currentUser = data;
            trackEvent(TRACK_LOGIN, 1);

            var welcomeBlock = document.getElementById('fb-welcome');
            welcomeBlock.innerHTML = 'Hello, ' + currentUser.first_name + '!';

            renderMFS();
            trackEvent(TRACK_FRIEND_SELECT_DISPLAY, 1);
            // HYPOTHESIS: one would expect to see
            // TRACK_LOGIN ~ TRACK_FRIEND_SELECT_DISPLAY
            // count if technology is working correctly
        });
    } else {
        trackEvent(TRACK_LOGIN, 0);
    }
}


// ### BUSINESS LOGIC ###
function clearSession() {
    // clear friend selection
    var mfsForm = document.getElementById(MULTI_FRIEND_SELECT_DOM_FORM_ID);
    for(var i = 0; i < mfsForm.friends.length; i++) {
        mfsForm.friends[i].checked = false;
    }
}

function getConnectionReason() {
    // TODO: get value from user text field
    return 'this is why you guys should hoook up';
}

function getConnectionType() {
    // TODO: get value from drop-down
    return 'romantic entanglement';
}

function getConnectionTypeDescription() {
    // TODO: get value from stored dictionary
    return 'loves bites and so do I';
}

function getTaggedFriends() {
    var taggedFriends = [];
    var mfsForm = document.getElementById(MULTI_FRIEND_SELECT_DOM_FORM_ID);
    for(var i = 0; i < mfsForm.friends.length; i++) {
        if(mfsForm.friends[i].checked) {
            taggedFriends.push(taggableFriends[i]);
        }
    }
    return taggedFriends;
}

function getTaggedFriendIds(taggedFriends) {
    var taggedFriendIds = [];
    for(var i = 0; i < taggedFriends.length; i++) {
        taggedFriendIds.push(taggedFriends[i].id);
    }
    return taggedFriendIds;
}

function getTaggedFriendNames(taggedFriends) {
    var taggedFriendNames = [];
    for(var i = 0; i < taggedFriends.length; i++) {
        taggedFriendNames.push(taggedFriends[i].name);
    }
    return taggedFriendNames;
}

function renderMFS() {
    // First get the list of friends for this user with the Graph API
    FB.api('/me/taggable_friends?fields='+TAGGABLE_FRIEND_FIELDS.toString(),
            function(response) {
        taggableFriends = response.data;

        var container = document.getElementById(MULTI_FRIEND_SELECT_DOM_CONTAINER_ID);
        var mfsForm = document.createElement('form');
        mfsForm.id = MULTI_FRIEND_SELECT_DOM_FORM_ID;

        // Iterate through the array of friends object and create a checkbox for each one.
        for(var i = 0; i < response.data.length; i++) {

            // Image
            var image = document.createElement('img');
            image.src = response.data[i].picture.data.url;
            mfsForm.appendChild(image);

            // Checkbox and name
            var friendItem = document.createElement('div');
            friendItem.id = 'friend_' + response.data[i].id;

            var checkbox = '<input type="checkbox" name="friends" value="'
                + response.data[i].id + '" />' + response.data[i].name;
            friendItem.innerHTML = checkbox;

            mfsForm.appendChild(friendItem);
        }
        container.appendChild(mfsForm);

        // TODO: create reason drop-down - presets and randos

        // Create a button to send the Request(s)
        var sendButton = document.createElement('input');
        sendButton.type = 'button';
        sendButton.value = 'Connect Friends';
        sendButton.onclick = createConnectionObj;
        mfsForm.appendChild(sendButton);
    });
}

function createConnectionObj() {
    // https://developers.facebook.com/docs/sharing/opengraph/object-api#objectapi-creatinguser
    // https://developers.facebook.com/docs/sharing/opengraph/object-properties

    var ogObjType = appNs() + ':connection';
    var ogObjUri = '/me/objects/' + ogObjType;

    FB.api(ogObjUri, 'post',
            {
                object: {
                    'og:title': getConnectionType(),
                    'og:description': getConnectionTypeDescription()
                } // TODO: add og:image ?
            },
            function (response) {
                if (response && !response.error) {
                    trackEvent(TRACK_CONNECTION_CREATED, 1);
                    publishStory([response.id]);
                } else {
                    trackEvent(TRACK_CONNECTION_CREATED, 0);
                    error(response.error);
                }
            }
    );
}

function publishStory(createdObjIds) {
    // https://developers.facebook.com/docs/graph-api/reference/v2.3/post
    // https://developers.facebook.com/docs/sharing/opengraph/using-actions#publish

    var ogActType = appNs() + ':suggest';
    var ogActUri = '/me/' + ogActType;
    FB.api(ogActUri, 'post',
            {
                connection: createdObjIds,
                start_time: (new Date()).toJSON(),
                expires_in: 30, // past-tense in 30 seconds
                message: getConnectionReason(),
                privacy: {
                    'value': 'SELF' // will be exposed to SELF and anyone tagged
                },
                tags: getTaggedFriendIds(getTaggedFriends()).toString()
            }, function (response) {
                clearSession();
        
                if (response && !response.error) {
                    trackEvent(TRACK_CONNECTION_SUGGESTED, 1);
                    alert('Connection Made');
                } else {
                    trackEvent(TRACK_CONNECTION_SUGGESTED, 0);
                    error(response.error);
                }
            }
    );
}
