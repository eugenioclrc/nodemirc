var app = require('http').createServer()
  , io = require('socket.io').listen(app,{ log:false })
  , fs = require('fs');

app.listen(8080);

io.set('log level', 1); // reduce logging

try {


io.sockets.on('connection', function (socket) {
  var user=User.create(socket);
  socket.set('user_id', (user.id));
  
  socket.on('nickname', function (data) {
	  socket.get('user_id', function (err, id) {
        User.getUser(id).setNickname(data);
		socket.emit('ready');
	  });
	  
	  socket.emit('channels', Channel.channelList());
  });

  socket.on('disconnect', function () {
	  socket.get('user_id', function (err, id) {
		  console.log('desconecto '+id);
		  var u=User.getUser(parseInt(id)).disconnect();  
		  delete u;
		  u=null;
	  });
  });

  socket.on('join', function (channel_id,fn) {
    socket.get('user_id', function (err, id) {
	  var u=User.getUser(parseInt(id));
	  channel_id=parseInt(channel_id);
	  var channel=Channel.getChannel(channel_id);
	  
	  fn(channel.listUsers());
	  
	  channel.join(u);
    });
  });
  
  socket.on('leave', function (channel_id) {
	socket.get('user_id', function (err, id) {
		console.log('leave');
	    Channel.getChannel(parseInt(channel_id)).leave(parseInt(id));
	});
  });
  
  socket.on('msg', function (data) {
    socket.get('user_id', function (err, id) {
	  var u=User.getUser(parseInt(id));
	  var channel=Channel.getChannel(data.channel);
	  u.say(channel,data.msg);
    });
  });
});

Channel={
	Channels:[],
	index:0,
	getChannel: function(id){
		for(var u in this.Channels) if(this.Channels[u].id==id) return this.Channels[u];
		return null;
	},
	channelList:function(){
		  var data=[];
		  for(var c in this.Channels){
			  t=this.Channels[c];
			  data.push({id:t.id,name:t.name, count:count(t.users)});
		  }
		  return data;
	},
	id:null,
	name:null,
	users:null,
	create:function(name){
		ret=this.clone();
		this.index++;
		ret.id=this.index;
		ret.name=name;
		ret.users=[];
		this.Channels.push(ret);
		return ret;		
	},
	clone:function() {
		var obj=this;
		var copy = this.constructor();
		for (var attr in obj){
			if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
		}
		return copy;
	},
	censor:censor,
	listUsers:function(){
	  var list=[];
	  for(var h in this.users){
		list.push({id:this.users[h].id,nickname:this.users[h].nickname}); 
	  }
	  return list;
	},join:function(user){
		for(var k in this.users) if (this.users[k].id==user.id) return;
		
		this.users.push(user);
		if(!user.socket) return;
		
		user.socket.join(this.name);
		io.sockets.emit('channelupdate',{id:this.id,name:this.name,count:count(this.users)});
		user.channels.push(this);
		//user.socket.broadcast.to(this.name).emit('join',{ id:user.id,nickname:user.nickname,channel:this.id });
		io.sockets.in(this.name).emit('join',{ id:user.id,nickname:user.nickname,channel:this.id });
	},
	leave:function(id){
		for(var i in this.users){
			if(this.users[i].id==id){
				user=this.users[i];
				user.socket.leave(this.name);
				io.sockets.in(this.name).emit('leave',{ id:user.id,channel:this.id });
				delete this.users[i];
				break;
			}
		}
		
		io.sockets.volatile.emit('channelupdate',{id:this.id,name:this.name,count:count(this.users)});
	}
};

User={
	Users:[],
	index:0,
	getUser: function(id){
		for(var u in this.Users){
			if(this.Users[u].id==id) return this.Users[u];
		}
		return null;
	},
	id:null,
	socket:null,
	nickname:null,
	channels:null,
	create:function(socket){
		ret=this.clone();
		this.index++;
		ret.id=this.index;
		ret.socket=socket;
		ret.channels=new Array();
		this.Users.push(ret);
		return ret;
	},
	clone:function() {
		var copy = this.constructor();
		var obj=this;
		for (var attr in obj) if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
		
		return copy;
	},
	censor:censor,
	say:function(channel,msg){
		//chequear que el chabon esta en el canal
		io.sockets.in(channel.name).emit('msg',{ channel:channel.id,nickname:this.nickname,msg:msg });
	},
	cleanNickname:function(nickname){
	  var _nickname='';
	  var patt1=new RegExp("[a-z]|[0-9]|[A-Z]");
	  for(var j in nickname){
		  if(patt1.test(nickname[j])){
			  _nickname+=nickname[j];
		  }else{
			  _nickname+='_';
		  }
	  }
	  
	  if(_nickname.length<3){
		  _nickname=this.cleanNickname('guest_'+parseInt(Math.random(99999)*10000)).substring(0,10);
	  }
	  
	  return _nickname.replace(/[_]+/g,'_');
	},
	setNickname:function(nickname){
		this.nickname=this.cleanNickname(nickname);
	},
	getIndex:function(id){
		for(var i in this.Users) if(this.Users[i].id==this.id) return i;
		return null;
	},
	disconnect:function(){
		for(var i in this.channels) this.channels[i].leave(this.id); 
		if(i=this.getIndex(this.id))	delete this.Users[i];
	}
};


Channel.create("jujinga");
Channel.create("maduritas");
var aux=Channel.create("juventud");
var aux2=User.create();
/* joke */
aux2.nickname='@raulo';
aux.join(aux2);
/* end joke */
Channel.create("h4ckxors");

function count(arr){
	var count=0;
	for(var i in arr)		if(arr[i]!=null) count++;
	return count;
}

function censor(censor) {
	  return (function() {
	    var i = 0;

	    return function(key, value) {
	      if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value) 
	        return '[Circular]'; 

	      if(i >= 29) // seems to be a harded maximum of 30 serialized objects?
	        return '[Unknown]';

	      ++i; // so we know we aren't using the original object anymore

	      return value;  
	    };
	  })(censor);
	}

}catch(err){
	console.log('ERROR '+err);
}