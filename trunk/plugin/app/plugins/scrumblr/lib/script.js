var cards = {};
var totalcolumns = 0;
var columns = [];
var currentTheme = "bigcards";
var boardInitialized = false;

var phono = null;
var roomName = "lobby@conference." + window.binteo.hostname;
var user_name = Math.random().toString(36).substr(2,9);
var notReady = true;

function closeApp()
{
	phono.disconnect();
}
    
$(document).ready(function() 
{
     bConnection.util.filterWideband = function(offer, wideband) 
     {
        var codecs = new Array();
        bConnection.util.each(offer, function() {
            if (!wideband) {
                if (this.name.toUpperCase() == "G722" && this.rate == "8000") {
                    codecs.push(this);
                } else if (this.name == "telephone-event"){
                    codecs.push(this);
                }
            } else {
                codecs.push(this);
            }
        });
        return codecs;
    };
     

    
    function createNewbConnection()
    {    
	phono = $.bConnection({
	    identity: user_name,    
            connectionUrl: "http://" + window.binteo.host + "/http-bind/",
            gateway: window.binteo.hostname,

            onReady: function(event) 
            {
                console.log("Connection ready"); 
                initCards(new Array());
                initColumns(new Array());
                
                phono.messaging.rejoinMuc(roomName);

            },
            onUnready: function(event) 
            {
                console.log("Connection disconnected");  
                window.location.href = window.location.href;
            },	
            
            onPresence: function(event) 
            {
                console.log("onPresence query " + event.sessionId + "  " + event.requestId);                	
                phono.sendPresence(event.sessionId, event.requestId, "chat", "I am feeling lucky today");
            },	
            
            onError: function(event) 
            {
                newbConnectionDiv.find(".sessionId").text(event.reason);
                console.log(event.reason);  
            },	
	    
	    messaging: 
	    {
                onMessage: function(event, message) 
                {
            	    console.log("Message from " + message.from + " [" + message.body + "]");  
		    console.log(event);  
		    
		    if (message.body.startsWith("{") || true)
		    {
		    	if (notReady)
		    		getMessage(message.body);
		    	else {
		    	
		           if (message.identity != phono.identity)
		              getMessage(message.body);
		        }
		    }
                },

                onTyping: function(event) {
			console.log("onTyping ");
			console.log(event);
                },
                
                onJoin: function(event) {
			console.log("onJoin ");
			console.log(event);
			
			if (event.identity != phono.identity)
				displayUserJoined(event.identity, event.identity);
                },
                
                onLeave: function(event) {
			console.log("onLeave ");
			console.log(event);
			
			displayUserLeft(event.identity);			
                },
                
                onInvitation: function(event) 
                {
			console.log("onInvitation ");
			console.log(event);
			
			if (confirm("To:" + phono.sessionId + "\nFrom:" + event.from + " says: " + event.reason))
				phono.messaging.acceptMuc(event.conferenceId, event.from);
			else
				phono.messaging.rejectMuc(event.conferenceId, event.from, "i don't like you");			
                }                
                
	    }
        });
    }
    
    if (boardInitialized == false)
	blockUI('<img src="/scrumblr/images/ajax-loader.gif" width=43 height=11/>');

    //user_name = getCookie('scrumscrum-username');  
    
    if (user_name == null)
    	var decodedName = Math.random().toString(36).substr(2,9);
    else    
    	var decodedName = bConnection.util.decodeString(user_name);
  
    $("#yourname-input").val(user_name);
	
    createNewbConnection();
    
});


function sendAction(a, d)
{
	d.__action = a;
	var payload = JSON.stringify(d);
	
	console.log("sendAction");
	console.log(d);
	console.log(a + "=>" + payload);
	console.log(JSON.parse(payload));
	
	phono.messaging.send(roomName, payload, "groupchat");
	
	notReady = false;
}
/*
socket.on('connect', function(){ 
	//console.log('successful socket.io connect');
	
	//let the path be the room name
	var path = location.pathname;
	
	//imediately join the room which will trigger the initializations
	sendAction('joinRoom', path);
})

socket.on('disconnect', function(){ 
	blockUI("Server disconnected. Refresh page to try and reconnect...");
	//$('.blockOverlay').click($.unblockUI);
});

socket.on('message', function(data){ 
	getMessage(data);
})
*/

function unblockUI()
{
	$.unblockUI();
}

