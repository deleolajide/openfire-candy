/**
 * Openlink XMPP extensions, see http://openlink.4ng.net:8080/openlink/xep-xxx-openlink_15-11.xml
 *
 *
 */

if (!window.console) 
{
	window.console = {log: function() {}}

}


Strophe.addConnectionPlugin('openlink', 
{    
    init: function (conn) {
    
	console.log('openlink init')    
	this._conn = conn;
	this._callback = null;

	Strophe.addNamespace('ADHOC_COMMANDS', 'http://jabber.org/protocol/commands');
	Strophe.addNamespace('IODATA', 'urn:xmpp:tmp:io-data');
	Strophe.addNamespace('OPENLINK_MANAGE_VOICE_BRIDGE', 'http://xmpp.org/protocol/openlink:01:00:00#manage-voice-bridge');
	Strophe.addNamespace('PUBSUB', 'http://jabber.org/protocol/pubsub');
	
    },
    	
    manageVoiceBridge: function(olCallback, userJID, actions) 
    {
	console.log('openlink manageVoiceBridge ' + userJID)    
	
	this._command(Strophe.NS.OPENLINK_MANAGE_VOICE_BRIDGE);
	
	this.olIQ.c('jid').t(userJID).up()
			
        if (actions != null)
        {
                this.olIQ.c('actions')
                
		for (var i = 0; i < actions.length; i++) 
		{
			this.olIQ.c('action').c('name').t(actions[i][0]).up().c('value1').t(actions[i][1]).up();
			
			if (actions[i].length == 3 && actions[i][2] != null)
			{
				this.olIQ.c('value2').t(actions[i][2]).up();			
			}
			
			this.olIQ.up();			
		}
	}
        
	this._conn.sendIQ(this.olIQ, olCallback);
	   
    }, 

    monitorVoiceBridge: function(olCallback, room) 
    {
	console.log('openlink monitorVoiceBridge ' + room);  
	
 	this.olIQ = $iq({type: 'set', to: "pubsub." + this._conn.domain})
 	.c('pubsub', {xmlns: Strophe.NS.PUBSUB})
 	.c('subscribe', {node:room, jid:this._conn.jid})
	
	this._conn.sendIQ(this.olIQ, olCallback); 	  
    },


    _command: function(node)  {
    
 	this.olIQ = $iq({type: 'set', to: "openlink." + this._conn.domain})
 	.c('command', {xmlns: Strophe.NS.ADHOC_COMMANDS, action: 'execute', node: node})
 	.c('iodata', {xmlns: Strophe.NS.IODATA, type: 'input'}).c('in');   
    }
    
});

