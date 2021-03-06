/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                           *
 *  SERVER					                                                 *
 *  by Elen Norvell                                                          *
 *                                                                           *
 *  The Daily Dungeon game server. Simulates the game logic, and exposes     *
 *  API's for clients to read data and provide player input.		         *
 * 	Settings are defined in "config.json"                					 *
 *                                                                           *
 *  run with: node server.js												 *	
 *                                                                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

//dependencies/external files
var express = require('express');			//express framework
var fs = require('fs');						//file system
var async = require('async');				//async
var xml2js = require('xml2js');				//library to read xml files
var _ = require('cloneextend');				//deep copy
var body_parser = require('body-parser');	//middleware for express
var config = require("./config.json");		//server/game config
var data_0 = require('./data_0');				//resource containing color palette and basic room data
var data_entities = require('./data_entities');	//resource containing data for in-game entities
var data_augments = require('./data_augments');	//resource containing data for power-ups
var data_weapons = require('./data_weapons');	//resource containing data for weapons
var data_mobs = require('./data_mobs.js');		//resource containing data for mobs
var data_player = require('./player.js');		//resource containing data for player
var files = fs.readdirSync('./assets/rooms');					//list pre-made rooms (not inside or outside)
var inside_files = fs.readdirSync('./assets/rooms/inside');		//list of pre-made "inside" rooms
var outside_files = fs.readdirSync('./assets/rooms/outside');	//list of pre-made "outside" rooms

console.log(config);	//log out the config at the server startup

//constants
const tile_size = 8;		//tile size (px)
const screen_width = 160;	//Game Resolution Width (px)
const screen_height = 144;	//Game Resolution Height (px)

//tile map configs (converted from xml)
var configs_all = [];		//list of non inside-outside pre-made room configs
var configs_inside = [];	//list of inside room configs
var configs_outside = [];	//list of outside room configs
var room_data,inside_data,outside_data;

var player_list = [];		//list of all player objects
var players_updating = [];	//list of currenlty updating players
var active_rooms = [];		//list of rooms where at least 1 playe is currently residing

if (config.base_seed == -1) {	//if no seed was provided, generate a new one
	config.base_seed = Math.floor(Math.random()*1000000);
}
var seed = config.base_seed;	//current permutation of base_seed

//level vars
var start_room = {x:0,y:0};	//location of the starting room
var boss_room = {x:0, y:0};	//location of the boss room
var mobs_remaining = 0;		//total living mobs in the level
var map = [];				//the entire game world/level consisting of all existing rooms and their contents
var difficulty = config.starting_difficuly;	//difficulty of the game

//game loop vars
var start_time;		//start time of frame
var end_time;		//end time of frame
var cycle_time;		//total time a frame took
var delay_time;		//delay needed until next frame
var new_room;		//used in seeing what rooms need to be updated
var coords;			//used in picking a room to update
var local_players;	//list of players local to a room

//express vars
var app = express();				//express server
var work_dir = __dirname;			//working directory
var parser = new xml2js.Parser();	//for parsing the Tiled maps

main();	//kick off everything

//main function. Build the level, start the event loop, start the server
function main() {
	build_configs(function() {
		console.log('Base Seed: '+config.base_seed);

		buildLevel(config.level_size);	//build level
		main_loop();	//start event loop

		//setup and start start the server
		app.use(express.static(__dirname));
		app.use(body_parser.json());
		var server = require('http').createServer(app).listen(8081);
		console.log('Server running!');
	});
}


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                           *
 *  BUILD ROOM CONFIGS                                                       *
 *                                                                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

//reads in the Tiled map data, and converts it into usable configs
function build_configs(my_callback) {
	console.log('Building configs...');
	async.parallel([
		
		function (callback) {	//read all the "not inside or outside" room files and convert them to configs
			async.eachSeries(files, function(file_name, callback) {
				if (file_name.indexOf('.tmx') > -1) {	//target the Tiled map files
					console.log(file_name);
					var data = fs.readFileSync(__dirname + '/assets/rooms/'+file_name);	//grab the data
					parser.parseString(data, function (err, result) {
						configs_all.push({
							name: file_name.substring(0,file_name.length-4),
							map: [
								result.map.layer[0].data[0]._.replace(/\r\n/g,'').split(','),
								result.map.layer[1].data[0]._.replace(/\r\n/g,'').split(','),
								result.map.layer[2].data[0]._.replace(/\r\n/g,'').split(',')
							]
						});
						callback();
					});
				} else {	//not a Tiled map, skip it
					callback();
				}	
			}, function() {	//when done iterating through, convert the data to string
				room_data = "var configs = [\n"
				for (var i=0; i<configs_all.length; i++) {
					room_data+='\t'+JSON.stringify(configs_all[i])+',\n'
				}
				room_data+="];";
				callback();
				//fs.writeFileSync('configurations.js', file_data);
			});
		},
		
		function (callback) {	//read all the "inside" room files and convert them to configs
			async.eachSeries(inside_files, function(file_name, callback) {
				if (file_name.indexOf('.tmx') > -1) {	//target Tiled map files
					console.log(file_name);
					var data = fs.readFileSync(__dirname + '/assets/rooms/inside/'+file_name);	//grab the data
					parser.parseString(data, function (err, result) {
						configs_inside.push({
							name:file_name.substring(0,file_name.length-4),
							map: [
								result.map.layer[0].data[0]._.replace(/\r\n/g,'').split(','),
								result.map.layer[1].data[0]._.replace(/\r\n/g,'').split(','),
								result.map.layer[2].data[0]._.replace(/\r\n/g,'').split(',')
							]
						});
						callback();
					});
				} else {
					callback();
				}	
			}, function() {	//when done iterating through, conver the data to string
				inside_data = "var inside_configs = [\n"
				for (var i=0; i<configs_inside.length; i++) {
					inside_data+='\t'+JSON.stringify(configs_inside[i])+',\n'
				}
				inside_data+="];";
				callback();
				//fs.writeFileSync('configurations.js', file_data);
			});
		},
		
		function (callback) {	//read all the "outside" room files and convert them to configs
			async.eachSeries(outside_files, function(file_name, callback) {
				if (file_name.indexOf('.tmx') > -1) {	//target Tiled map files
					console.log(file_name);
					var data = fs.readFileSync(__dirname + '/assets/rooms/outside/'+file_name);	//grab the data
					parser.parseString(data, function (err, result) {
						configs_outside.push({
							name:file_name.substring(0,file_name.length-4),
							map: [
								result.map.layer[0].data[0]._.replace(/\r\n/g,'').split(','),
								result.map.layer[1].data[0]._.replace(/\r\n/g,'').split(','),
								result.map.layer[2].data[0]._.replace(/\r\n/g,'').split(',')
							]
						});
						callback();
					});
				} else {
					callback();
				}	
			}, function() {	//when done iterating through, convert the data to string 
				outside_data = "var outside_configs = [\n"
				for (var i=0; i<configs_outside.length; i++) {
					outside_data+='\t'+JSON.stringify(configs_outside[i])+',\n'
				}
				outside_data+="];";
				callback();
				//fs.writeFileSync('configurations.js', file_data);
			});
		}
	],function() {	//finally, write all the data to the configuarations file!
		var final_data = room_data+"\n"+inside_data+"\n"+outside_data;
		fs.writeFileSync('configurations.js',final_data);
		my_callback();
	});
}

//fetch a room config
function buildConfig(config_name, list) {
	var formatted_config = [[],[],[]];
	var layer = [];
	for (var i=0; i<list.length; i++) {
		if (config_name == list[i].name) {
			for (var l=0; l<3; l++) {
				for (var j=0; j<16; j++) {
					layer = [];
					for (var k=0; k<20; k++) {
						layer.push(list[i].map[l][(j*20)+k]);
					}
					formatted_config[l].push(layer);
				}
			}
		}
	}
	return formatted_config;
}


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                           *
 *  GENERATE THE LEVEL                                                       *
 *                                                                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