function blockUI(message)
{
	message = message || 'Waiting...';
	
	$.blockUI({ 
		message: message,
	
		css: { 
	   		border: 'none', 
		   	padding: '15px', 
		    backgroundColor: '#000', 
		    '-webkit-border-radius': '10px', 
		    '-moz-border-radius': '10px', 
		    opacity: .5, 
		    color: '#fff',
			fontSize: '20px'
		}
	}); 
}


function getMessage( m )
{
	try {
		var data = JSON.parse(m);
		var action = data.__action;
	} catch (e) { 
		console.log(e) 
		return;
	}
	
	console.log('<-- ' + action);
	
	switch (action)
	{
		case 'roomAccept':
			//okay we're accepted, then request initialization
			//(this is a bit of unnessary back and forth but that's okay for now)
			sendAction('initializeMe', null);
			break;
			
		case 'roomDeny':
			//this doesn't happen yet
			break;
			
		case 'moveCard':
                        moveCard($("#" + data.id), data.position);
			break;
			
		case 'initCards':
			initCards(data);
			break;
		
		case 'createCard':
			//console.log(data);
                        drawNewCard(data.id, data.text, data.x, data.y, data.rot, data.colour, null);
			break;
			
		case 'deleteCard':
			$("#" + data.id).fadeOut(500,
				function() {$(this).remove();}
			);
			break;
			
		case	'editCard':
			$("#" + data.id).children('.content:first').text(data.value);
			break;
			
		case 'initColumns':
			initColumns(data);
			break;
			
		case 'updateColumns':
			initColumns(data);
			break;
			
		case 'changeTheme':
			changeThemeTo(data.theme);
			break;
			
		case 'addSticker':
			addSticker( data.cardId, data.stickerId );
			break;
			
		case 'setBoardSize':
			resizeBoard( data );
			break;
			
		default:
			// updateColumns
			initColumns(data);
			break;
	}
	

}



function drawNewCard(id, text, x, y, rot, colour, sticker, animationspeed)
{
	//cards[id] = {id: id, text: text, x: x, y: y, rot: rot, colour: colour};
	
	var h = '<div id="' + id + '" class="card ' + colour + ' draggable" style="-webkit-transform:rotate(' + rot + 'deg);">\
	<img src="/scrumblr/images/icons/token/Xion.png" class="card-icon delete-card-icon" />\
	<img class="card-image" src="/scrumblr/images/' + colour + '-card.png">\
	<div id="content:' + id + '" class="content stickertarget droppable">' + text + '</div>\
	</div>';

        var card = $(h);
	card.appendTo('#board');
	
	//@TODO
	//Draggable has a bug which prevents blur event
	//http://bugs.jqueryui.com/ticket/4261
	//So we have to blur all the cards and editable areas when
	//we click on a card
	//The following doesn't work so we will do the bug
	//fix recommended in the above bug report
	// card.click( function() { 
	// 	$(this).focus();
	// } );
	
	card.draggable(
		{ 
			snap: false,
			snapTolerance: 5,
			containment: [0,0,2000,2000],
			stack: ".card"
	 	}
	);
	
	//After a drag:
	card.bind( "dragstop", function(event, ui) {

		var data = {
			id: this.id,
			position: ui.position,
			oldposition: ui.originalPosition,
		};
		
		sendAction('moveCard', data);
	});
	
	card.children(".droppable").droppable(
		{ 
			accept: '.sticker',
			drop: function( event, ui ) {
							var stickerId = ui.draggable.attr("id");
							var cardId = $(this).parent().attr('id');
							
							addSticker( cardId, stickerId );
							
							var data = { cardId: cardId, stickerId: stickerId };
							sendAction('addSticker', data);
						}
	 	}
	);
	
	var speed = Math.floor(Math.random() * 1000);
	if (typeof(animationspeed) != 'undefined') speed = animationspeed;

	
	card.animate({
		left: x + "px",
		top: y + "px" 
	}, speed);
	
	card.hover( 
		function(){ 
			$(this).addClass('hover');
			$(this).children('.card-icon').fadeIn(10);
		},
		function(){
			$(this).removeClass('hover');
			$(this).children('.card-icon').fadeOut(150);
		}
	 );
	
	card.children('.card-icon').hover(
		function(){
			$(this).addClass('card-icon-hover');
		},
		function(){
			$(this).removeClass('card-icon-hover');
		}
	);
	
	card.children('.delete-card-icon').click(
		function(){
			$("#" + id).remove();
			//notify server of delete
			sendAction( 'deleteCard' , { 'id': id });
		}
	);
	
	card.children('.content').editable( onCardChangeRequest,
		{
			style   : 'inherit',
			id: id,
			cssclass   : 'card-edit-form',
			type      : 'textarea',
			placeholder   : 'Double Click to Edit.',
			onblur: 'submit',
			xindicator: '<img src="/scrumblr/images/ajax-loader.gif">',
			event: 'dblclick' //event: 'mouseover'
		}
	);
	
	//add applicable sticker
	if (sticker != null)
		$("#" + id).children('.content').addClass( sticker );
}


