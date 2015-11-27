Wild Karma: leverage social graph for matchmaking
=============================================

Facebook [Canvas](https://developers.facebook.com/docs/games/canvas) App
that allows users to recommend new graph connections and store these
recommendations in [Open Graph](https://developers.facebook.com/docs/games/opengraph).

Local Dev
--------
1. Install [node.js](https://nodejs.org/).
2. cd to root of project.
3. `npm install`
4. `npm start` to run the server. See package.json for port configuration.

Deploy: Prod
--------
`appcfg.py update .` from <https://cloud.google.com/appengine/docs/python/gettingstartedpython27/uploading>

<https://wild-karma.appspot.com/> is pulled into <https://apps.facebook.com/wild-karma>

Why not use `github.io` hosting directly? FB makes HTTP POST to static assets -
<https://developers.facebook.com/docs/games/canvas/login> - then GH pages nginx returns 405.