function buildLevel(size, prev) {
	
	var emptList = [];          //holds the list of "data_0.empty" rooms needing to be expanded from
	var rand;                   //for RNG
	var i,j,k;                  //iterators
	var genIndex = 0;           //iterator for number of generations
	var minRooms = 3+size;      //the minimum required number of rooms (for the current build)
	var numRooms = 0;           //the current number of rooms in the map (for the current build)
	var numAugs = 0;			//number of powerups added to the map
	var numChests = 0;			//number of chests added to the map
	var numKeys = 0;			//number of keys added to the map
	var floor_pal = [190];		//list of base tiles available for the floor pallettes in this level (always has 190)
	var pos_floors = [			//list of available base floor tiles to pic from
		191,192,				//190 is part of the 190's set of three, but is used in every floor
		222,223,224,
		254,255,256
	];
	var wall_pal = 0;			//indicates the wallset for this level
	var floor_style = 0;		//indicates the floor style for this level
	var lvl_pal = 0;			//indicates the color pallette for this level
	var genned_obstacles = [	//tiles for types of generated obstacles
		285,
		317
	];
	
	//pick a type of generatable object to use when generating room obstacles
	var fancy_genned_obstacles = Math.floor(sRandom()*config.fancy_genned_obstacles_available)*2;
	
	if (prev == null) {	//if we aren't working off of a previously made map
		start_room = {x:1, y:1};	//default the starting room to 1,1
		map = [	//initialize the map (a single empty room surrounded by nothing)
			[0,			0,			0],
			[0,		data_0.empty,	0],
			[0,			0,			0]
		];
	}
	
	wall_pal = Math.floor(sRandom()*config.walls_available)*4;	//pick a tile set for the walls
	
	switch (wall_pal) {	//adjust the genned obsticals to match the wall set (ie: no trees in buildings)
		case	0:	fancy_genned_obstacles = 1*2;
					break;
		case	4:	fancy_genned_obstacles = 0*2;
					break;
		case	8:	fancy_genned_obstacles = 2*2;
					break;
		case	12:	fancy_genned_obstacles = 2*2;
					break;
		case	16:	fancy_genned_obstacles = 1*2;
					break;
	}
	
	//make a floor palette
	floor_style = wall_pal;	//pick a tile set for the floor (this equals the wall set, otherwise they would mismatch) 
	for (i=0; i<2; i++) {
		rand = Math.floor(sRandom()*pos_floors.length);	//pick random tile
		floor_pal.push(pos_floors[rand]);	//add to working pallette
		pos_floors.splice(rand, 1);			//remove tile (so no repeats)
	}				
	floor_pal.push(286+Math.floor(sRandom()*3));	//pick an animated tile
	
	lvl_pal = Math.floor(sRandom()*data_0.pals.length-1)+1;	//pick a color pallette	
	
	//adjust the genned obstacles [Note, figure out why I do this. I forgot]
	for (i=0; i< genned_obstacles.length; i++) {
		genned_obstacles[i] = genned_obstacles[i]-wall_pal;
	}
	
	mobs_remaining = 0;	//reset the remaining mobs
	
	function expandMap(y, x) {	//expands the map by one row or column
		
		if (y == 0) {	//top edge -> insert new row before
			var newRow = [];
			for (c=0; c<map[0].length; c++) {
				newRow.push(0);
			}
			map.unshift(newRow);
			start_room.y++;
			if (prev != null) {
				for (var q=0; q<player_list.length; q++) {
					if (player_list[i] != null) {
						player_list[i].data.y_map++;
					}
				}
			}
			for (c=0; c<emptList.length; c++) {
				emptList[c].y++;
			}
		}
		if (x == 0) {	//left edge -> insert new column before
			for (c=0; c<map.length; c++) {
				map[c].unshift(0);
			}
			start_room.x++;
			if (prev != null) {
				for (var q=0; q<player_list.length; q++) {
					if (player_list[i] != null) {
						player_list[i].data.x_map++;
					}
				}
			}
			for (c=0; c<emptList.length; c++) {
				emptList[c].x++;
			}
		}
		if (y == map.length-1) {	//bottom edge -> insert new row after
			var newRow = [];
			for (c=0; c<map[0].length; c++) {
				newRow.push(0);
			}
			map.push(newRow);
		}
		if (x == map[emptList[j].y].length-1) {	//right edge -> insert new column after
			for (c=0; c<map.length; c++) {
				map[c].push(0);
			}
		}
	} 
	
	function genFloor(y, x, style) {	//generates a floor
		
		var floorRow = [];	//row used to construct full floor map
		var floorRand;	//rand
		for (var k=0; k<16; k++) {
			floorRow = [];
			for (var l=0; l<20; l++) {
				
				floorRand = Math.floor(sRandom()*8);	//roll for floor tile
				
				if (floorRand == 0) {
					floorRow.push(floor_pal[3]);
				}
				if (floorRand == 1 || floorRand == 2) {
					floorRow.push(floor_pal[1]);
				}
				if (floorRand == 3 || floorRand == 4) {
					floorRow.push(floor_pal[2]);
				}
				if (floorRand > 4) {
					floorRow.push(floor_pal[0]);
				}
			}
			map[y][x].map[0][k] = (JSON.parse(JSON.stringify(floorRow)));	//apply the genned floor
		}
	}
	
	function genRoom(y, x) {	//generates a room of obstacles
		
		var claimed_spots = [];		//list of occupied tiles
		var expansion_points = [];	//list of tiles eligible to be expanded from
		var starting_spots = [];	//list of spots that must be open for players to enter the room
		var min_expansions = 8;		//minimum number of expansions a room must gro through
		
		//fill the room with random genned obstacles
		if (map[y][x].open == false) {	//inside
			for (var c=2; c <18; c++) {
				for (var d=2; d<14; d++) {
					map[y][x].map[1][d][c] = genned_obstacles[Math.floor(sRandom()*genned_obstacles.length)];
				}
			}
			//check for edges with doors (configs of length 2)
			if (map[y][x].config[0].length == 2) {
				clear_area(y,x,2,8,4,4,claimed_spots);	//clear the area of obstacles
				claimed_spots.push(JSON.stringify({x:8,y:2}));	//note the spot as claimed
				starting_spots.push({x:8,y:2});	//note the spot as starting
			}
			if (map[y][x].config[1].length == 2) {
				clear_area(y,x,6,2,4,4,claimed_spots);	//clear the area of obstacles
				claimed_spots.push(JSON.stringify({x:2,y:6}));	//note the spot as claimed
				starting_spots.push({x:2,y:6});	//note the spot as starting
			}
			if (map[y][x].config[2].length == 2) {
				clear_area(y,x,10,8,4,4,claimed_spots);	//clear the area of obstacles
				claimed_spots.push(JSON.stringify({x:8,y:10}));	//note the spot as claimed
				starting_spots.push({x:8,y:10});	//note the spot as starting
			}
			if (map[y][x].config[3].length == 2) {
				clear_area(y,x,6,14,4,4,claimed_spots);	//clear the area of obstacles
				claimed_spots.push(JSON.stringify({x:14,y:6}));	//note the spot as claimed
				starting_spots.push({x:14,y:6});	//note the spot as starting
			}
			
		} else {	//outisde
			for (var c=1; c <19; c++) {
				for (var d=1; d<15; d++) {
					map[y][x].map[1][d][c] = genned_obstacles[Math.floor(sRandom()*genned_obstacles.length)];
				}
			}
			
			//door openings
			if (map[y][x].config[0].length == 2) {
				clear_area(y,x,1,8,4,4,claimed_spots);	//clear the area of obstacles
				claimed_spots.push(JSON.stringify({x:8,y:1}));	//note the spot as claimed
				starting_spots.push({x:8,y:1});
			}
			if (map[y][x].config[1].length == 2) {
				clear_area(y,x,6,1,4,4,claimed_spots);	//clear the area of obstacles
				claimed_spots.push(JSON.stringify({x:1,y:6}));	//note the spot as claimed
				starting_spots.push({x:1,y:6});	//note the spot as starting
			}
			if (map[y][x].config[2].length == 2) {
				clear_area(y,x,11,8,4,4,claimed_spots);	//clear the area of obstacles
				claimed_spots.push(JSON.stringify({x:8,y:11}));	//note the spot as claimed
				starting_spots.push({x:8,y:11});	//note the spot as starting
			}
			if (map[y][x].config[3].length == 2) {
				clear_area(y,x,6,15,4,4,claimed_spots);	//clear the area of obstacles
				claimed_spots.push(JSON.stringify({x:15,y:6}));	//note the spot as claimed
				starting_spots.push({x:15,y:6});	//note the spot as starting
			}
			
			//open rooms have large opnenings as well as door openings
			if (map[y][x].config[0].length > 2) {
				clear_area(y,x,1,1,2,18,claimed_spots);	//clear the area of obstacles
				claimed_spots.push(JSON.stringify({x:1,y:1}));	//note the spot as claimed
				starting_spots.push({x:1,y:1});	//note the spot as starting
			}
			if (map[y][x].config[1].length > 2) {
				clear_area(y,x,1,1,14,2,claimed_spots);	//clear the area of obstacles
				claimed_spots.push(JSON.stringify({x:1,y:1}));	//note the spot as claimed
				starting_spots.push({x:1,y:1});	//note the spot as starting
			}
			if (map[y][x].config[2].length > 2) {	//note the spot as starting
				clear_area(y,x,13,1,2,18,claimed_spots);	//clear the area of obstacles
				claimed_spots.push(JSON.stringify({x:1,y:13}));	//note the spot as claimed
				starting_spots.push({x:1,y:13});	//note the spot as starting
			}
			if (map[y][x].config[3].length > 2) {
				clear_area(y,x,1,17,14,2,claimed_spots);	//clear the area of obstacles
				claimed_spots.push(JSON.stringify({x:17,y:1}));	//note the spot as claimed
				starting_spots.push({x:17,y:1});	//note the spot as starting
			}
		}
		
		//while we haven't met the minimum expansions and the starting spots aren't reachable from each other,
		while (!check_connection(y,x,starting_spots) || min_expansions > 0) {
			var expansion_radius = 2;
			
			//build a list of expansion points 
			for (var c=0; c<claimed_spots.length; c++) {
				expansion_points = expansion_points.concat(get_expansions(JSON.parse(claimed_spots[c]),expansion_radius));
			}
			//thin out selection. Remove repeats, claimed spots, and empty spots
			for (var c=0; c<expansion_points.length; c++) {
				if (expansion_points.indexOf(expansion_points[c]) != c || claimed_spots.indexOf(expansion_points[c]) >= 0 || map[y][x].map[1][JSON.parse(expansion_points[c]).y][JSON.parse(expansion_points[c]).x] == 0) {
					expansion_points.splice(c,1);
					c--;
				}
			}
			
			//exit if we have 0 expansion points
			if (expansion_points.length < 1) {
				break;
			}
			
			var rand_spot = Math.floor(sRandom()*expansion_points.length);	//pick a random expansion point to expand
			var expansion_size = Math.floor((sRandom()*3)+2);	//roll for a size
			claimed_spots.push(expansion_points[rand_spot]);	//claim the spot
			//expand/clear out the obstacles
			clear_area(y,x,JSON.parse(expansion_points[rand_spot]).y,JSON.parse(expansion_points[rand_spot]).x,expansion_size,expansion_size, claimed_spots);
			min_expansions--;
		}
		
		//build the fancy genned obstacles
		if (map[y][x].open == false) {	//inside
			for (var c=2; c <17; c++) {
				for (var d=2; d<14; d++) {
					/*if (map[y][x].map[1][d][c] == 441 && map[y][x].map[1][d][c+1] == 441 && Math.floor(sRandom()*3) == 0) {
						map[y][x].map[1][d][c] = 391;
						map[y][x].map[1][d][c+1] = 392;
						if (d-1 >= 2) {
							map[y][x].map[2][d-1][c] = 359;
							map[y][x].map[2][d-1][c+1] = 360;
						}
						if (d-2 >= 2) {
							map[y][x].map[2][d-2][c] = 327;
							map[y][x].map[2][d-2][c+1] = 328;
						}
						if (d-3 >= 2) {
							map[y][x].map[2][d-3][c] = 295;
							map[y][x].map[2][d-3][c+1] = 295;
						}					
					}*/
				}
			}
		} else {	//outside
			for (var c=1; c <18; c++) {
				for (var d=1; d<15; d++) {
					if (genned_obstacles.indexOf(map[y][x].map[1][d][c]) > -1 && 
						genned_obstacles.indexOf(map[y][x].map[1][d][c+1]) > -1 && 
						genned_obstacles.indexOf(map[y][x].map[1][d+1][c]) > -1 && 
						genned_obstacles.indexOf(map[y][x].map[1][d+1][c+1]) > -1 && 
						sRandom() < config.fancy_genned_obstacle_probability ) {
						
						//tree base
						map[y][x].map[1][d][c] = 528-fancy_genned_obstacles;
						map[y][x].map[1][d][c+1] = 529-fancy_genned_obstacles;						
						map[y][x].map[1][d+1][c] = 560-fancy_genned_obstacles;
						map[y][x].map[1][d+1][c+1] = 561-fancy_genned_obstacles;
						/*map[y][x].map[0][d][c] = 444;
						map[y][x].map[0][d][c+1] = 444;						
						map[y][x].map[0][d+1][c] = 444;
						map[y][x].map[0][d+1][c+1] = 444;*/
						if (d-1 >= 0) {
							map[y][x].map[2][d-1][c] = 496-fancy_genned_obstacles;
							map[y][x].map[2][d-1][c+1] = 497-fancy_genned_obstacles;
						}
						if (d-2 >= 0) {
							map[y][x].map[2][d-2][c] = 464-fancy_genned_obstacles;
							map[y][x].map[2][d-2][c+1] = 465-fancy_genned_obstacles;
						}
					}
				}
			}
		}
	}
	
	//clears an area of a map of obstacles
	function clear_area(map_y,map_x,room_y,room_x, width, length, claimed) {
		for (var c=0; c<width; c++) {
			for (var d=0; d<length; d++) {
				if (room_y+c <16 && room_x+d<20 && room_y+c>=0 && room_x+d>=0) {
					if (genned_obstacles.indexOf(map[map_y][map_x].map[1][room_y+c][room_x+d]) > -1) {
						map[map_y][map_x].map[1][room_y+c][room_x+d] = 0;
						claimed.push(JSON.stringify({x: room_x+d,y: room_y+c}));
					}
				}
			}
		}
	}
	
	//checks to see if all starting points are reachable from map_x,map_y
	function check_connection(map_y, map_x, starting_points) {
		var contiguous_spots = [];	//list of contiguous tiles (like a path)
		var spots_to_check = [];	//list of spots to check
		
		var rand_start = Math.floor(sRandom()*starting_points.length);
		
		spots_to_check.push(JSON.stringify(starting_points[rand_start]));	//start with the starting points
		
		while(spots_to_check.length != 0) {	//check for every starting spot
			var found_points = [];
			var spot_to_check = JSON.parse(spots_to_check[0]);
			if (spot_to_check.y-1 >=1) {	//upper bound check
				if (map[map_y][map_x].map[1][spot_to_check.y-1][spot_to_check.x] == 0 && 
					contiguous_spots.indexOf(JSON.stringify({x:spot_to_check.x, y:spot_to_check.y-1})) < 0 && 
					spots_to_check.indexOf(JSON.stringify({x:spot_to_check.x, y:spot_to_check.y-1})) < 0) {
					
					spots_to_check.push(JSON.stringify({x:spot_to_check.x,y:spot_to_check.y-1}));
				}
			}
			if (spot_to_check.x-1 >=1) {	//left bound check
				if (map[map_y][map_x].map[1][spot_to_check.y][spot_to_check.x-1] == 0 && 
					contiguous_spots.indexOf(JSON.stringify({x:spot_to_check.x-1,y:spot_to_check.y})) < 0 &&
					spots_to_check.indexOf(JSON.stringify({x:spot_to_check.x-1,y:spot_to_check.y})) < 0) {
					
					spots_to_check.push(JSON.stringify({x:spot_to_check.x-1,y:spot_to_check.y}));
				}
			}
			if (spot_to_check.y+1 <=14) {	//lower bound check
				if (map[map_y][map_x].map[1][spot_to_check.y+1][spot_to_check.x] == 0 && 
					contiguous_spots.indexOf(JSON.stringify({x:spot_to_check.x,y:spot_to_check.y+1})) < 0 &&
					spots_to_check.indexOf(JSON.stringify({x:spot_to_check.x,y:spot_to_check.y+1})) < 0) {
					
					spots_to_check.push(JSON.stringify({x:spot_to_check.x,y:spot_to_check.y+1}));
				}
			}
			if (spot_to_check.x+1 <=18) {	//right bound check
				if (map[map_y][map_x].map[1][spot_to_check.y][spot_to_check.x+1] == 0 && 
					contiguous_spots.indexOf(JSON.stringify({x:spot_to_check.x+1,y:spot_to_check.y})) < 0 &&
					spots_to_check.indexOf(JSON.stringify({x:spot_to_check.x+1,y:spot_to_check.y})) < 0) {
					
					spots_to_check.push(JSON.stringify({x:spot_to_check.x+1,y:spot_to_check.y}));
				}
			}
			contiguous_spots.push(spots_to_check[0]);
			spots_to_check.splice(0,1);
		}
		
		var connected = true;
		for (var c=0; c<starting_points.length; c++) {
			if (contiguous_spots.indexOf(JSON.stringify(starting_points[c])) < 0) {
				connected = false
			}
		}
		return connected;
	}
	
	//get a list of points to expand from
	function get_expansions(point, radius) {
		var points = [];
		for (var c=-(radius-2); c<(radius-1); c++) {
			if (point.x+c <18 && point.x+c >= 2) {
				if (point.y+(radius-1) < 14) {
					points.push(JSON.stringify({x:point.x+c,y:point.y+(radius-1)}));
				}
				if (point.y-(radius-1) >=2) {
					points.push(JSON.stringify({x:point.x+c,y:point.y-(radius-1)}));
				}
			}
		}
		for (var c=-(radius-2); c<(radius-1); c++) {
			if (point.y+c <14 && point.y+c >= 2) {
				if (point.x+(radius-1) < 18) {
					points.push(JSON.stringify({x:point.x+(radius-1),y:point.y+c}));
				}
				if (point.x-(radius-1) >=2) {
					points.push(JSON.stringify({x:point.x-(radius-1),y:point.y+c}));
				}
			}
		}
		return points;
	}
	
	
	//map generation. This builds out the map with basic rooms, and configures thier styling
	console.log("expanding map...");
	for (i=0; i<size; i++) {	//generate/expand for the number of iterations requested
		
		//build list of expandable rooms (dead end rooms or empty)
		for (j=0; j<map.length; j++) {
			for (k=0; k<map[j].length; k++) {
				if (map[j][k].type == 'empty' ||
					JSON.stringify(map[j][k].config) == JSON.stringify(data_0.base_1.config) ||
					JSON.stringify(map[j][k].config) == JSON.stringify(data_0.base_2.config) ||
					JSON.stringify(map[j][k].config) == JSON.stringify(data_0.base_3.config) ||
					JSON.stringify(map[j][k].config) == JSON.stringify(data_0.base_4.config) ||
					JSON.stringify(map[j][k].config) == JSON.stringify(data_0.open_40.config) ||
					JSON.stringify(map[j][k].config) == JSON.stringify(data_0.open_48.config) ||
					JSON.stringify(map[j][k].config) == JSON.stringify(data_0.open_56.config) ||
					JSON.stringify(map[j][k].config) == JSON.stringify(data_0.open_64.config)) {
					
					emptList.push({x:k, y:j});
				}
			}
		}
		
		//expand every expandable room in list
		for (j=0; j<emptList.length; j++) {
			
			//check configs of surrounding rooms;
			var matchConfig = [];	//configuration to match
			
			if (map[emptList[j].y-1][emptList[j].x] == 0) {   //above
				matchConfig.push(2);
			} else {
				matchConfig.push(map[emptList[j].y-1][emptList[j].x].config[2]);
			}
			if (map[emptList[j].y][emptList[j].x-1] == 0) {   //left
				matchConfig.push(2);
			} else {
				matchConfig.push(map[emptList[j].y][emptList[j].x-1].config[3]);
			}
			if (map[emptList[j].y+1][emptList[j].x] == 0) {   //below
				matchConfig.push(2);
			} else {
				matchConfig.push(map[emptList[j].y+1][emptList[j].x].config[0]);
			}
			if (map[emptList[j].y][emptList[j].x+1] == 0) {   //right
				matchConfig.push(2);
			} else {
				matchConfig.push(map[emptList[j].y][emptList[j].x+1].config[1]);
			}

			//build list of applicable rooms
			var appList = [];
			for (k=0; k<data_0.rooms.length; k++) {
				if ((JSON.stringify(data_0.rooms[k].config[0]) == JSON.stringify(matchConfig[0]) || matchConfig[0] == 2) &&
					(JSON.stringify(data_0.rooms[k].config[1]) == JSON.stringify(matchConfig[1]) || matchConfig[1] == 2) &&
					(JSON.stringify(data_0.rooms[k].config[2]) == JSON.stringify(matchConfig[2]) || matchConfig[2] == 2) &&
					(JSON.stringify(data_0.rooms[k].config[3]) == JSON.stringify(matchConfig[3]) || matchConfig[3] == 2)) {
					 
					appList.push(JSON.parse(JSON.stringify(data_0.rooms[k])));
					
				}
			}
			
			//pick a room
			rand = Math.floor(sRandom()*appList.length);
			map[emptList[j].y][emptList[j].x] = JSON.parse(JSON.stringify(appList[rand]));
			numRooms++;
			
			//make a floor for the new room here
			genFloor(emptList[j].y, emptList[j].x);
			
			//config styling
			map[emptList[j].y][emptList[j].x].wall_style = wall_pal;
			map[emptList[j].y][emptList[j].x].floor_style = floor_style;
			map[emptList[j].y][emptList[j].x].palette = lvl_pal;
			
			//create new empty's
			if (appList[rand].config[0].length > 0 && map[emptList[j].y-1][emptList[j].x] == 0) {
				map[emptList[j].y-1][emptList[j].x] = JSON.parse(JSON.stringify(data_0.empty));
				expandMap(emptList[j].y-1, emptList[j].x);
			}
			if (appList[rand].config[1].length > 0 && map[emptList[j].y][emptList[j].x-1] == 0) {
				map[emptList[j].y][emptList[j].x-1] = JSON.parse(JSON.stringify(data_0.empty));
				expandMap(emptList[j].y, emptList[j].x-1);
			}
			if (appList[rand].config[2].length > 0 && map[emptList[j].y+1][emptList[j].x] == 0) {
				map[emptList[j].y+1][emptList[j].x] = JSON.parse(JSON.stringify(data_0.empty));
				expandMap(emptList[j].y+1, emptList[j].x);
			}
			if (appList[rand].config[3].length > 0 && map[emptList[j].y][emptList[j].x+1] == 0) {
				map[emptList[j].y][emptList[j].x+1] = JSON.parse(JSON.stringify(data_0.empty));
				expandMap(emptList[j].y, emptList[j].x+1);
			}
		}
		
		emptList = [];	//reset expandable list
		if (numRooms < minRooms) {
			i--;
		}
	}
	console.log("expansions done...");
	
	//done expanding/building out the map. Now we gotta put stuff in it
	
	//cap off the remaining empties with dead end rooms. This way we have
	//build list of remaining empties
	for (j=0; j<map.length; j++) {
		for (k=0; k<map[j].length; k++) {
			if (map[j][k].type == 'empty') {
				emptList.push({x:k, y:j});
			}
		}
	}
	
	for (j=0; j<emptList.length; j++) {
		if (map[emptList[j].y][emptList[j].x].type == 'empty') {
			var capConfig = [];
	
			if (map[emptList[j].y-1][emptList[j].x] == 0) {   //above
				capConfig.push([]);
			} else {
				capConfig.push(map[emptList[j].y-1][emptList[j].x].config[2]);
			}
			if (map[emptList[j].y][emptList[j].x-1] == 0) {   //left
				capConfig.push([]);
			} else {
				capConfig.push(map[emptList[j].y][emptList[j].x-1].config[3]);
			}
			if (map[emptList[j].y+1][emptList[j].x] == 0) {   //below
				capConfig.push([]);
			} else {
				capConfig.push(map[emptList[j].y+1][emptList[j].x].config[0]);
			}
			if (map[emptList[j].y][emptList[j].x+1] == 0) {   //right
				capConfig.push([]);
			} else {
				capConfig.push(map[emptList[j].y][emptList[j].x+1].config[1]);
			}
			
			//build list of applicable rooms
			var capList = [];
			for (k=0; k<data_0.rooms.length; k++) {
				if ((JSON.stringify(data_0.rooms[k].config[0]) == JSON.stringify(capConfig[0])) &&
					(JSON.stringify(data_0.rooms[k].config[1]) == JSON.stringify(capConfig[1])) &&
					(JSON.stringify(data_0.rooms[k].config[2]) == JSON.stringify(capConfig[2])) &&
					(JSON.stringify(data_0.rooms[k].config[3]) == JSON.stringify(capConfig[3]))) {
					capList.push(JSON.parse(JSON.stringify(data_0.rooms[k])));
				}
			}
			//pick a room
			rand = Math.floor(sRandom()*capList.length);
			map[emptList[j].y][emptList[j].x] = JSON.parse(JSON.stringify(capList[rand]));
			numRooms++;
			
			//gen a floor
			genFloor(emptList[j].y, emptList[j].x);
			
			//apply stying config
			map[emptList[j].y][emptList[j].x].wall_style = wall_pal;
			map[emptList[j].y][emptList[j].x].floor_style = floor_style;
			map[emptList[j].y][emptList[j].x].palette = lvl_pal;
		}
	}
	
	console.log("empties capped...");
	
	/*
		next, we connect adjacent open rooms that are separated by a small door. This way contiguous 
		open rooms have open sides to each other, giving them a more "outside" feel.
	*/
	var connectables = 0;
	for (i=0; i<map.length; i++) {
		for (j=0; j<map[i].length; j++) {
			if (map[i][j] !=0) {
				// am I an open room?
				if (map[i][j].config[0].length > 2 || map[i][j].config[1].length > 2 ||
					map[i][j].config[2].length > 2 || map[i][j].config[3].length > 2) {
					
					//Do I neighbor another open room through a small door?
					
					if (map[i][j].config[0].length <=2) {	//top-bottom connection
						connectables++;
						//if the adjacent room isn't not a room, and is an open room
						if (map[i-1][j] !=0 &&	
							(map[i-1][j].config[0].length > 2 || map[i-1][j].config[1].length > 2 ||
							map[i-1][j].config[2].length > 2 || map[i-1][j].config[3].length > 2)) {
							
							//change the rooms to connect openly
							var nConfig = [
								JSON.parse(JSON.stringify(map[i-1][j].config[0])),	//keep the old value
								JSON.parse(JSON.stringify(map[i-1][j].config[1])),	//keep the old value
								[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],		//change corrosponding sides
								JSON.parse(JSON.stringify(map[i-1][j].config[3]))	//keep the old value
							];
							var mConfig = [
								[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18],		//change corrosponding sides
								JSON.parse(JSON.stringify(map[i][j].config[1])),	//keep the old value
								JSON.parse(JSON.stringify(map[i][j].config[2])),	//keep the old value
								JSON.parse(JSON.stringify(map[i][j].config[3]))		//keep the old value
							];
							
							//find the correct room matching our new config and replace the old room with the new
							for (k=0; k<data_0.rooms.length; k++) {
								if ((JSON.stringify(data_0.rooms[k].config[0]) == JSON.stringify(nConfig[0])) &&
									(JSON.stringify(data_0.rooms[k].config[1]) == JSON.stringify(nConfig[1])) &&
									(JSON.stringify(data_0.rooms[k].config[2]) == JSON.stringify(nConfig[2])) &&
									(JSON.stringify(data_0.rooms[k].config[3]) == JSON.stringify(nConfig[3]))) {
									
									map[i-1][j] = JSON.parse(JSON.stringify(data_0.rooms[k]));	//overwrite room
									//styling
									genFloor(i-1, j);
									map[i-1][j].wall_style = wall_pal;
									map[i-1][j].floor_style = floor_style;
									map[i-1][j].palette = lvl_pal;
								} 
								if ((JSON.stringify(data_0.rooms[k].config[0]) == JSON.stringify(mConfig[0])) &&
									(JSON.stringify(data_0.rooms[k].config[1]) == JSON.stringify(mConfig[1])) &&
									(JSON.stringify(data_0.rooms[k].config[2]) == JSON.stringify(mConfig[2])) &&
									(JSON.stringify(data_0.rooms[k].config[3]) == JSON.stringify(mConfig[3]))) {
									
									map[i][j] = JSON.parse(JSON.stringify(data_0.rooms[k]));	//overwrite room
									//styling
									genFloor(i, j);
									map[i][j].wall_style = wall_pal;
									map[i][j].floor_style = floor_style;
									map[i][j].palette = lvl_pal;
								}
							}
						}
					}
					
					if (map[i][j].config[1].length <=2) {	//left-right connection
						connectables++;
						if (map[i][j-1] !=0 && 
							(map[i][j-1].config[0].length > 2 || map[i][j-1].config[1].length > 2 ||
							map[i][j-1].config[2].length > 2 || map[i][j-1].config[3].length > 2)) {
							
							//change data_0.rooms to connect openly
							var nConfig = [
								JSON.parse(JSON.stringify(map[i][j-1].config[0])),	//keep the old value
								JSON.parse(JSON.stringify(map[i][j-1].config[1])),	//keep the old value
								JSON.parse(JSON.stringify(map[i][j-1].config[2])),	//keep the old value
								[1,2,3,4,5,6,7,8,9,10,11,12,13,14]					//change corrosponding sides
							];
							var mConfig = [
								JSON.parse(JSON.stringify(map[i][j].config[0])),	//keep the old value
								[1,2,3,4,5,6,7,8,9,10,11,12,13,14],					//change corrospoinding sides
								JSON.parse(JSON.stringify(map[i][j].config[2])),	//keep the old value
								JSON.parse(JSON.stringify(map[i][j].config[3]))		//keep the old value
							];
							
							//find the correct room matching our new config and replace the old room with the new
							for (k=0; k<data_0.rooms.length; k++) {
								if ((JSON.stringify(data_0.rooms[k].config[0]) == JSON.stringify(nConfig[0])) &&
									(JSON.stringify(data_0.rooms[k].config[1]) == JSON.stringify(nConfig[1])) &&
									(JSON.stringify(data_0.rooms[k].config[2]) == JSON.stringify(nConfig[2])) &&
									(JSON.stringify(data_0.rooms[k].config[3]) == JSON.stringify(nConfig[3]))) {
									
									map[i][j-1] = JSON.parse(JSON.stringify(data_0.rooms[k]));	//overwrite room
									//styling
									genFloor(i, j-1);
									map[i][j-1].wall_style = wall_pal;
									map[i][j-1].floor_style = floor_style;
									map[i][j-1].palette = lvl_pal;
								} 
								if ((JSON.stringify(data_0.rooms[k].config[0]) == JSON.stringify(mConfig[0])) &&
									(JSON.stringify(data_0.rooms[k].config[1]) == JSON.stringify(mConfig[1])) &&
									(JSON.stringify(data_0.rooms[k].config[2]) == JSON.stringify(mConfig[2])) &&
									(JSON.stringify(data_0.rooms[k].config[3]) == JSON.stringify(mConfig[3]))) {
									
									map[i][j] = JSON.parse(JSON.stringify(data_0.rooms[k]));	//overwrite room
									//styling
									genFloor(i, j);
									map[i][j].wall_style = wall_pal;
									map[i][j].floor_style = floor_style;
									map[i][j].palette = lvl_pal;
								}
							}
						}
					}
				}
			} 
		}
	}
	
	console.log("connectables connected...");
	
	//build a list of rooms to put stuff in
	var rList = [];	//list of rooms to put things in
	for (i=0; i<map.length; i++) {
		for (j=0; j<map[i].length; j++) {
			//exclude the starting room and non rooms and rooms that already have obstacles
			if (map[i][j]!=0 && !(i == start_room.y && j == start_room.x) && map[i][j].obs == -1) {
				rList.push({x: j, y: i});
			}
		}
	}
	
	console.log("rooms identified...");
	
	//apply styling to all rooms in map
	for (i=0; i<map.length; i++) {
		for (j=0; j<map[i].length; j++) {
			if (map[i][j] != 0) {	//not an non room
				if (map[i][j].obs == -1) {
					//apply floor style
					for (var k=0; k<map[i][j].map[0].length; k++) {
						for (var l=0; l<map[i][j].map[0][k].length; l++) {
							if (map[i][j].map[0][k][l] != 0) {
								//differentiation for inside an outside styling [NOT USED]
								/*if (map[i][j].open == false) {
									map[i][j].map[0][k][l] = map[i][j].map[0][k][l]-3;
								} else {
									map[i][j].map[0][k][l] = map[i][j].map[0][k][l]-map[i][j].floor_style;
								}*/
								map[i][j].map[0][k][l] = map[i][j].map[0][k][l]-map[i][j].floor_style;
							}
						}
					}

					//apply wall style
					for (var k=0; k<map[i][j].map[1].length; k++) {
						for (var l=0; l<map[i][j].map[1][k].length; l++) {
							if (map[i][j].map[1][k][l] != 0) {
								map[i][j].map[1][k][l] = map[i][j].map[1][k][l]-map[i][j].wall_style;
							}
						}
					}
					
					map[i][j].obs = 0;	//mark that the room has been styled
				}
			}
		}
	}
	
	console.log("styling applied...");
	
	//put start room in map
	if (prev == null) {	//only if it's a new map without an existing start room
		map[start_room.y][start_room.x].obs = 1;	//mark as not needing obstacles
	
		//apply the start room config
		var new_obs = buildConfig('config_goal',configs_all);
		for (var k=0; k<map[start_room.y][start_room.x].map.length; k++) {
			for (var l=0; l<map[start_room.y][start_room.x].map[k].length; l++) {
				for (var m=0; m<map[start_room.y][start_room.x].map[k][l].length; m++) {
					if (new_obs[k][l][m] !=0) {
						if (k==0) {
							map[start_room.y][start_room.x].map[k][l][m] = new_obs[k][l][m];
						} else if (map[start_room.y][start_room.x].map[k][l][m] == 0) {
							map[start_room.y][start_room.x].map[k][l][m] = new_obs[k][l][m];
						}
					}
				}
			}
		}
		
		rList.splice(rand, 1);	//remove the selected room from the list
		console.log("start room placed...");
	}
	
	//put boss in map
	rand = Math.floor(sRandom()*rList.length);	//pick a room
	boss_room.x = rList[rand].x;				//save the location of the boss room
	boss_room.y  =rList[rand].y;
	var new_boss = JSON.parse(JSON.stringify(data_mobs.bosses[0]));	//make a new boss
	new_boss.data.loc.x = (Math.floor(sRandom()*19))*8;	//pick a spot
	new_boss.data.loc.y = (Math.floor(sRandom()*15))*8;	//pick a spot
	//push the boss to the room
	map[rList[rand].y][rList[rand].x].contents.push(JSON.parse(JSON.stringify(new_boss)));
	console.log("boss placed...@"+rList[rand].y+","+rList[rand].x);
	map[boss_room.y][boss_room.x].obs = 1;	//mark as not needing obstacles
	rList.splice(rand, 1);					//remove the room from the list
	
	//put in powerups
	var num_powerups = rList.length/4;	//there should be a 4th as many powerups as there are rooms
	for (var i=0; i<num_powerups; i++) {
		//ensure at least one power up in the level
		rand = Math.floor(sRandom()*rList.length);	//pick a room
		var new_aug;
		
		if (sRandom() > config.wep_probability) {	//roll for a weapon
			new_aug = JSON.parse(JSON.stringify(data_entities.ent_wep));	//make a new aug entity
			var selection_wheel = [];
			var entries = 20;
			for (var q=0; q<data_weapons.weps.length; q++) {	//roll for what kind of weapon
				for (var r=0; r<entries-data_weapons.weps[q].rarity; r++) {
					selection_wheel.push(q);
				}
			}
			//set the powerup as the selected weapon
			new_aug.data.wep = selection_wheel[Math.floor(sRandom()*selection_wheel.length)];
		} else {	//eles it's an augment
			new_aug = JSON.parse(JSON.stringify(data_entities.ent_aug));	//make a new aug entity
			var selection_wheel = [];
			var entries = 20;
			for (var q=0; q<data_augments.augments.length; q++) {	//roll for what kind of augment
				for (var r=0; r<entries-data_augments.augments[q].data.rarity; r++) {
					selection_wheel.push(q);
				}
			}
			//set the powerup as the selected augment
			new_aug.data.aug = selection_wheel[Math.floor(sRandom()*selection_wheel.length)];
		}
		
		//apply the powerup room config
		map[rList[rand].y][rList[rand].x].obs = 1;
		var new_obs = buildConfig('config_item',configs_all);
		for (var k=0; k<map[rList[rand].y][rList[rand].x].map.length; k++) {	//layer
			for (var l=0; l<map[rList[rand].y][rList[rand].x].map[k].length; l++) {
				for (var m=0; m<map[rList[rand].y][rList[rand].x].map[k][l].length; m++) {
					if (new_obs[k][l][m] !=0) {
						if (k==0) {
							map[rList[rand].y][rList[rand].x].map[k][l][m] = new_obs[k][l][m];
						} else if (map[rList[rand].y][rList[rand].x].map[k][l][m] == 0) {
							map[rList[rand].y][rList[rand].x].map[k][l][m] = new_obs[k][l][m];
						}
					}
				}
			}
		}
		
		map[rList[rand].y][rList[rand].x].contents.push(new_aug);	//pus the new power up to the room
		map[rList[rand].y][rList[rand].x].obs = 1;	//mark as not needing obstacles
		rList.splice(rand,1);	//remove the room from the list
	}
	
	console.log("augments placed...");
	
	//assign obstacle configs
	for (i=0; i<map.length; i++) {
		for (j=0; j<map[i].length; j++) {
			//if not a non room, if is a room needing obstacles, not the start room and not the boss room
			if (map[i][j] != 0 && map[i][j].obs == 0 && !(i == start_room.y && j == start_room.x) && !(i == boss_room.y && j == boss_room.x)) {
				if (sRandom() > config.config_probability) {	//roll for generated or pre-maed obstacles
					genRoom(i,j);	//generate obstacles
				} else {
					//pre-made obstacles
					var config_list;
					if (map[i][j].open == false) {
						var new_obs = buildConfig(configs_inside[Math.floor(sRandom()*configs_inside.length)].name, configs_inside);
					} else {
						var new_obs = buildConfig(configs_outside[Math.floor(sRandom()*configs_outside.length)].name, configs_outside);
					}
					map[i][j].obs = 1;
					
					for (var k=0; k<map[i][j].map.length; k++) {	//layer
						for (var l=0; l<map[i][j].map[k].length; l++) {
							for (var m=0; m<map[i][j].map[k][l].length; m++) {
								if (new_obs[k][l][m] !=0) {
									if (k==0) {
										map[i][j].map[k][l][m] = new_obs[k][l][m];
									} else if (map[i][j].map[k][l][m] == 0) {
										map[i][j].map[k][l][m] = new_obs[k][l][m];
									}
								}
							}
						}
					}
				}
			}
		}
	}
	console.log("configs assigned...");
	
	
	//put in doors and keys
	//place door
	//build key place list
	//place key
	for (var i=0; i<rList.length; i++) {
		if (map[rList[i].y][rList[i].x].open == false) {	//only want doors on non-open rooms
			if (sRandom() < config.door_probability) {	//roll for a door
				//pick a doorway
				//build list of openings/doorable spots
				var available_openings = [];
				for (var j=0; j<map[rList[i].y][rList[i].x].config.length; j++) {
					if (map[rList[i].y][rList[i].x].config[j].length > 0) {
						available_openings.push(j);
					}
				}
				
				//find out if there are already any doors in this room
				var existing_doors = [];
				for (var j=0; j<map[rList[i].y][rList[i].x].contents.length; j++) {
					if (map[rList[i].y][rList[i].x].contents[j].data.type == 'door') {
						existing_doors.push(map[rList[i].y][rList[i].x].contents[j].data.config);
					}
				}
				
				//remove possible spots, if doors are already there
				for(var j=0; j<existing_doors.length; j++) {
					if (available_openings.indexOf(existing_doors[j]) > -1) {
						available_openings.splice(available_openings.indexOf(existing_doors[j]),1);
					}
				}
				
				if (available_openings.length > 0) {
					rand = Math.floor(sRandom()*available_openings.length);	//pick an opening
					var new_door = JSON.parse(JSON.stringify(data_entities.ent_key_door));	//make a door
					//config the door
					new_door.data.config = available_openings[rand];
					new_door.data.room = {x:rList[i].x, y: rList[i].y};
					new_door.data.color = "green";
					
					//figure out a list of rooms we can place a key in
					var key_place_rooms_to_check = [JSON.stringify({x:start_room.x, y:start_room.y})];
					var key_place_rooms_valid = [];
					var key_place_rooms_checked = [];
					
					while (key_place_rooms_to_check.length > 0) {	//until we find at least one viable room
						
						//find out the available room exits
						var exits = [];
						//console.log(JSON.parse(key_place_rooms_to_check[0]));
						for (var j=0; j<map[JSON.parse(key_place_rooms_to_check[0]).y][JSON.parse(key_place_rooms_to_check[0]).x].config.length; j++) {
							if (map[JSON.parse(key_place_rooms_to_check[0]).y][JSON.parse(key_place_rooms_to_check[0]).x].config[j].length > 0) {
								exits.push(j);
							}
						}
						
						//get rid of exits blocked by doors
						for (var j=0; j<map[JSON.parse(key_place_rooms_to_check[0]).y][JSON.parse(key_place_rooms_to_check[0]).x].contents.length; j++) {
							if (map[JSON.parse(key_place_rooms_to_check[0]).y][JSON.parse(key_place_rooms_to_check[0]).x].contents[j] != null) {
								if (map[JSON.parse(key_place_rooms_to_check[0]).y][JSON.parse(key_place_rooms_to_check[0]).x].contents[j].type == 'door') {
									if (exits.indexOf(map[JSON.parse(key_place_rooms_to_check[0]).y][JSON.parse(key_place_rooms_to_check[0]).x].contents[j].config) > -1) {
										exits.splice(exits.indexOf(map[JSON.parse(key_place_rooms_to_check[0]).y][JSON.parse(key_place_rooms_to_check[0]).x].contents[j].config), 1);
									}
								}
							}
						}
						
						//remove the possibility that the key is in the same room as the door
						if (JSON.parse(key_place_rooms_to_check[0]).y == new_door.data.room.y && 
							JSON.parse(key_place_rooms_to_check[0]).x == new_door.data.room.x) {
							
							exits.splice(exits.indexOf(new_door.config), 1);
						}
						
						//for each exit, look at the room it leads to
						if (exits.length == 0) {	//locked in the room (no viable exits) [This shouldn't happen]
							//console.log("welp");
							key_place_rooms_checked.push(key_place_rooms_to_check[0]);
							key_place_rooms_to_check.shift();
						} else {	//otherwise at least 1 viable exit
							for (var j=0; j<exits.length; j++) {
								var to_check;	//need to check what's on the other side
								var dupe;
								switch(exits[j]) {
									case	0:	to_check = {x:JSON.parse(key_place_rooms_to_check[0]).x, y:JSON.parse(key_place_rooms_to_check[0]).y-1};
												break;
									case	1:	to_check = {x:JSON.parse(key_place_rooms_to_check[0]).x-1, y:JSON.parse(key_place_rooms_to_check[0]).y};
												break;
									case	2:	to_check = {x:JSON.parse(key_place_rooms_to_check[0]).x, y:JSON.parse(key_place_rooms_to_check[0]).y+1};
												break;
									case	3:	to_check = {x:JSON.parse(key_place_rooms_to_check[0]).x+1, y:JSON.parse(key_place_rooms_to_check[0]).y};
												break;
								}
								dupe = false;
								if (key_place_rooms_to_check.indexOf(JSON.stringify(to_check)) > -1) {
									dupe = true;
								}
								if (key_place_rooms_valid.indexOf(JSON.stringify(to_check)) > -1) {
									dupe = true;
								}
								if (key_place_rooms_checked.indexOf(JSON.stringify(to_check)) > -1) {
									dupe = true;
								}
								if (dupe == false) {
									key_place_rooms_to_check.push(JSON.stringify(to_check));
								}
							}
							
							//need to check if the room we want already has a key or a powerup
							var hasAug = false;
							var hasKey = false;
							for (j=0; j<map[JSON.parse(key_place_rooms_to_check[0]).y][JSON.parse(key_place_rooms_to_check[0]).x].contents.length; j++) {
								if (map[JSON.parse(key_place_rooms_to_check[0]).y][JSON.parse(key_place_rooms_to_check[0]).x].contents[j] != null) {
									if (map[JSON.parse(key_place_rooms_to_check[0]).y][JSON.parse(key_place_rooms_to_check[0]).x].contents[j].type == 'aug') {
										hasAug = true;
									}
									if (map[JSON.parse(key_place_rooms_to_check[0]).y][JSON.parse(key_place_rooms_to_check[0]).x].contents[j].type == 'key') {
										hasKey = true;
									}
								}
							}
							
							if (map[JSON.parse(key_place_rooms_to_check[0]).y][JSON.parse(key_place_rooms_to_check[0]).x].obs == 0) {
								hasAug = true;
							}
							
							if (hasAug == false && hasKey == false && 
								(JSON.parse(key_place_rooms_to_check[0]).y != boss_room.y && JSON.parse(key_place_rooms_to_check[0]).x != boss_room.x) &&
								(JSON.parse(key_place_rooms_to_check[0]).y != start_room.y && JSON.parse(key_place_rooms_to_check[0]).x != start_room.x)) {
								
								key_place_rooms_valid.push(key_place_rooms_to_check[0]);	//only push rooms with nothing
							}
							key_place_rooms_checked.push(key_place_rooms_to_check[0]);
							key_place_rooms_to_check.shift();
						}
					}
					
					if (key_place_rooms_valid.length > 0) {	//if we have at least 1 valid room to put a key in
						rand = Math.floor(sRandom()*key_place_rooms_valid.length);	//pick a room
					
						var new_key = JSON.parse(JSON.stringify(data_entities.ent_key));	//make a new key
						new_key.id = "k_"+seed;	//config/identify
						
						//move contents if needed
						if (map[JSON.parse(key_place_rooms_valid[rand]).y][JSON.parse(key_place_rooms_valid[rand]).x].map[1][Math.floor(new_key.data.loc.y/tile_size)][Math.floor(new_key.data.loc.x/tile_size)] != 0) {
							
							//build list of placeable spots
							var placeList = [];
							for (var q=0; q<map[JSON.parse(key_place_rooms_valid[rand]).y][JSON.parse(key_place_rooms_valid[rand]).x].map[1].length; q++) {
								for (var r=0; r<map[JSON.parse(key_place_rooms_valid[rand]).y][JSON.parse(key_place_rooms_valid[rand]).x].map[1][q].length; r++) {
									if (q>1 && q<map[JSON.parse(key_place_rooms_valid[rand]).y][JSON.parse(key_place_rooms_valid[rand]).x].map[1].length-1 && r>1 && r<map[JSON.parse(key_place_rooms_valid[rand]).y][JSON.parse(key_place_rooms_valid[rand]).x].map[1][q].length-1 && 
										map[JSON.parse(key_place_rooms_valid[rand]).y][JSON.parse(key_place_rooms_valid[rand]).x].map[1][q][r] == 0) {
										placeList.push({x:r, y:q});
									}
								}
							}
							
							var rand_place = Math.floor(sRandom()*placeList.length);	//pick a random valid spot to put the key
							new_key.data.loc.x = placeList[rand_place].x*tile_size;		//place the key
							new_key.data.loc.y = placeList[rand_place].y*tile_size;
						}
						
						//place the corresponding door in the connecting room and config them both
						var other_door = JSON.parse(JSON.stringify(data_entities.ent_key_door));	//make a new door
						switch(new_door.data.config) {
							case	0:	new_door.data.loc = {x:tile_size*9, y:0};
										new_door.data.hit_box = {x:0,y:0,w:16,h:12};
										
										other_door.data.config = 2;
										other_door.data.loc = {x:tile_size*9, y: tile_size*15};
										other_door.data.hit_box = {x:0,y:-4,w:16,h:12};
										other_door.data.room = {x:rList[i].x, y: rList[i].y-1};
										
										map[new_door.data.room.y][new_door.data.room.x].map[1][0][9] = 576;
										map[new_door.data.room.y][new_door.data.room.x].map[1][0][10] = 576;
										map[other_door.data.room.y][other_door.data.room.x].map[1][15][9] = 576;
										map[other_door.data.room.y][other_door.data.room.x].map[1][15][10] = 576;
										
										break;
							case	1:	new_door.data.loc = {x:0, y:tile_size*7};
										new_door.data.hit_box = {x:0,y:0,w:12,h:16};
										
										other_door.data.config = 3;
										other_door.data.loc = {x:tile_size*19, y:tile_size*7};
										other_door.data.hit_box = {x:-4,y:0,w:12,h:16};
										other_door.data.room = {x: rList[i].x-1, y:rList[i].y};
										
										map[new_door.data.room.y][new_door.data.room.x].map[1][7][0] = 576;
										map[new_door.data.room.y][new_door.data.room.x].map[1][8][0] = 576;
										map[other_door.data.room.y][other_door.data.room.x].map[1][7][19] = 576;
										map[other_door.data.room.y][other_door.data.room.x].map[1][8][19] = 576;
										
										break;
							case	2:	new_door.data.loc = {x:tile_size*9, y: tile_size*15};
										new_door.data.hit_box = {x:0,y:-4,w:16,h:12};
										
										other_door.data.config = 0;
										other_door.data.loc = {x:tile_size*9, y:0};
										other_door.data.hit_box = {x:0,y:0,w:16,h:12};
										other_door.data.room = {x: rList[i].x, y:rList[i].y+1};
										
										map[new_door.data.room.y][new_door.data.room.x].map[1][15][9] = 576;
										map[new_door.data.room.y][new_door.data.room.x].map[1][15][10] = 576;
										map[other_door.data.room.y][other_door.data.room.x].map[1][0][9] = 576;
										map[other_door.data.room.y][other_door.data.room.x].map[1][0][10] = 576;
										
										break;
							case	3:	new_door.data.loc = {x:tile_size*19, y:tile_size*7};
										new_door.data.hit_box = {x:-4,y:0,w:12,h:16};
										
										other_door.data.config = 1;
										other_door.data.loc = {x:0, y:tile_size*7};
										other_door.data.hit_box = {x:0,y:0,w:12,h:16};
										other_door.data.room = {x: rList[i].x+1, y:rList[i].y};
										
										map[new_door.data.room.y][new_door.data.room.x].map[1][7][19] = 576;
										map[new_door.data.room.y][new_door.data.room.x].map[1][8][19] = 576;
										map[other_door.data.room.y][other_door.data.room.x].map[1][7][0] = 576;
										map[other_door.data.room.y][other_door.data.room.x].map[1][8][0] = 576;
										
										break;
						}
						map[new_door.data.room.y][new_door.data.room.x].contents.push(new_door);
						map[other_door.data.room.y][other_door.data.room.x].contents.push(other_door);
						console.log("door(s) placed @"+new_door.data.room.x+","+new_door.data.room.y+" + "+other_door.data.room.x+","+other_door.data.room.y);
						
						map[JSON.parse(key_place_rooms_valid[rand]).y][JSON.parse(key_place_rooms_valid[rand]).x].contents.push(new_key);
					} else {
						console.log("could not find a room for a key, aborting door")
					}
				} else {
					console.log("no available door spots");
				}
			}
		}	
	}
	
	//put mobs in rooms
	for (i=0; i<map.length; i++) {
		for (j=0; j<map[i].length; j++) {
			//if not a non room and not the start or boss rooms
			if (map[i][j] != 0 && !(i == start_room.y && j == start_room.x) && !(i == boss_room.y && j == boss_room.x)) {
				if (sRandom() > config.mob_probability) {	//roll for a mob
					rand = Math.floor(sRandom()*(4+difficulty))+1;	//roll for how many mobs in this room
					
					for (k=0; k<rand; k++) {	//for each mob we get, roll for what kind
						//select the type of mob
						var selection_wheel = [];
						var entries = 10;
						for (var q=0; q<data_mobs.mobs.length; q++) {
							for (var r=0; r<entries-(data_mobs.mobs[q].data.rarity); r++) {
								selection_wheel.push(q);
							}
						}
						//make the new mob
						var new_mob = JSON.parse(JSON.stringify(data_mobs.mobs[selection_wheel[Math.floor(sRandom()*selection_wheel.length)]]));
						//config the mob
						new_mob.data.loc.y = Math.floor(sRandom()*10)+2;	//set position
						new_mob.data.loc.x = Math.floor(sRandom()*14)+2;
						new_mob.data.drop = JSON.parse(JSON.stringify(data_entities.ent_drop));	//set drop
						
						//roll for the mob's level
						selection_wheel = [];
						entries = (new_mob.data.level_range[1])*2;
						for (var q=new_mob.data.level_range[0]; q<new_mob.data.level_range[1]; q++) {
							for (var r=0; r<entries-q; r++) {
								selection_wheel.push(q);
							}
						}
						//apply level
						new_mob.data.level = selection_wheel[Math.floor(sRandom()*selection_wheel.length)]+difficulty;
						
						//roll for the mob's ai
						if (sRandom() < .40+new_mob.data.level/10) {
							new_mob.data.ai = 0;
						} else {
							new_mob.data.ai = Math.floor(sRandom()*data_mobs.ais.length-1)+1;
						}
						//more config
						new_mob.data.speed+=Math.floor(new_mob.data.level/10);
						new_mob.data.health_max = new_mob.data.health_max*new_mob.data.level;
						new_mob.data.health = new_mob.data.health_max;
						new_mob.data.damage = new_mob.data.level/2;
						new_mob.data.exp_reward = new_mob.data.level;
						new_mob.data.action_probability = 1-new_mob.data.action_probability/new_mob.data.level;
						new_mob.data.cooldown_limit = new_mob.data.cooldown_limit - new_mob.data.level/2;
						if (new_mob.data.cooldown_limit <= 30) {
							new_mob.data.cooldown_limit = 30;
						}
						
						//if the mob would be out of bounds or on a solid tile, we need to move it
						if (new_mob.data.loc.x == -1 || new_mob.data.loc.y == -1 || new_mob.data.loc.x < 16 || new_mob.data.loc.y < 16 ||
							new_mob.data.loc.x > screen_width-16 || new_mob.data.loc.y > screen_height-32 ||
							map[i][j].map[1][Math.floor(new_mob.data.loc.y/tile_size)][Math.floor(new_mob.data.loc.x/tile_size)] != 0) {
							
							//build list of placeable spots
							var placeList = [];
							for (var q=0; q<map[i][j].map[1].length; q++) {
								for (var r=0; r<map[i][j].map[1][q].length; r++) {
									if (q>1 && q<map[i][j].map[1].length-1 && r>1 && r<map[i][j].map[1][q].length-1 && map[i][j].map[1][q][r] == 0) {
										placeList.push({x:r, y:q});
									}
								}
							}
							
							var rand_place = Math.floor(sRandom()*placeList.length);	//pick a valid place to put the mob
							new_mob.data.loc.x = placeList[rand_place].x*tile_size;		//set the place
							new_mob.data.loc.y = placeList[rand_place].y*tile_size;
						}
						console.log("mob placed @"+j+","+i);
						map[i][j].contents.push(new_mob);
						mobs_remaining++;
					}
				}
			}
		}
	}
	console.log("mobs placed...");
	
	//put chests
	for (i=0; i<rList.length; i++) {
		if (sRandom() < config.chest_probability) {	//roll for a chest
			var keyChest = false;
			var hasAug = false;
			for (k=0; k<map[rList[rand].y][rList[rand].x].contents.length; k++) {
				//if there's a key in the room, convert it to a key chest [Not Working?]
				if (map[rList[rand].y][rList[rand].x].contents[k].type == 'key') {
					keyChest = true;
					map[rList[rand].y][rList[rand].x].contents.splice(k,1);
					k--;
				}
				if (map[rList[rand].y][rList[rand].x].contents[k].type == 'aug') {
					hasAug = true;
				}
			}
			if (hasAug == false) {	//if we don't have a powerup, we can place a chest
				var new_chest = JSON.parse(JSON.stringify(data_entities.ent_chest));	//make a new chest
				if (keyChest == true) {	//set to key if necessary
					new_chest.data.contents = 'key';
				}
				
				//build list of placeable spots
				var placeList = [];
				for (var q=0; q<map[rList[rand].y][rList[rand].x].map[1].length; q++) {
					for (var r=0; r<map[rList[rand].y][rList[rand].x].map[1][q].length; r++) {
						if (q>1 && q<map[rList[rand].y][rList[rand].x].map[1].length-1 && r>1 && r<map[rList[rand].y][rList[rand].x].map[1][q].length-1 && map[rList[rand].y][rList[rand].x].map[1][q][r] == 0) {
							placeList.push({x:r, y:q});
						}
					}
				}
				
				//move contents if needed
				if (map[rList[rand].y][rList[rand].x].map[1][Math.floor(new_chest.data.loc.y/tile_size)][Math.floor(new_chest.data.loc.x/tile_size)] == 0) {
					map[rList[rand].y][rList[rand].x].map[1][new_chest.data.loc.y/tile_size][new_chest.data.loc.x/tile_size] = 576;
				} else {
					var rand_place = Math.floor(sRandom()*placeList.length);	//pick a spot
					new_chest.data.loc.x = placeList[rand_place].x*tile_size;	//place the chest
					new_chest.data.loc.y = placeList[rand_place].y*tile_size;
					//set a collision tile
					map[rList[rand].y][rList[rand].x].map[1][new_chest.data.loc.y/tile_size][new_chest.data.loc.x/tile_size] = 576;
				}
				map[rList[rand].y][rList[rand].x].contents.push(new_chest);	//push the chest
			}
		}
	}
	console.log("chests placed...");
	
	level_complete = false;
	
	console.log("map built!");	//ALL DONE! Whew
}

