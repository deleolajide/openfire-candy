/**
 * Candy Plugin for Openlink VoiceBridge Conferencing
 *
 */
var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.VoiceBridge = (function(self, Candy, $) {
	
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
	
	self.init = function(url) {
		
		sipURL = url;
		
		Candy.View.Event.Room.onAdd = handleOnAdd;
		Candy.View.Event.Room.onShow = handleOnShow;
		Candy.View.Event.Room.onHide = handleOnHide;
		Candy.View.Event.Room.onClose = handleOnClose;	
		Candy.View.Event.Room.onPresenceChange = handleOnPresenceChange;

		connection = Candy.Core.getConnection();
		Candy.Core.addHandler(openlinkCallback, null, 'message');

		if (sipURL != null && sipURL.indexOf('rtmp:') > -1)
		{		
			flash = new SWFObject("../plugins/voicebridge/confphone.swf?rtmpUrl=rtmp:/voicebridge&recieverStream=reciever" + uid + "&senderStream=sender" + uid, "voiceBridgeID", "1", "1", "11");
			flash.addParam("swLiveConnect", "true");
			flash.addParam("name", "voiceBridgeID");
			flash.write("candy-audio");
		}
	};
		
	var handleOnAdd = function(arg) {

		voiceJid[arg.roomJid] = false;		
		console.log("handleOnAdd " + arg.roomJid);

	
	};	

	var handleOnShow = function(arg) {
		
		oldJid = newJid;
		newJid = arg.roomJid;
		
		oldRoom = newRoom;		
		newRoom = newJid.split('@')[0];

		console.log("handleOnShow old " + oldJid + " new " + newJid);
		
		var privateChatName = newJid.indexOf('/') > -1 ? newJid.split('/')[1] : null;
		var myChatName = connection.jid.split('@')[0];	

		if (sipURL != null)
		{
			if (voiceJid[oldJid] == true)
			{		
				var action1 = ['CancelCall', oldRoom + uid, null];
				var actions = [action1];
				connection.openlink.manageVoiceBridge(openlinkResponse, connection.jid, actions);

				if (oldJid.indexOf('/') > -1)
				{				
					Candy.View.Pane.Message.show(oldJid, myChatName, "Stopping private voice conversation");
	
				}
				
				voiceJid[oldJid] = false;				



			} else if (oldJid == newJid)	{ // only happen when tab is clicked again, once	
			
				var participantId = newRoom + uid;
				var ConfName = newRoom;

				if (privateChatName != null)
				{
					ConfName = myChatName > privateChatName ? privateChatName + "_" + myChatName :  myChatName + "_" + privateChatName;
					console.log("handleOnShow private chat conf = " + ConfName);
									
					Candy.View.Pane.Message.show(newJid, myChatName, "Starting private voice conversation");
		
				}				   

				if (sipURL.indexOf('rtmp:') > -1)
				{	
					var action1 = ['protocol', participantId, "RTMP"];
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

				//connection.openlink.monitorVoiceBridge(openlinkResponse, newRoom);
				connection.openlink.manageVoiceBridge(openlinkResponse, connection.jid, actions);
				
				voiceJid[newJid] = true;
				
			}			
		}
	};

	var openlinkCallback = function(message) {

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
	}
	var openlinkResponse = function(response) {
		
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