function onCardChangeRequest(value, settings)
{
	console.log("onCardChangeRequest");
	console.log(settings.id + " = " + value);		

	sendAction('editCard', { id: settings.id, value: value });
	
	return value;
}


function moveCard(card, position) {
        card.animate({
                left: position.left+"px",
                top: position.top+"px" 
        }, 500);
}

function addSticker ( cardId , stickerId ) 
{
	
	cardContent = $('#' + cardId).children('.content');
	
	cardContent.removeClass("sticker-red");
	cardContent.removeClass("sticker-blue");
	cardContent.removeClass("sticker-green");
	cardContent.removeClass("sticker-yellow");
	cardContent.removeClass("sticker-gold");
	cardContent.removeClass("sticker-silverstar");
	cardContent.removeClass("sticker-bluestar");
	cardContent.removeClass("sticker-redstar");
	cardContent.removeClass("sticker-orange");
	cardContent.removeClass("sticker-pink");
	cardContent.removeClass("sticker-purple");
	cardContent.removeClass("sticker-lightblue");
	cardContent.addClass( stickerId );

}


//----------------------------------
// cards
//----------------------------------
function createCard( id, text, x, y, rot, colour )
{
	drawNewCard(id, text, x, y, rot, colour, null);
	
	var action = "createCard";
	
	var data = {
		id: id,
		text: text,
		x: x,
		y: y,
		rot: rot,
		colour: colour
	};
	
	sendAction(action, data);
	
}

function randomCardColour()
{
	var colours = ['yellow', 'green', 'blue', 'white'];
	
	var i = Math.floor(Math.random() * colours.length);
	
	return colours[i];
}


function initCards( cardArray )
{
	//first delete any cards that exist
	$('.card').remove();
	
	cards = cardArray;
	
	for (i in cardArray)
	{
		card = cardArray[i];
		
		drawNewCard(
			card.id,
			card.text,
			card.x,
			card.y,
			card.rot,
			card.colour,
			card.sticker
		);
	}

	boardInitialized = true;
	unblockUI();
}


//----------------------------------
// cols
//----------------------------------


function drawNewColumn (columnName, index)
{	
	var cls = "col";
	if (totalcolumns == 0)
	{
		cls = "col first";
	}
	
	$('#icon-col').before('<td class="' + cls + '" width="10%" style="display:none"><h2 id="col1" class="editable">' + columnName + '</h2></td>');
	
	$('.editable').editable( onColumnChangeRequest,
		{
			style   : 'inherit',
			id: index,
			cssclass   : 'card-edit-form',
			type      : 'textarea',
			placeholder   : 'New',
			onblur: 'submit',
			width: '',
			height: '',
			xindicator: '<img src="/scrumblr/images/ajax-loader.gif">',
			event: 'dblclick', //event: 'mouseover'
			callback: onColumnChangeResponse
		}
	);
	
	$('.col:last').fadeIn(1500);
	
	totalcolumns ++;
}

function onColumnChangeRequest( value, settings )
{
	columns[settings.id] = value;
}

function onColumnChangeResponse( value, settings )
{
	var action = "updateColumns";
	
	var data = columns;	
	sendAction(action, data);
	
	return value;
}

function displayRemoveColumn()
{
	if (totalcolumns <= 0) return false;
	
	$('.col:last').fadeOut( 150,
		function() {
			$(this).remove();
		}
	);
	
	totalcolumns --;
}

function createColumn( name )
{
	if (totalcolumns >= 8) return false;
	
	columns.push(name);	
	drawNewColumn(name,  columns.length - 1);
	
	var action = "updateColumns";
	
	var data = columns;
	
	sendAction(action, data);
}