//check for room transitions and progress them if needed
function room_transition(player_obj) {
	
	if (player_obj.transition_flag == -1) {	//non-transitioning state
		//player is in trigger zones, trigger the appropriate transition 
		//check if the player will be entering a trigger zone and check that there's more map in that direction
		
		//transition up
		if (Math.floor(player_obj.data.y-player_obj.data.speed) <= 1 && player_obj.data.y_map-1 > 0) {
			player_obj.transition_flag = 0;	//start transition up state
			player_obj.data.y_map--;		//adjust their local map postion to the new room
			player_obj.room_draw_y = 0-screen_height+16;	//set for room swiping animation
			player_obj.needs_map_data = true;				//flag the user to recieve update map info on next update
			console.log("player "+player_obj.id+": "+player_obj.data.x_map+","+(player_obj.data.y_map+1)+
						"->"+player_obj.data.x_map+","+player_obj.data.y_map);
		}
		
		//transition down
		if (Math.ceil(player_obj.data.y+8+player_obj.data.speed) >= screen_height-16 && player_obj.data.y_map+1 < map.length-1) {
			player_obj.transition_flag = 2;	//start transition down state
			player_obj.data.y_map++;		//adjust their local map postion to the new room
			player_obj.room_draw_y = screen_height-16;	//set for room swiping animation
			player_obj.needs_map_data = true;			//flag the user to recieve update map info on next update
			console.log("player "+player_obj.id+": "+player_obj.data.x_map+","+(player_obj.data.y_map-1)+
						"->"+player_obj.data.x_map+","+player_obj.data.y_map);
		}
		
		//transition left
		if (Math.floor(player_obj.data.x-player_obj.data.speed) <= 1 && player_obj.data.x_map-1 > 0) {
			player_obj.transition_flag = 1;	//start transition left state
			player_obj.data.x_map--;		//adjust their local map postion to the new room
			player_obj.room_draw_x = 0-screen_width;	//set for room swiping animation
			player_obj.needs_map_data = true;			//flag the user to recieve update map info on next update
			console.log("player "+player_obj.id+": "+(player_obj.data.x_map+1)+","+player_obj.data.y_map+
						"->"+player_obj.data.x_map+","+player_obj.data.y_map);
		}
		
		//transition right
		if (Math.ceil(player_obj.data.x+8+player_obj.data.speed) >= screen_width && player_obj.data.x_map+1 < map[player_obj.data.y_map].length-1) {
			player_obj.transition_flag = 3;	//start transition right state
			player_obj.data.x_map++;		//adjust their local map postion to the new room
			player_obj.room_draw_x = screen_width;	//set for room swiping animation
			player_obj.needs_map_data = true;		//flag the user to recieve update map info on next update
			console.log("player "+player_obj.id+": "+(player_obj.data.x_map-1)+","+player_obj.data.y_map+
						"->"+player_obj.data.x_map+","+player_obj.data.y_map);
		}
	}
	
	//if the player is indeed transitioning, progress that transition
	if (player_obj.transition_flag != -1) {
		
		//set room start x y positions
		if (player_obj.transition_flag == 0) {	
				player_obj.data.y = screen_height-28;
		}
		if (player_obj.transition_flag == 2) {
				player_obj.data.y = 9+player_obj.data.speed;
		}
		if (player_obj.transition_flag == 1) {
				player_obj.data.x = screen_width-9-player_obj.data.speed;
		}
		if (player_obj.transition_flag == 3) {
				player_obj.data.x = 4+player_obj.data.speed;
		}
		
		//progress the room swipe animation
		if (player_obj.room_draw_y < 0) {
			player_obj.room_draw_y = player_obj.room_draw_y+8;
		}
		if (player_obj.room_draw_y > 0) {
			player_obj.room_draw_y = player_obj.room_draw_y-8;
		}
		if (player_obj.room_draw_x < 0) {
			player_obj.room_draw_x = player_obj.room_draw_x+8;
		}
		if (player_obj.room_draw_x > 0) {
			player_obj.room_draw_x = player_obj.room_draw_x-8;
		}
		
		//once all scrolling is done and still in transition start
		if (player_obj.room_draw_y == 0 && player_obj.room_draw_x == 0 && (
			player_obj.transition_flag == 0 || player_obj.transition_flag == 1 ||
			player_obj.transition_flag == 2 || player_obj.transition_flag == 3)) {
			
			switch(player_obj.transition_flag) {
				case	0:	player_obj.transition_flag = 0.1;	//end transition up state
							break;
				case	1:	player_obj.transition_flag = 1.1;	//end transition left state
							break;
				case	2:	player_obj.transition_flag = 2.1;	//end transition down state
							break;
				case	3:	player_obj.transition_flag = 3.1;	//end transition right state
							break;
				default:	break;
			}
		}
	}
}


