// dependency npm install socket.io

socket = io.connect('http://184.72.254.87:8080');
//socket = io.connect('http://localhost:8080');

function find(array,find,compare){
	for(var i in array)if(compare(array[i],find)) return array[i];
	return null;
}
function rand( n ){
  return ( Math.floor ( Math.random ( ) * n + 1 ) );
}

IRC={
	channels:[],
	join:function(chanelLink){
		var id=chanelLink.attr('channel');
		
		exist=find(this.channels,id,function(obj,find){ return (obj.id==find);	})
		if(exist){
			exist.window.restore();
			exist.window.select();
			return;
		}
		
		
		console.log('joining to '+id);
		socket.emit('join', id,function (users) {
			// en users estan los datos de la sala
		      listusers='';
		      for(var k in users){
		    	  listusers+='<a userid="'+users[k].id+'">'+users[k].nickname+'</a>';
		      }
		      var room=$('<div class="channelcontainer"><table class="chatroom"><tr><td class="room"></td><td class="users">'+listusers+'</td></tr></table><div><div class="input"><input name="chat" type="text" placeholder="Escribe tu mensaje aqui" /></div>');
		      
		      $('.users',room).on('click','a',function(){
		        var hasClass=$(this).hasClass('sel');
		    	$('a',$(this).parent()).removeClass('sel');
			  	if(!hasClass)$(this).addClass('sel');
			  }).on('dblclick','a',function(){ /* TODO private msg */ });
			  
			  $("input",room).keypress(function(event) {
				  if ( event.which == 13 ) { 
					  if($(this).val()!='') socket.emit('msg', { channel:id,msg:$(this).val()});
					  $(this).val('');
					  event.preventDefault(); 
				  }
			  });

			  
			  		      
			  var w=$.window({
			  	title: $('b',chanelLink).html(),
			  	content: room,
			  	selectedHeaderClass:'focused',
			  	checkBoundary: true,
			  	onClose: function(wnd) {
			  		socket.emit('leave', id);
			  		for(var k in IRC.channels) if (IRC.channels[k].id==id) delete IRC.channels[k];
			  	},
			  	onSelect:function(){
			  		$('input',this.content).focus();
			  	},
			  	maximizable: false,
			  	x:rand($(window).width()-420),
			  	y:rand($(window).height()-300),
			  	showRoundCorner: true,
			  });
					
			IRC.channels.push({
				id:id,
				window:w,
				roomcontent:room
			})
	    });
	}
}
  
  function renderChannels(channels){
	  var html='';
	  for(var k in channels){
		  if(typeof channels[k].count =='undefined') channels[k].count=0;
		  html+='<a channel="'+channels[k].id+'"><b>'+channels[k].name+'</b> <span>'+channels[k].count+'</span></a>';
	  }
	  
	  canales=$('<div id="channels">'+html+'</div>').on('click','a',function(){
		  var hasClass=$(this).hasClass('sel');
		  $('a',$(this).parent()).removeClass('sel');
	  	  if(!hasClass) $(this).addClass('sel');
	  }).on('dblclick','a',function(){ IRC.join($(this)); });
	  
	  $.window({
	   		//icon: 'http://www.fstoke.me/favicon.ico',
	   		title: "Canales",
	   		content: canales,
	   		selectedHeaderClass:'focused',
	   		checkBoundary: true,
	   		x:0,
	   		y:0,
	   		showFooter: false,
   			showRoundCorner: true,
	   		closable: false
		});
  }
  
  
  socket.on('connect', function () {
	  $("#first").show();
	  $("#first>div>form").submit(function(){
		  socket.emit('nickname', $("#nickname").val());
		  $("#first").hide();
		  return false;
	  });
  })
  
  socket.on('msg', function(data){
	  var channel=find(IRC.channels,data.channel,function(obj,find){ return (obj.id==find); });
		var room=$('.room',channel.window.getContainer());
		
		var pHeight=$("p",room).height();
		var pLen=$("p",room).length;
		
		scrollToBottom=false;
		if($("p:last",room).length!=0){
			if(room.scrollTop()+room.height()-(pHeight*pLen)>-6){
				scrollToBottom=true;
			}
		}
		
		msg=$('<div>').text(data.msg);
		msg=msg.html();
		room.append('<p><span>&lt;'+data.nickname+'&gt;</span> '+msg+'</p>');
				
	
	if(scrollToBottom) room.scrollTop(pHeight*(pLen+1));
	
  });
  
  socket.on('join', function(data){
	console.log(data);
	var channel=find(IRC.channels,data.channel,function(obj,find){ return (obj.id==find); });
	$('.users',channel.window.getContainer()).append('<a userid="'+data.id+'">'+data.nickname+'</a>');
  });
  
  socket.on('leave', function(data){
	  var channel=find(IRC.channels,data.channel,function(obj,find){ return (obj.id==find); });
	  $('.users a[userid='+data.id+']',channel.window.getContainer()).remove();
  })
  
  
  socket.on('channels', renderChannels);
  socket.on('channelupdate',function(data){
	$("#channels a[channel="+data.id+"] span").html(data.count);
  })
  
  $(document).ready(function(){
	  $.window.prepare({
	   dock: 'bottom',       // change the dock direction: 'left', 'right', 'top', 'bottom'
	   animationSpeed: 200,  // set animation speed
	   minWinLong: 180       // set minimized window long dimension width in pixel
	});
  })