function deleteColumn()
{
	if (totalcolumns <= 0) return false;
	
	displayRemoveColumn();
	columns.pop();
	
	var action = "updateColumns";
	
	var data = columns;
	
	sendAction(action, data);
}

function updateColumns( c )
{
	columns = c;
	
	var action = "updateColumns";
	
	var data = columns;
	
	sendAction(action, data);
}

function deleteColumns( next )
{
	//delete all existing columns:
	$('.col').fadeOut( 'slow', next() );
}

function initColumns( columnArray )
{
	totalcolumns = 0;
	columns = columnArray;
	
	$('.col').remove();
	
	for (i in columnArray)
	{
		column = columnArray[i];

		drawNewColumn(column, i);
	}


}




function changeThemeTo( theme )
{
	currentTheme = theme;
	$("link[title=cardsize]").attr("href", "/scrumblr/css/" + theme + ".css");
}


//////////////////////////////////////////////////////////
////////// NAMES STUFF ///////////////////////////////////
//////////////////////////////////////////////////////////



function setCookie(c_name,value,exdays)
{
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie=c_name + "=" + c_value;
}

function getCookie(c_name)
{
var i,x,y,ARRcookies=document.cookie.split(";");
for (i=0;i<ARRcookies.length;i++)
{
  x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
  y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
  x=x.replace(/^\s+|\s+$/g,"");
  if (x==c_name)
    {
    return unescape(y);
    }
  }
}


function setName( name )
{
	var codedName = bConnection.util.encodeString(name);
	phono.identity = codedName;

	if (name.indexOf("@") > -1)
	{
		//$(".you-image").html(bConnection.util.getGravatar(name));
	}
	
	if (phono.messaging)
	    phono.messaging.changeName(roomName, codedName);
	
	//setCookie('scrumscrum-username', codedName, 365);
}

function displayInitialUsers (users)
{
	for (i in users)
	{
		//console.log(users);
		displayUserJoined(users[i].sid, users[i].user_name);
	}
}

function displayUserJoined ( sid, hash )
{		
	var user_name = bConnection.util.decodeString(hash);		
			
	//$('#names-ul').append('<li id="user-' + sid + '">' + user_name + bConnection.util.getGravatar(user_name) + '</li>')
	$('#names-ul').append('<li id="user-' + sid + '">' + user_name + '</li>')
}

function displayUserLeft ( sid )
{
	name = '';
	if (name)
		name = user_name;
	else
		name = sid;
		
	var id = '#user-' + sid;
		
	$('#names-ul').children(id).fadeOut( 1000 , function() {
		$(this).remove();
	});
}


function updateName ( sid, name )
{
	var id = '#user-' + sid.toString();
	var hash = bConnection.util.encodeString(name);
	
	$('#names-ul').children(id).html( name + bConnection.util.getGravatar(hash) );
}

//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////

function boardResizeHappened(event, ui)
{
	var newsize = ui.size	

	sendAction( 'setBoardSize', newsize);
}

function resizeBoard (size) {
	$( ".board-outline" ).animate( { 
		height: size.height,
		width: size.width
	} );
}
//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////

function calcCardOffset() {
        var offsets = {};
        $(".card").each(function() {
                var card = $(this);
                $(".col").each(function(i) {
                        var col = $(this);
                        if(col.offset().left + col.outerWidth() > card.offset().left + card.outerWidth() || i === $(".col").size() - 1) {
                                offsets[card.attr('id')] = {
                                        col: col,
                                        x: ( (card.offset().left - col.offset().left) / col.outerWidth() )
                                } 
                                return false;
                        }
                });
        });
        return offsets;
}


//moves cards with a resize of the Board
//doSync is false if you don't want to synchronize
//with all the other users who are in this room
function adjustCard(offsets, doSync) {
        $(".card").each(function() {
				var card = $(this);
				var offset = offsets[this.id];
				if(offset) {
						var data = {
								id: this.id,
								position: {
									left: offset.col.position().left + (offset.x * offset.col.outerWidth()),
									top: parseInt(card.css('top').slice(0,-2))
								},
								oldposition: {
									left: parseInt(card.css('left').slice(0,-2)),
									top: parseInt(card.css('top').slice(0,-2))
								}
						}; //use .css() instead of .position() because css' rotate
						//console.log(data);
						if (!doSync)
						{
							card.css('left',data.position.left);
							card.css('top',data.position.top);
						}
						else
						{
							//note that in this case, data.oldposition isn't accurate since
							//many moves have happened since the last sync
							//but that's okay becuase oldPosition isn't used right now
							moveCard(card, data.position);
							sendAction('moveCard', data);
						}

				}
		});
}

