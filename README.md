Wild Karma: leverage social graph for matchmaking
=============================================

Facebook [Canvas](https://developers.facebook.com/docs/games/canvas) App
that allows users to recommend new graph connections and store these
recommendations in [Open Graph](https://developers.facebook.com/docs/games/opengraph).


Deploy: Prod
--------
1. Create a pull request from `master` to `gh-pages` like
https://github.com/wild-karma/canvas/pull/1. TODO: more description and
actual review?
2. Upon merge, the new static website will be hosted here: https://wild-karma.github.io/canvas/
3. In turn, https://wild-karma.appspot.com/ pulls from `github.io` using https://github.com/wild-karma/drydrop.
4. https://wild-karma.appspot.com/ is then pulled into https://apps.facebook.com/wild-karma/.

Why not use `github.io` hosting directly? FB makes HTTP POST to static assets:
https://developers.facebook.com/docs/games/canvas/login
