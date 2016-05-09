// ### GLOBAL ENVIRONMENT SETTINGS ###
var APP_ID_DEV = '1620490794859089';
var APP_ID_PROD = '1619998651574970';
var APP_NAME = 'Wild Karma';
var APP_NS_DEV = 'wild-karma-dev';
var APP_NS_PROD = 'wild-karma';
var CONNECTION_TYPE = [
    'coworkers',
    'brewery buddies',
    'romantic entanglement',
    'climbing companions',
    'strictly platonic',
    'art aficionados',
    'wing wo/man',
    'active casual',
    'active skilled',
    'active ultra',
    'fairy godmother',
    'family'
];
var CONNECTION_TYPE_DESC = [
    'Strictly business until HR gets involved.',
    "We're not trying to get hammered, we're trying to find the perfect quaffable!",
    'Some things are negotiable, some things are not. Two are better than one?',
    "It's nice to have someone ready to ... SWEET BABY JESUS I'M FALLING",
    'Confined to words, theories, or ideals, and not leading to practical action.',
    'Human creative skill and imagination is enjoyed better with company.',
    'Rule #5 (of the code): partner has the right to deck partner if there is no chance of getting out alive',
    'We enjoy being outside.',
    'You ever take that thing off any sweet jumps?',
    "It's not fun unless we lose some toenails!!!",
    'Magical powers required. Mentoring suggested.',
    'Horribly uncomfortably awkward dinner scenes.'
];
var MULTI_FRIEND_SELECT_DOM_CONTAINER_ID  = 'multi-friend-select';
var PAGING_LIMIT = 800;
var TAGGABLE_FRIEND_FIELDS = ['id', 'first_name', 'last_name', 'name', 'picture'];
var UNKNOWN_USER_ID = 0;
var WELCOME_MESSAGE_DOM_CONTAINER_ID = 'welcome-message';
var WELCOME_NAME_DOM_CONTAINER_ID = 'welcome-name';


//### GLOBAL ENVIRONMENT VARIABLES ###
var currentUser = {};
var taggableFriends = [];


// ### GLOBAL ENVIRONMENT METHODS ###
var appId = function() {
    return isDev() ? APP_ID_DEV : APP_ID_PROD;
};
var appNs = function() {
    return isDev() ? APP_NS_DEV : APP_NS_PROD;
};
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
};


// ### COMMON HELPER METHODS ###
function error(obj) {
    console.error(obj);
}

function getCurrentUserId() {
    if (currentUser && currentUser.hasOwnProperty('id')) {
        return currentUser.id;
    }
    return UNKNOWN_USER_ID;
}

function sortFriendsByName(a, b) {
    var x = a.name.toLowerCase();
    var y = b.name.toLowerCase();
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
}

function updateUserWithStatus(message) {
    alert(message);
}


