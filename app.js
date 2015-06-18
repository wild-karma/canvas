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
var TRACK_LOGIN = 'login';
var TRACK_FRIEND_SELECT_DISPLAY = 'friendSelectDisplay';


//### ANALYTICS METHODS ###
var trackConnectionCreated = function(success) {
    var params = {};
    params[FB.AppEvents.ParameterNames.CONTENT_ID] = currentUser ? currentUser.id : UNKNOWN_USER_ID;
    params[FB.AppEvents.ParameterNames.SUCCESS] = success;
    params[TRACK_APP_NS] = appNs();
    FB.AppEvents.logEvent(TRACK_CONNECTION_CREATED, null, params);
}
var trackFriendSelectDisplay = function(success) {
    var params = {};
    params[FB.AppEvents.ParameterNames.CONTENT_ID] = currentUser ? currentUser.id : UNKNOWN_USER_ID;
    params[FB.AppEvents.ParameterNames.SUCCESS] = success;
    params[TRACK_APP_NS] = appNs();
    FB.AppEvents.logEvent(TRACK_FRIEND_SELECT_DISPLAY, null, params);
}
var trackLogin = function(success) {
    var params = {};
    params[FB.AppEvents.ParameterNames.CONTENT_ID] = currentUser ? currentUser.id : UNKNOWN_USER_ID;
    params[FB.AppEvents.ParameterNames.SUCCESS] = success;
    params[TRACK_APP_NS] = appNs();
    FB.AppEvents.logEvent(TRACK_LOGIN, null, params);
}


// ### COMMON HELPER METHODS ###
function error(obj) {
    console.error(obj);
}


// ### APP STATE METHODS ###
function onLogin(response) {
    if (response.status == 'connected') {
        FB.api('/me?fields='+TAGGABLE_FRIEND_FIELDS.toString(), function(data) {
            currentUser = data;
            trackLogin(1);

            var welcomeBlock = document.getElementById('fb-welcome');
            welcomeBlock.innerHTML = 'Hello, ' + currentUser.first_name + '!';

            renderMFS();
            trackFriendSelectDisplay(1);
            // HYPOTHESIS: one would expect to see
            // trackLogin == trackFriendSelectDisplay
            // count if technology is working correctly
        });
    } else {
        trackLogin(0);
    }
}


// ### BUSINESS LOGIC ###
function clearSelectedFriends() {
    var mfsForm = document.getElementById(MULTI_FRIEND_SELECT_DOM_FORM_ID);
    for(var i = 0; i < mfsForm.friends.length; i++) {
        mfsForm.friends[i].checked = false;
    }
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
    for(var i = 0; i < taggedFriendIds.length; i++) {
        taggedFriendIds.push(taggedFriendIds[i].id);
    }
    return taggedFriendIds;
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

        // Create a button to send the Request(s)
        var sendButton = document.createElement('input');
        sendButton.type = 'button';
        sendButton.value = 'Connect Friends';
        sendButton.onclick = publishConnection;
        mfsForm.appendChild(sendButton);
    });
}

function publishConnection() {
    // get the list of selected friends
    var taggedFriends = getTaggedFriends();
    clearSelectedFriends();

    // make connection post on behalf of user
    // https://developers.facebook.com/docs/graph-api/reference/v2.3/user/feed#publish
    var ogObjType = appNs() + ':connection';
    var ogObjUri = '/me/objects/' + ogObjType;
    FB.api(ogObjUri, 'post',
            {
                object: {
                    'fb:app_id': appId(),
                    'og:type': ogObjType,
                    'og:title': currentUser.first_name + 'created a connection',
                    'og:description': 'variable description'
                },
                privacy: {
                    'value': 'SELF' // will be exposed to SELF and anyone tagged
                },
                tags: getTaggedFriendIds(taggedFriends).toString()
            },
            function (response) {
                if (response && !response.error) {
                    trackConnectionCreated(1);
                    // GOAL : trackConnectionCreated / trackFriendSelectDisplay > 0.25 : for prod namespace

                    alert('Connection made.');
                } else {
                    trackConnectionCreated(0);

                    // TODO user facing error handling
                    // https://developers.facebook.com/docs/graph-api/using-graph-api/v2.3#receiving-errorcodes
                    error(response.error);
                }
            }
    );
}
