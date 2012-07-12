/**
 * Candy Plugin for Openlink VoiceBridge Conferencing
 *
 */
var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.VoiceBridge = (function(self, Candy, $) {

	var remoteVideo = null;
	var webrtc = null;
	var me = null;
	
	var flash = null;
	var rtmpUrl = "rtmp:/voicebridge";
	var oldRoom = null;
	var oldJid = null;
	var voiceJid = {};	
	var newJid = null;	
	var newRoom = null;
	var sipURL = null;
	var connection = null;
	var uid = Math.random().toString(36).substr(2,9);
	

	var chatObserver = 
	{
		update: function(obj, args) 
		{
			if(args.type === 'connection')
			{
				switch(args.status) 
				{
					case Strophe.Status.CONNECTING:
						Candy.Core.addHandler(_jingleCallback, Strophe.NS.JINGLE, 'iq', 'set');
						Candy.Core.addHandler(_openlinkCallback, null, 'message');
						break;
				}
			}
		}
	};
		
	self.init = function(url) {
		
		sipURL = url;
		
		Candy.View.Event.Room.onAdd = handleOnAdd;
		Candy.View.Event.Room.onShow = handleOnShow;
		Candy.View.Event.Room.onHide = handleOnHide;
		Candy.View.Event.Room.onClose = handleOnClose;	
		Candy.View.Event.Room.onPresenceChange = handleOnPresenceChange;
		Candy.Core.Event.addObserver(Candy.Core.Event.KEYS.CHAT, chatObserver);
		
		connection = Candy.Core.getConnection();			
	};
		
	self.textToXML = function(text)
	{
		var doc = null;

		if (window['DOMParser']) {
		    var parser = new DOMParser();
		    doc = parser.parseFromString(text, 'text/xml');

		} else if (window['ActiveXObject']) {
		    var doc = new ActiveXObject("MSXML2.DOMDocument");
		    doc.async = false;
		    doc.loadXML(text);

		} else {
		    throw Error('No DOMParser object found.');
		}

		return doc.firstChild;
	};
	
	self.sendPacket = function(packet) {
	
		var xml = self.textToXML(packet);
		
		console.log("sendPacket");
		console.log(xml);		

		connection.send(xml);
	};

	self.startRemoteMedia = function(url) {

		remoteVideo.src = url;
	};
	
	self.startLocalMedia = function(url) {


	};
	
	var _jingleCallback = function(stanza) {
		
		console.log("jingleCallback");
		console.log(stanza);
		
	     	$(stanza).find('jingle').each(function() 
	     	{		
			webrtc.onMessage(this)

			if ($(this).attr('action') == "session-terminate")
			{
				remoteVideo.src = null;
			}

			if ($(this).attr('action') == "session-initiate")
			{
				webrtc.acceptCall($(stanza).attr('from'));
			}
             	});
             	
             	return true;
	};	
	
	var handleOnAdd = function(arg) {

		voiceJid[arg.roomJid] = false;		
		console.log("handleOnAdd " + arg.roomJid);

	
	};	

	var handleOnShow = function(arg) {

		if (webrtc == null && window.webkitPeerConnection00) 
		{
			me = Candy.Core.getUser().getJid().split('@')[1];
		
			document.getElementById("candy-audio").innerHTML = '<video style="display:none" id="remoteVideo" autoplay="autoplay"></video>';
			
			webrtc = new WebRtcJingle();
			webrtc.startApp(self, "", me);
			
			remoteVideo = document.getElementById("remoteVideo");
			
		}
		
		oldJid = newJid;
		newJid = arg.roomJid;
		
		oldRoom = newRoom;		
		newRoom = newJid.split('@')[0];

		console.log("handleOnShow old " + oldJid + " new " + newJid);
		
		var privateChatName = newJid.indexOf('/') > -1 ? newJid.split('/')[1] : null;	
		var myChatName = Candy.Core.getUser().getNick();

		if (sipURL != null)
		{
			if (voiceJid[oldJid] == true)
			{		
				if (oldJid.indexOf('/') > -1)
				{				
					Candy.View.Pane.Message.show(oldJid, myChatName, "Stopping private voice conversation");
	
				}
				
				voiceJid[oldJid] = false;

				if (window.webkitPeerConnection00) 
				{
					webrtc.jingleTerminate();
					remoteVideo.src = null;

					if (oldJid.indexOf('/') == -1)
					{					
						Candy.View.Pane.Message.show(oldJid, myChatName, "Stopping group voice conversation");
					}
					
					
				} else {
				
					var action1 = ['CancelCall', oldRoom + uid, null];
					var actions = [action1];
					connection.openlink.manageVoiceBridge(_openlinkResponse, connection.jid, actions);
				
					document.getElementById("candy-audio").innerHTML = "<p />"
					
				}



			} else if (oldJid == newJid)	{ // only happen when tab is clicked again, once	
			
				var participantId = newRoom + uid;
				var ConfName = newRoom;

				if (privateChatName != null)
				{
					ConfName = myChatName > privateChatName ? privateChatName + "_" + myChatName :  myChatName + "_" + privateChatName;
					console.log("handleOnShow private chat conf = " + ConfName);
									
					Candy.View.Pane.Message.show(newJid, myChatName, "Starting private voice conversation");
		
				}				   

				if (window.webkitPeerConnection00) 
				{
					webrtc.jingleInitiate(ConfName + "@openlink." + connection.domain, false)
					
					if (privateChatName == null)
					{					
						Candy.View.Pane.Message.show(oldJid, myChatName, "Starting group voice conversation");	
					}
		
				} else {
				
					if (sipURL.indexOf('rtmp:') > -1 || sipURL.indexOf('rtmfp:') > -1)
					{	
						if (sipURL.indexOf('rtmp:') > -1)
						{
							var action1 = ['protocol', participantId, "RTMP"];
						} else {

							var action1 = ['protocol', participantId, "RTMFP"];
						}
						var action2 = ['SetConference', participantId, ConfName];
						var action3 = ['RtmpSendStream', participantId, "sender" + uid];
						var action4 = ['RtmpRecieveStream', participantId, "reciever" + uid];	
						var action5 = ['MakeCall', participantId, null];
						var actions = [action1, action2, action3, action4, action5];

					} else {
						var action1 = ['protocol', participantId, "SIP"];				
						var action2 = ['SetPhoneNo', participantId, sipURL];
						var action3 = ['SetConference', participantId, ConfName];
						var action4 = ['MakeCall', participantId, null];
						var actions = [action1, action2, action3, action4];						
					}

					//connection.openlink.monitorVoiceBridge(_openlinkResponse, newRoom);
					connection.openlink.manageVoiceBridge(_openlinkResponse, connection.jid, actions);


					if (sipURL != null && sipURL.indexOf('rtmp:') > -1)
					{		
						flash = new SWFObject("../plugins/voicebridge/confphone.swf?rtmpUrl=rtmp:/voicebridge&recieverStream=reciever" + uid + "&senderStream=sender" + uid, "voiceBridgeID", "1", "1", "11");
						flash.addParam("swLiveConnect", "true");
						flash.addParam("name", "voiceBridgeID");
						flash.write("candy-audio");
					}

					else if (sipURL != null && sipURL.indexOf('rtmfp:') > -1)
					{		
						flash = new SWFObject("../plugins/voicebridge/confphone2.swf?recieverStream=reciever" + uid + "&senderStream=sender" + uid + "&rtmpUrl=rtmfp:/", "voiceBridgeID", "1", "1", "11");
						flash.addParam("swLiveConnect", "true");
						flash.addParam("name", "voiceBridgeID");
						flash.write("candy-audio");
					}
				}
				
				voiceJid[newJid] = true;				
				
			}			
		}
	};

	var _openlinkCallback = function(message) {
	
		console.log("_openlinkCallback");
		console.log(message);
		
		var $message = $(message);

		$('voicebridge', message).each(function() 
		{
			var bridge = new Object();

			bridge.jid = $(voicebridge).find('jid').text();
			bridge.eventType = $(voicebridge).find('eventtype').text();						    	
			bridge.dtmf = $(voicebridge).find('dtmf').text();						    	
			bridge.participants = $(voicebridge).find('participants').text();						    	
			bridge.callState = $(voicebridge).find('callstate').text();							    	
			bridge.conference = $(voicebridge).find('conference').text();							    	
			bridge.participant = $(voicebridge).find('participant').text();						    	
			bridge.callInfo = $(voicebridge).find('callinfo').text();							    	
			bridge.eventInfo = $(voicebridge).find('eventinfo').text();	
		});
		
            	return true;		
	}
	var openlinkResponse = function(response) {

            	return true;		
	};
	
	var handleOnHide = function(arg) {
	
		console.log("handleOnHide " + arg.roomJid);			

	};	

	var handleOnClose = function(arg) {
		
		console.log("handleOnClose " + arg.roomJid);

	};
	
	var handleOnPresenceChange = function(arg) {
		
		console.log("handleOnPresenceChange " + arg.roomJid);

	};	
	
	return self;
}(CandyShop.VoiceBridge || {}, Candy, jQuery));