// ### APP STATE METHODS ###
function onLogin(response) {
    if (response.status == 'connected') {
        FB.api('/me?fields='+TAGGABLE_FRIEND_FIELDS.toString(), function(data) {
            currentUser = data;
            trackEvent(TRACK_LOGIN, 1);

            var welcomeName = document.getElementById(WELCOME_NAME_DOM_CONTAINER_ID);
            welcomeName.innerText = ' ' + currentUser.first_name;

            var welcomeMessage = document.getElementById(WELCOME_MESSAGE_DOM_CONTAINER_ID);
            welcomeMessage.innerText = 'Help your friends meet new people with '
                + APP_NAME + '.'
                + ' Only the people you tag will see!';

            renderMFS();

            // TODO load custom for ?fb_source=opengraphobject&fb_object_id=...
            // var og_obj_id = Arg('fb_object_id');

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
    $('#multi-friend-select .friend .active').removeClass('active');

    // reset drop-down reasoning option to first
    $('#reasonCategorySelect').prop('selectedIndex', 0);

    // reset text area reasoning
    $('#reasonTextArea').val('');

    // reset connect button
    $('#sendButton').button('reset');
}

function getConnectionMessage() {
    return $('#reasonTextArea').val();
}

function getConnectionType() {
    var selectedIndex = $('#reasonCategorySelect').find(":selected").val();
    return CONNECTION_TYPE[selectedIndex];
}

function getConnectionTypeDescription() {
    var selectedIndex = $('#reasonCategorySelect').find(":selected").val();
    return CONNECTION_TYPE_DESC[selectedIndex];
}

function getTaggedFriendIds() {
    var taggedFriendIds = [];
    var friendSelector = $('#multi-friend-select .friend .active');
    for(var i = 0; i < friendSelector.length; i++) {
        taggedFriendIds.push(friendSelector[i].id);
    }
    return taggedFriendIds;
}

function renderMFS() {
    // First get the list of friends for this user with the Graph API
    FB.api('/me/taggable_friends?fields='+TAGGABLE_FRIEND_FIELDS.toString()+'&limit='+PAGING_LIMIT, function(response) {
        taggableFriends = response.data.sort(sortFriendsByName);

        var multiFriendSelect = document.getElementById(
            MULTI_FRIEND_SELECT_DOM_CONTAINER_ID
        );

        // Iterate through the array of friends object and create a checkbox for each one.
        var friendsRow = document.createElement('div');
        friendsRow.className = 'row';
        for(var i = 0; i < taggableFriends.length; i++) {
            // friend item container
            var friendItem = document.createElement('div');
            friendItem.className = 'friend col-xs-6 col-sm-3 col-md-2 col-lg-1';
            friendItem.id = 'friend_' + taggableFriends[i].id;

            // friend inner wrapper
            var friendButton = document.createElement('button');
            friendButton.id = taggableFriends[i].id;
            friendButton.className = 'btn btn-default';
            friendButton.type = 'button';
            friendButton.setAttribute('data-toggle', 'button');
            friendButton.setAttribute('data-target', taggableFriends[i].id);
            friendButton.setAttribute('aria-pressed', 'false');
            friendButton.setAttribute('autocomplete', 'off');

            // friend image
            var image = document.createElement('img');
            image.className = 'image img-thumbnail';
            image.src = taggableFriends[i].picture.data.url;
            friendButton.appendChild(image);

            // friend name
            var name = document.createElement('div');
            name.className = 'name';
            name.innerHTML = taggableFriends[i].name;
            friendButton.appendChild(name);

            friendItem.appendChild(friendButton);
            friendsRow.appendChild(friendItem);
        }
        multiFriendSelect.appendChild(friendsRow);

        // spacer
        var spacingRow = document.createElement('div');
        spacingRow.className = 'row';
        spacingRow.innerHTML = '&nbsp;';
        multiFriendSelect.appendChild(spacingRow);

        // why u b trying to connectify these fine folks?
        var connectionReasonRow = document.createElement('div');
        connectionReasonRow.className = 'row';

        var reasonForm = document.createElement('form');

        reasonForm.appendChild(document.createElement('br'));

        var reasonCategorySelect = document.createElement('select');
        reasonCategorySelect.id = 'reasonCategorySelect';
        reasonCategorySelect.className = 'form-control';
        for(var i = 0; i < CONNECTION_TYPE.length; i++) {
            var selectOption = document.createElement('option');
            selectOption.innerText = CONNECTION_TYPE[i] + ' :: ' + CONNECTION_TYPE_DESC[i];
            selectOption.value = i;
            reasonCategorySelect.appendChild(selectOption);
        }
        reasonForm.appendChild(reasonCategorySelect);

        reasonForm.appendChild(document.createElement('br'));

        var reasonTextArea = document.createElement('textarea');
        reasonTextArea.id = 'reasonTextArea';
        reasonTextArea.className = 'form-control';
        reasonTextArea.rows = 3;
        reasonTextArea.setAttribute('placeholder', 'I think you guys should hang out!');
        reasonForm.appendChild(reasonTextArea);

        connectionReasonRow.appendChild(reasonForm);

        multiFriendSelect.appendChild(connectionReasonRow);

        // spacer
        multiFriendSelect.appendChild(spacingRow);

        var buttonRow = document.createElement('div');
        buttonRow.className = 'row';

        // Create a button to send the Request(s)
        var sendButton = document.createElement('button');
        sendButton.id = 'sendButton';
        sendButton.className = 'btn btn-primary btn-lg btn-block send-button';
        sendButton.type = 'submit';
        sendButton.innerText = 'Post to Facebook privately';
        sendButton.setAttribute('data-loading-text', 'Tagging privately ...');
        sendButton.onclick = createConnectionObj;
        buttonRow.appendChild(sendButton);

        multiFriendSelect.appendChild(buttonRow);
    });
}

function createConnectionObj() {
    if (getTaggedFriendIds().length < 2) {
        updateUserWithStatus("Please select at least two friends to connect.");
        return;
    }

    // connect button into load state
    $('#sendButton').button('loading');

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
                message: getConnectionMessage(),
                privacy: {
                    'value': 'SELF' // will be exposed to SELF and anyone tagged
                },
                tags: getTaggedFriendIds().toString()
            }, function (response) {
                clearSession();
        
                if (response && !response.error) {
                    trackEvent(TRACK_CONNECTION_SUGGESTED, 1);
                    updateUserWithStatus('Your friends have been notified.');
                } else {
                    trackEvent(TRACK_CONNECTION_SUGGESTED, 0);
                    error(response.error);
                }
            }
    );
}
