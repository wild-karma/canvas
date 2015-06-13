// ### GLOBAL ENVIRONMENT SETTINGS ###
var APP_ID_DEV = '1620490794859089';
var APP_ID_PROD = '1619998651574970';
var APP_NS_DEV = 'wild-karma-dev';
var APP_NS_PROD = 'wild-karma';
var MULTI_FRIEND_SELECT_DOM_CONTAINER_ID  = 'multi-friend-select';
var MULTI_FRIEND_SELECT_DOM_FORM_ID = MULTI_FRIEND_SELECT_DOM_CONTAINER_ID + '-form';
var TAGGABLE_FRIEND_FIELDS = ['id', 'first_name', 'last_name', 'name', 'picture'];


//### GLOBAL ENVIRONMENT VARIABLES ###
var createdProfileObjectIds = [];
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


// ### COMMON HELPER METHODS ###
function log(obj) {
    console.log(obj);
}


// ### APP STATE METHODS ###
function onLogin(response) {
    if (response.status == 'connected') {
        FB.api('/me?fields=first_name', function(data) {
            var welcomeBlock = document.getElementById('fb-welcome');
            welcomeBlock.innerHTML = 'Hello, ' + data.first_name + '!';

            renderMFS();
        });
    }
}


// ### BUSINESS LOGIC ###
function clearSelectedFriends() {
    var mfsForm = document.getElementById(MULTI_FRIEND_SELECT_DOM_FORM_ID);
    for(var i = 0; i < mfsForm.friends.length; i++) {
        mfsForm.friends[i].checked = false;
    }
}

function clearSessionState() {
    createdProfileObjectIds.length = 0; // clear in place - http://stackoverflow.com/a/1232046
    clearSelectedFriends();
}

function getTaggableFriendCodes() {
    var taggableFriendCodes = [];
    var mfsForm = document.getElementById(MULTI_FRIEND_SELECT_DOM_FORM_ID);
    for(var i = 0; i < mfsForm.friends.length; i++) {
        if(mfsForm.friends[i].checked) {
            taggableFriendCodes.push(mfsForm.friends[i].value);
        }
    }
    return taggableFriendCodes;
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
            var friendItem = document.createElement('div');
            friendItem.id = 'friend_' + response.data[i].id;
            friendItem.innerHTML = '<input type="checkbox" name="friends" value="'
                + response.data[i].id + '" />' + response.data[i].name;
            mfsForm.appendChild(friendItem);
        }
        container.appendChild(mfsForm);

        // Create a button to send the Request(s)
        var sendButton = document.createElement('input');
        sendButton.type = 'button';
        sendButton.value = 'Connect Friends';
        sendButton.onclick = sendRequest;
        mfsForm.appendChild(sendButton);
    });
}

function createProfileObjects(taggableFriend) {
    // https://developers.facebook.com/docs/reference/opengraph/object-type/profile
    FB.api('/me/objects/profile', 'post',
            {
                object: {
                    'og:title': 'Connection Made! ' + new Date(),
                    'og:image': taggableFriend.picture.data.url,
                    'profile:first_name': taggableFriend.first_name,
                    'profile:last_name': taggableFriend.last_name,
                    'profile:username': taggableFriend.name
                },
                privacy: {
                    'value': 'SELF'
                }
            },
            log
    );
}

function sendRequest() {
    // Get the list of selected friends
    var sendUIDs = [];
    var mfsForm = document.getElementById('mfsForm');
    for(var i = 0; i < mfsForm.friends.length; i++) {
        if(mfsForm.friends[i].checked) {
            sendUIDs.push(mfsForm.friends[i].value);
        }
    }

    // make connection post on behalf of user
    // https://developers.facebook.com/docs/graph-api/reference/v2.3/user/feed#publish
    var ogActionUri = '/me/' + appNs() + ':connect';
    FB.api(ogActionUri, 'post',
            {
                message: "this is why I am connecting you people",
                privacy: {
                    'value': 'SELF'
                },
                profile: [], // TODO: pull in response.id from createProfileObjects
                tags: sendUIDs.toString() // tagged users CSV
            },
            log
    );
}
