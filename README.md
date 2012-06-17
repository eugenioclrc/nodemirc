nodemirc
========

A chat hello world written in nodejs, working demo;
http://nodejsmirc.tk/

I am trying to learn nodejs, so i came up with this helle world project.

If you want to try this in your computer remember to install socket.io using npm;

npm: http://npmjs.org/

socket.io:
$ cd /var/www/app-path
$ npm install socket.io


Remember to make this changes;
In the file index.html instead of http://184.72.254.87:8080/socket.io/socket.io.js use localhost (or your domain / local net ip);
http://localhost:8080/socket.io/socket.io.js

Also you have to change the file js/mirc.js , instead of;
socket = io.connect('http://184.72.254.87:8080');

use your domain, localhost or net ip;
socket = io.connect('http://localhost:8080');