//rolls for a seeded random
function sRandom() {	//from Antti Sykäri on Stack overflow (with modification by me)
	var x = Math.sin(seed++) * 10000;
	x = x - Math.floor(x);
	x = Math.abs(x);
	return x; 
}

//update a room and its contents
function update_room(map_x, map_y) {
	map[map_y][map_x].audio_queue = [];	//clear the rooms audio queue [UNFINISHED]
	//build a list of players that are in this room
	local_players = [];
	for (var i=0; i<player_list.length; i++) {
		if (player_list[i] != null) {
			if (player_list[i].data.x_map == map_x && player_list[i].data.y_map == map_y) {
				local_players.push(player_list[i]);
				//add the audio emitted by players to the audio queue [UNFINISHED]
				map[map_y][map_x].audio_queue = map[map_y][map_x].audio_queue.concat(player_list[i].local_audio);
			}
		}
	}
	
	//update the various things in the room
	if (map[map_y][map_x] !=null) {
		if (map[map_y][map_x] != 0) {
			if (map[map_y][map_x] != null) {	//check again, because you'd be surprised
				for (var i=0; i<map[map_y][map_x].contents.length; i++) {
					if (map[map_y][map_x].contents != null) {	//again, you'd be surprised
						if (map[map_y][map_x].contents[i] != null) {
							//run the appropriate update function depending on what the entity is
							if (map[map_y][map_x].contents[i].data.type == 'aug') {		//powerup
								data_entities.ent_aug_update(map[map_y][map_x].contents[i], local_players, data_augments.augments, map[map_y][map_x].contents);
							}
							if (map[map_y][map_x].contents[i].data.type == 'wep') {		//weapon
								data_entities.ent_wep_update(map[map_y][map_x].contents[i], local_players, data_weapons.weps, map[map_y][map_x].contents);
							}
							if (map[map_y][map_x].contents[i].data.type == 'key') {		//key
								data_entities.ent_key_update(map[map_y][map_x].contents[i], local_players);
							}
							if (map[map_y][map_x].contents[i].data.type == 'door') {	//door
								data_entities.ent_key_door_update(map[map_y][map_x].contents[i], local_players, map);
							}
							if (map[map_y][map_x].contents[i].data.type == 'drop') {	//drop
								data_entities.ent_drop_update(map[map_y][map_x].contents[i], local_players);
							}
							if (map[map_y][map_x].contents[i].data.type == 'bag') {		//death bag
								data_entities.ent_bag_update(map[map_y][map_x].contents[i], local_players, data_augments.augments);
							}
							if (map[map_y][map_x].contents[i].data.type == 'goal') {	//start/goal	
								data_entities.ent_goal_update(map[map_y][map_x].contents[i], local_players);
							}
							if (map[map_y][map_x].contents[i].data.type == 'chest') {	//chest
								data_entities.ent_chest_update(map[map_y][map_x].contents[i], local_players, map[map_y][map_x].contents);
							}
							if (map[map_y][map_x].contents[i].data.type == 'mob') {		//enemy
								data_mobs.mob_update(map[map_y][map_x].contents[i], local_players, map[map_y][map_x]);
								map[map_y][map_x].audio_queue = map[map_y][map_x].audio_queue.concat(map[map_y][map_x].contents[i].local_audio);
							}
							if (map[map_y][map_x].contents[i].data.type == 'boss') {	//boss
								data_mobs.boss_update(map[map_y][map_x].contents[i], local_players, map[map_y][map_x]);
								map[map_y][map_x].audio_queue = map[map_y][map_x].audio_queue.concat(map[map_y][map_x].contents[i].local_audio);
								//if the boss is dead, expand the world! (well, try to at least)
								if (map[map_y][map_x].contents[i].data.states.is_dead == true) {
									map[map_y][map_x].contents[i] = null;
									expand_world();
								}
							}
						}
					}
				}
			}
		}
	}
}