//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////

$(function() {
	

	//setTimeout($.unblockUI, 2000); 


	$( "#create-card" )
		.click(function() {
			var rotation = Math.random() * 10 - 5; //add a bit of random rotation (+/- 10deg)
			uniqueID = Math.round(Math.random()*99999999); //is this big enough to assure uniqueness?
			//alert(uniqueID);
			createCard( 
				'card' + uniqueID,
				'',
			 	58, $('div.board-outline').height(),// hack - not a great way to get the new card coordinates, but most consistant ATM
			   rotation,
			   randomCardColour());
		});
		
		
		
		
	// Style changer
	$("#smallify").click(function(){
		if (currentTheme == "bigcards")
		{
			changeThemeTo('smallcards');
		}
		else if (currentTheme == "smallcards")
		{
			changeThemeTo('bigcards');
		}
		/*else if (currentTheme == "nocards")
		{
			currentTheme = "bigcards";
			$("link[title=cardsize]").attr("href", "/scrumblr/css/bigcards.css");
		}*/		
		
		sendAction('changeTheme', {theme: currentTheme});
		
	
		return false;
	});
		
		
	
	$('#icon-col').hover(
		function() {
			$('.col-icon').fadeIn(10);
		},
		function() {
			$('.col-icon').fadeOut(150);
		}
	);
	
	$('#add-col').click(
		function(){
			createColumn('New');
			return false;
		}
	);
	
	$('#delete-col').click(
		function(){
			deleteColumn();
			return false;
		}
	);
	
	
	
	$('#nosticker').click( function(){ 
	 
	 	if (phono) phono.disconnect();
	} );
	
	// $('#config-dropdown').hover( 
	// 	function(){ /*$('#config-dropdown').fadeIn()*/ },
	// 	function(){ $('#config-dropdown').fadeOut() } 
	// );
	// 
	
	
	
	$("#yourname-input").focus(function()
   {
       if ($(this).val() == 'unknown')
       {
				$(this).val("");
       }
		
		$(this).addClass('focused');

   });
   
   $("#yourname-input").blur(function()
   {
		if ($(this).val() == "")
		{
		    $(this).val('unknown');
		}
		$(this).removeClass('focused');
		
		setName($(this).val());
   });
   
	
   $("#yourname-input").blur();

	$("#yourname-li").hide();

	$("#yourname-input").keypress(function(e)
   {
    	code= (e.keyCode ? e.keyCode : e.which);
    	if (code == 10 || code == 13)
		{
				$(this).blur();
		}
    });



$( ".sticker" ).draggable({ 
	revert: true,
	zIndex: 1000
});


$( ".board-outline" ).resizable( { 
	ghost: false,
	minWidth: 700,
	minHeight: 400 ,
	maxWidth: 3200,
	maxHeight: 1800,
} );

//A new scope for precalculating
(function() {
        var offsets;
        
        $(".board-outline").bind("resizestart", function() {
                offsets = calcCardOffset();
        });
		$(".board-outline").bind("resize", function(event, ui) {
                adjustCard(offsets, false);
        });
        $(".board-outline").bind("resizestop", function(event, ui) {
                boardResizeHappened(event, ui);
                adjustCard(offsets, true);
        });
})();



$('#marker').draggable(
	{
		axis: 'x',
		containment: 'parent'
	}
);

$('#eraser').draggable(
	{
		axis: 'x',
		containment: 'parent'
	}
);


$('.reply_rollup').live('click', function()
	{
		var stream = $('div[ancestor|="' + $(this).attr("ancestor") + '"]');
		var rolledUp = $('span[ancestor|="' + $(this).attr("ancestor") + '"]');
		var rolledDown = $('a[ancestor|="' + $(this).attr("ancestor") + '"]');

		if (stream.css('display') == "none")
		{
			stream.css('display', 'block');
			rolledUp.css('display', 'none');
			rolledDown.css('display', 'block');

		} else {
			stream.css('display', 'none');
			rolledUp.css('display', 'block');
			rolledDown.css('display', 'none');
		}
	}
);


});











