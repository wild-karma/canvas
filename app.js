// ### GLOBAL ENVIRONMENT SETTINGS ###
APP_ID_DEV = '1620490794859089';
APP_ID_PROD = '1619998651574970';


// ### GLOBAL ENVIRONMENT METHODS ###
var appId = function() {
    return isDev ? APP_ID_DEV : APP_ID_PROD;
};
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
function renderMFS() {
    // First get the list of friends for this user with the Graph API
    FB.api('/me/taggable_friends', function(response) {
        var container = document.getElementById('mfs');
        var mfsForm = document.createElement('form');
        mfsForm.id = 'mfsForm';

        // Iterate through the array of friends object and create a checkbox for each one.
        for(var i = 0; i < Math.min(response.data.length, 10); i++) {
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

function sendRequest() {
    // Get the list of selected friends
    var sendUIDs = '';
    var mfsForm = document.getElementById('mfsForm');
    for(var i = 0; i < mfsForm.friends.length; i++) {
        if(mfsForm.friends[i].checked) {
            // To get display name:
            // mfsForm.friends[i].nextSibling.data 
            sendUIDs += mfsForm.friends[i].value + ',';
        }
    }

    // Use FB.ui to send the Request(s)
    // TODO You cannot send app requests for non-game apps. This appears to be the only way for now.
//    FB.ui({
//        method: 'send',
//        to: sendUIDs,
//        link: 'https://google.com',
//        title: 'Check This Person Out!',
//    }, log);
    
    // Create profile object.
    FB.api(
        'me/objects/profile',
        'post',
        {
           object: {
              'og:title': 'Connection Made! ' + new Date(),
              'og:image': 'https://s-static.ak.fbcdn.net/images/devsite/attachment_blank.png',
              'profile:first_name': 'Steve',
              'profile:last_name': 'Steverson',
              'profile:username': 'foo@bar.io',
              'profile:gender': 'Male'
           }
        },
        function(response) {
            log(response);

            var id = response['id'];
            
            // Make post with profile.
            FB.api(
              'me/wild-karma-dev:connect',
              'post',
              {
                profile: [id, id] // Or profile: id
                // privacy: {'value': 'SELF'}
              },
              log
            );
        }
    );
}