//upate cycle
function main_loop() {	//get rid of inactive/disconnected players + update rooms
	start_time = new Date();	//frame timing data
	active_rooms = [];		//clear the active rooms list
	
	//update the players!
	for (var i=0; i<player_list.length; i++) {
		if (player_list[i]!=null) {
			if (player_list[i].update_counter < 0) {	//if player is inactive, remove them
				data_player.drop_bag(player_list[i], map[player_list[i].data.y_map][player_list[i].data.x_map].contents);
				//console.log(map[player_list[i].data.y_map][player_list[i].data.x_map].contents);
				console.log("player "+player_list[i].id+" terminated");
				player_list[i] = null;
			} else {	//players is active! update and manage them
				player_list[i].update_counter--;
				//if player is out of bounds, put them in the start room
				if (map[player_list[i].data.y_map][player_list[i].data.x_map] == 0) {
					player_list[i].data.y_map = start_room.y;
					player_list[i].data.x_map = start_room.x;
					console.log("relocating player: "+player_list[i].id);
				}
				
				//update the player
				data_player.player_update(player_list[i], map[player_list[i].data.y_map][player_list[i].data.x_map].map[1], map[player_list[i].data.y_map][player_list[i].data.x_map].contents);
				
				//check for room transition
				room_transition(player_list[i]);
				
				//add whatever room they're in to our list of rooms to update
				new_room = '{"x":'+player_list[i].data.x_map+',"y":'+player_list[i].data.y_map+'}';
				if (active_rooms.indexOf(new_room) < 0) {
					active_rooms.push(new_room);
				}
			}
		}
	}
	
	//update the the rooms with players in them
	for (var i=0; i<active_rooms.length; i++) {
		coords = JSON.parse(active_rooms[i]);
		update_room(coords.x, coords.y);
	}
	
	//delay the next update if we finished early
	end_time = new Date();
	cycle_time = end_time.getTime()-start_time.getTime();
	delay_time = 15-cycle_time;
	if (delay_time < 0) {
		delay_time = 0;
	}
	setTimeout(main_loop, delay_time);
}

