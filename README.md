=Introduction=
Candy (Chats Are Not Dead Yet) was developed by Michael Weibel (@weibelm) and Patrick Stadler (@pstadler) on behalf of their employer Amiado Group. <p/>It provides group and private chat for  collaborative working between teams.

This plugin makes Candy work out of the box with Openfire providing the following features:

 * Easy deployment for Openfire users
 * Support for Openfire BOSH and WebSockets web connections.
 * Support for Jitsi-Videobridge plugin for Openfire for webrtc audio and video

https://openfire-candy.googlecode.com/files/Image19.png

=Example Webclient Configuration=

{{{

Candy.init('/http-bind/', {
	core: { debug: false, websockets: true},
	view: { resources: '../res/' }
});

Candy.Core.connect();

}}}

https://openfire-candy.googlecode.com/files/Image21.png

=Installation=

 * Stop Openfire.
 * Copy the websockets.war file to the OPENFIRE_HOME/plugins directory.
 * Copy the jitsivideobridge.jar file to the OPENFIRE_HOME/plugins directory.
 * Copy the candy.war file to the OPENFIRE_HOME/plugins directory.
 * Restart Openfire.
 * From a browser, go to http://your_openfire-server:7070/candy
 * If this pages do not appear, please check you log files and post any errors on http://www.igniterealtime.org

=Openfire Properties=

||Property||||Default Value||||Description||
||<b>candy.webapp.name</b>||||candy||||Web application root name||

=Dependencies=

 * The Openfire websockets plugin to set group-chat bookmarks
 * The Openfire jitsivideobridge plugin for audio and video
