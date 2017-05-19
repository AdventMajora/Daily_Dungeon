Daily Dungeon
A multiplayer randomly generated dungeon crawler.


Daily Dungeon Install instructions:

1) Get Node.js from: https://nodejs.org/ and install it.
2) Once Node is installed, open a Command Prompt window in the games root (daily_dungeon/)
3) Enter the command: "npm install". This will install the needed dependencies.
4) Once the dependencies are installed, Enter the command: "node server.js" to start the game server.
The Server will be running on your local machine, and will accessable to anyone on your network
5) To connect to the server, you need to find your machines IP. Open another Command Prompt (anywhere) and enter the command "ipconfig"
6) In the output from ipconfig, find the value labled IPv4 Address. It should look like "192.168.1.49" (but probably won't he that exactly)
7) Open your browser (Chrome or FireFox) and enter your IP, followed by ":8081". This is the port number that the server is listening on.
8) Optionally, you can configure and customize the server a bit by editing the "config.json" file.