//expand the already made world
function expand_world() {
	
	//return all players to the start room
	for (var i=0; i<player_list.length; i++) {
		if (player_list[i] != null) {
			player_list[i].data.x_map = start_room.x;
			player_list[i].data.y_map = start_room.y;
			player_list[i].data.x = 9*8;
			player_list[i].data.y = 9*8;
		}
	}
	
	buildLevel(config.level_size, map);	//generate new parts to the level
	difficulty = difficulty*config.difficulty_scale	//up the difficulty
	
	//set all the players to recive map updates, and reset their postion to the start square
	for (var i=0; i<player_list.length; i++) {
		if (player_list[i] != null) {
			player_list[i].reset_map = true;	
			player_list[i].data.x_map = start_room.x;
			player_list[i].data.y_map = start_room.y;
			player_list[i].data.x = 9*8;
			player_list[i].data.y = 9*8;
		}
	}
	
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                           *
 *  API ENDPOINTS                                                            *
 *                                                                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

//inits  new client
app.post('/client_setup', function(req, res) {
	
	//make a new player obj and config
	var new_player = req.body;
	new_player.data.y_map = start_room.y;
	new_player.data.x_map = start_room.x;
	new_player.room_draw_x = 0;
	new_player.room_draw_y = 0;
	new_player.inventory.weapons.push(JSON.parse(JSON.stringify(data_weapons.weps[config.starting_weapon])));
	new_player.death_bag = JSON.parse(JSON.stringify(data_entities.ent_bag));
	
	//add the new player to the list
	if (player_list.indexOf(null) > -1) {	//fill empty places if there are any first
		new_player.id = player_list.indexOf(null);
		player_list[player_list.indexOf(null)] = new_player;
	} else {
		new_player.id = player_list.length;
		player_list.push(new_player);
	}
	console.log("New player: "+player_list[new_player.id].id+" @ "+player_list[new_player.id].data.y_map+","+player_list[new_player.id].data.x_map);
	
	//send back data
	res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
		seed: config.base_seed, 
		player_id: new_player.id,
		player_list: player_list,
		room_data: map[start_room.y][start_room.x],
		room_loc: start_room,
		boss_loc: boss_room,
		map_size: {y:map.length, x:map[0].length}
	}));
});

//update a client
app.post('/update', function(req, res) {
	
	if (player_list[req.body.player.id] != null) {
		
		var update_data = {
			player_data: [],
			room_data:-1,
			room_content:-1,
			room_loc:-1,
			sim_time: cycle_time,
			audio_queue: [],
			map_size:-1,
			start:-1,
			boss:-1
		}
		
		//reset the update counter
		player_list[req.body.player.id].update_counter = 3000;
		//update the players pressed keys
		player_list[req.body.player.id].pressed_keys = req.body.player.pressed_keys;
		
		//update_data.audio_queue = map[player_list[req.body.player.id].data.y_map][player_list[req.body.player.id].data.x_map].audio_queue;
		
		if (player_list[req.body.player.id].reset_map == true) {
			update_data.map_size = {y:map.length, x:map[0].length};
			update_data.start = start_room;
			update_data.boss = boss_room;
			player_list[req.body.player.id].reset_map = false;
		}
		
		//signal the ending of a room transition if needed
		if (req.body.player.transition_flag == -1.1 && (
			player_list[req.body.player.id].transition_flag == 0.1 || player_list[req.body.player.id].transition_flag == 1.1 ||
			player_list[req.body.player.id].transition_flag == 2.1 || player_list[req.body.player.id].transition_flag == 3.1)) {
				
			player_list[req.body.player.id].transition_flag = -1;
			player_list[req.body.player.id].data.states.is_invincible = true;
			player_list[req.body.player.id].data.invincibility_counter = 0;
		}
		
		//provide the stuff in the room
		update_data.room_content = map[player_list[req.body.player.id].data.y_map][player_list[req.body.player.id].data.x_map].contents;
		//provide the rooms location in the map
		update_data.room_loc = {x: player_list[req.body.player.id].data.x_map, y: player_list[req.body.player.id].data.y_map};
		
		//provide map data if needed
		if (player_list[req.body.player.id].needs_map_data == true || player_list[req.body.player.id].data.x_map != req.body.player.curr_room.x || player_list[req.body.player.id].data.y_map != req.body.player.curr_room.y) {
			player_list[req.body.player.id].needs_map_data = false;
			update_data.room_data = map[player_list[req.body.player.id].data.y_map][player_list[req.body.player.id].data.x_map];
		}
		
		update_data.player_data = player_list;
	
		//console.log(JSON.stringify(update_data.room_loc));
		res.send(JSON.stringify(update_data));
		
	} else {
		//not valid player
	}
});
