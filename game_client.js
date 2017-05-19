//music url http://www.beepbox.co/#5s6k6l00e0ftaa7g0fj7i0r0w1111f0000d1111c0000h0060v0003o3210b000w8h4h4g0h4i4zcP8x8y8y4h8y8h8h4x800i4w018p22-FBO9cd6gFO0V6j8Rj3Apllg5cKh9xwQQV0siN2hGMoIOSD83ApdteyCNd3HqTqWwkOV4C6z8kV0sz9AqGqfuPnjIp5dehjAQQwmo589wngChmNmRhJr5rl6QVwhmYnBulZltunI2XR2TvgHKXU_cPcHKXHKXM3dgggA444aXKY-O0Xi7dQrmlhhthhJkm0
//http://www.beepbox.co/#5s6k6l00e0ftaa7g0fj7i0r0w1111f0000d1111c0000h0060v0003o3210b000w8j514g0h4i4zcN8x8y8y4h8y8h8h4x800i4w018p23AFBO9cd6gFO0V6j8Rj3ApllmImjnjA1OaGGEaKC1LFVoI3wqsMetpvlj8QOs1m5cKh9xwQQV0siN2hGMoIOSD83ApdteyCNd3HqTqWwkOV4C6z8kV0sz9AqGqfuPnjIp5dehjAQQwmo589wngChmNmRhJr5rl6QVwhmYnBulZltunI2XR2TvgHKXU_cPcHKXHKXM3dgggA444aXKY-O0Xi7dQrmlhhthhJkm0
var tile_size = 8;
var show_hitboxes = false;
var blink = true;			        //state of blink
var frames = 0;				        //A frame count
var goal_room = {x:-1,y:-1};	    //room with exit in it
var level_complete = false;	        //Status of competion
var scale_factor = 5;		        //screen scaling factor (default value)
var sheet_width = 256;		        //width and height of sprite sheet (in pixels)
var fps = 0;				        //count of frames per second
var expansion_factor = 2;           //How many times a map is expanded upon when generating
var cycle = -1;                     //keeps track of how many levels the player has played
var rTransition = -1;               //Flag denoting room transitions
var lvl_curr;                       //holds the data of the currently loaded room
var lvl_prev;                       //holds the data of the previously exited room            
var banner_counter = 0;             //Counter for the time the Cycle banner is displayed
var render_screen;                  //The final form of the game screen that is to be rendered
var img;                            //holds the unscaled image of the game that a palette will be applied to
var sX,sY;                          //Vars for processing and rendering sprites
var keys_remaining = 0;             //count of keys remaining in the current level
var mobs_remaining = 0;             //count of mobs remaining in the current level
var draws = 0;                      //debug var to count how many draws are in each frame
var drawsperframe = 0;              //debug var for draws/frame
var pals_enabled = true;         	//Flag to enable/disable Pallettes
var map_loc = {x:0, y:0};           //location of the currently loaded room in the map
var floors_available = 5;           //number of available floor tile sets
var walls_available = 5;            //number of available wall tile sets
var pal_curr;                       //holds the current room color palette
var sprite_sheet = new Image();	    //Sheet of sprite images
var seed;
var path_trigger = 0;
var mid_transition = -1;
var blink_sprites = [
	286,
	287,
	288
	//[352,384],
	//[438,470]
];
var render_queue = [];
var sounds_queue = [];

//var blink_sprites = [];

sprite_sheet.src = 'assets/char_sheet.png';

var player_sheet = new Image();      //sheet of player sprites
player_sheet.src = 'assets/player_sheet.png';

var extended_player_sheet = new Image();      //sheet of player sprites
extended_player_sheet.src = 'assets/extended_char_sheet.png';

var weapon_sheet = new Image();			//sheet of weapon sprites
weapon_sheet.src = 'assets/weps.png';

var menu_sheet = new Image();
menu_sheet.src = 'assets/start_menu_sheet.png';

//initiate canvas
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

//inititate render canvas
var render_canvas = document.getElementById("render_canvas");
var rctx = render_canvas.getContext("2d");

var menu_courser = {x:0,y:0};
var gender_option = {options:[0,1], selected:1};
var skin_option = {options:[0,1,2], selected:0};
var hair_option = {options:[0,1,2,3,4], selected:0};
var name_option = {options:[0], selected:0, selecting: false, chars:[0,1,2,3,4,5,6,7]};
var start = {options:[0],selected:0,primed:false};
var start_menu_map = [
	[gender_option, skin_option],
	[hair_option],
	[
		JSON.parse(JSON.stringify(name_option)),
		JSON.parse(JSON.stringify(name_option)),
		JSON.parse(JSON.stringify(name_option)),
		JSON.parse(JSON.stringify(name_option)),
		JSON.parse(JSON.stringify(name_option))
	],
	[start]
];

//init a random name
for (var i=0; i<start_menu_map[2].length; i++) {
	var init_char = Math.floor(Math.random()*8);
	start_menu_map[2][i].selected = init_char;
}
var menu_blink = 0;
var char_select_lock = false;
var menu_rend_x;
var health_bar_y;
var bar_size = 78;

//////////////////////////////////////////////////////////////////////////
//                                                                      //
//                              GAME START                              //
//                                                                      //
//////////////////////////////////////////////////////////////////////////

//kick off EVERYTHING
function init(phase) {
	
	if (phase == -1) {	//menu mode
		bgm.pause();
		bgm.source = "assets/song2.wav"
		bgm.play();
		manageScreen();
		mainLoop();	//start event loop
	}
	
	if (phase == 0) {	//menu mode
		bgm.pause();
		bgm.src = "assets/menu_song.wav"
		bgm.play();
		manageScreen();
		//mainLoop();	//start event loop
	}
	
	if (phase == 1) {	//play mode
		pal_curr = pals[room_data.palette];
		bgm.pause();
		bgm.src = "assets/song2.wav";
		bgm.play();	//start the bgm
		if (lvl_prev == null) {
			lvl_prev = room_data.map;
		}
	}
	
	if (phase == 2) {	//game over mode
		bgm.pause();
		bgm.src = "assets/menu-song.wav";
		bgm.play();
	}
}

//loads a level
function loadRoom() {
	//update that palette data
	pal_curr = pals[room_data.palette];
	//update the data for the previous room
	lvl_prev = room_data.map;
}

//draw a sprite
function drawSprite(sprite,x,y) {
	
	if (blink == false) {
		if (sprite == 352){
			sprite = 384;
		} else if (sprite == 438){
			sprite = 470;
		} else {
			for (var i=0; i<blink_sprites.length; i++) {
				if (sprite+room_data.floor_style == blink_sprites[i]) {
					sprite = sprite+32;
					break;
				}
			}
		}
	}
	
	ctx.drawImage(
		sprite_sheet,
		((sprite-1)%(sheet_width/8))*8,
		Math.floor((sprite-1)/(sheet_width/8))*8,
		tile_size,
		tile_size,
		x,
		y,
		tile_size,
		tile_size
	);
}

//game window management
function manageScreen() {
	if (window.innerWidth < window.innerHeight) {
		canvas_width = window.innerWidth;
		canvas_height = Math.floor((144/160)*(window.innerWidth));	
	} else {
		canvas_height = window.innerHeight;
		canvas_width = Math.floor((160/144)*(window.innerHeight));
	}
	render_canvas.style.top = JSON.stringify((window.innerHeight/2)-(canvas_height/2))+'px';
	render_canvas.style.left = JSON.stringify((window.innerWidth/2)-(canvas_width/2))+'px';
	render_canvas.height = JSON.stringify(canvas_height);
	render_canvas.width = JSON.stringify(canvas_width);
	render_canvas.style.position = 'absolute';
	rctx.imageSmoothingEnabled = false;
	scale_factor = (canvas_width/160);
}

//manage status bar and menu
function menuSystem() {
	
	var sX,sY;
	var augList = [];
	
	//try to keep the menu on the opposite side of the screen as the player
	menu_rend_x = Math.floor(screen_width/2);
	
	//level banner
	rctx.font="6px monospace";
	if (banner_counter > -1) {
		banner_counter++;
		if (banner_counter > 120) {
			banner_counter = -1;
		}
	}
	
	if (banner_counter < 120 && banner_counter > -1) {
		rctx.fillStyle = 'black';
		rctx.fillRect(0, 0, 64, 8);
		
		rctx.fillStyle = 'white';
		rctx.fillText('Seed: '+base_seed, 2, 6);
	}
	
	draw_mob_info();
	
	//menu
	if (paused == true) {
		
		draw_minimap();
		
		menu_rend_x = 0;
		draw_player_menu();
	}
	
	//status bar should be over everything
	draw_status_bar();
}

function draw_mob_info() {
	rctx.font="bold 5px monospace";
	if (room_content && mid_transition == -1) {
		for (var i=0; i<room_content.length; i++) {
			if (room_content[i] != null) {
				if (room_content[i].data != null) {
					//mob health bars
					if (room_content[i].data.type == 'mob') {
						if (room_content[i].data.states.is_dead == false) {
							for (var j=0; j<room_content[i].data.health; j++) {
								if (j % 10 == 0) {
									rctx.fillStyle = "black";
									rctx.fillRect(room_content[i].data.loc.x+9+(2*(j%10))+(Math.floor(j/10)*2)-1,(room_content[i].data.loc.y+Math.floor((j/10))*2)-1,21,6);
								}
								if (j/10 == 0) {
									rctx.fillStyle = '#F83800';
								}
								if (j/10 == 1) {
									rctx.fillStyle = '#E40058';
								}
								if (j/10 == 2) {
									rctx.fillStyle = '#D800CC';
								}
								if (j/10 == 3) {
									rctx.fillStyle = '#6844FC';
								}
								if (j/10 == 4) {
									rctx.fillStyle = '#0058F8';
								}
								if (j/10 == 5) {
									rctx.fillStyle = '#008888';
								}
								if (j/10 == 6) {
									rctx.fillStyle = '#00A844';
								}
								if (j/10 == 7) {
									rctx.fillStyle = '#00B800';
								}
								rctx.fillRect(room_content[i].data.loc.x+9+(2*(j%10))+(Math.floor(j/10)*2), room_content[i].data.loc.y+Math.floor((j/10))*2, 1,4);
							}
						}	
					}
					
					//boss health bars
					if (room_content[i].data.type == 'boss') {
						if (room_content[i].data.states.is_dead == false) {
							health_bar_y = screen_height-24;
							if (player_list[player_id].data.y > screen_height/2) {
								health_bar_y = 0;
							}
							rctx.fillStyle = "black";
							rctx.fillRect(0,health_bar_y, screen_width, 8);
							rctx.fillStyle = 'red';
							for (var j=0; j<room_content[i].data.health; j++) {
								if (j <= bar_size) {
									rctx.fillStyle = '#F83800';
								}
								if (j <= bar_size*2 && j > bar_size) {
									rctx.fillStyle = '#E40058';
								}
								if (j <= bar_size*3 && j> bar_size*2) {
									rctx.fillStyle = '#D800CC';
								}
								if (j <= bar_size*4 && j> bar_size*3) {
									rctx.fillStyle = '#6844FC';
								}
								if (j <= bar_size*5 && j> bar_size*4) {
									rctx.fillStyle = '#0058F8';
								}
								if (j <= bar_size*6 && j> bar_size*5) {
									rctx.fillStyle = '#0078F8';
								}
								if (j <= bar_size*7 && j> bar_size*6) {
									rctx.fillStyle = '#008888';
								}
								if (j <= bar_size*8 && j> bar_size*7) {
									rctx.fillStyle = '#00A844';
								}
								if (j <= bar_size*9 && j> bar_size*8) {
									rctx.fillStyle = '#00B800';
								}
								if (j <= bar_size*10 && j> bar_size*9) {
									rctx.fillStyle = '#E45C10';
								}
								rctx.fillRect(3+((2*j)%(2*bar_size)), health_bar_y+2, 1,4);
							}
						}
					}
				}
					
			}
		}
	}
}

function draw_player_menu() {
	rctx.font="6px monospace";
	//control the up-scroll of the menu
	if (menu == true) {
		if (menu_height > 0) {
			menu_height = menu_height -20;
		}
	} else {
		if (menu < screen_height-16) {
			menu_height = menu_height+20;
		}
		if (menu_height >= screen_height-16) {
			paused = false;
		}
	}
	
	//menu background
	rctx.fillStyle = 'black';
	rctx.fillRect(menu_rend_x, menu_height, Math.floor(screen_width/2), 56);
	
	//seed
	rctx.fillStyle = 'white';
	rctx.fillText('seed:  '+base_seed,menu_rend_x+5,menu_height+20);
	
	//fancy outline box thing
	rctx.fillRect(menu_rend_x+3,menu_height+23, 75, 26);
	rctx.fillStyle = 'black';
	rctx.fillRect(menu_rend_x+4,menu_height+24, 73, 24);
	rctx.fillStyle = 'white';
	
	//stats
	//lvl dpt
	//dmg def
	//spd crs
	//hp  sp
	rctx.fillText('lvl:    '+player_list[player_id].data.lvl,menu_rend_x+5,menu_height+30);
	rctx.fillText('dmg: '+(player_list[player_id].data.base_damage).toFixed(2),menu_rend_x+5,menu_height+35);
	rctx.fillText('def: '+(player_list[player_id].data.base_defense).toFixed(2),menu_rend_x+45,menu_height+35);
	rctx.fillText('spd: '+(player_list[player_id].data.speed).toFixed(2),menu_rend_x+5,menu_height+40);
	rctx.fillText('crs: '+(player_list[player_id].data.curse).toFixed(2),menu_rend_x+45,menu_height+40);
	rctx.fillText('hpr: '+(100*player_list[player_id].data.health_regen).toFixed(2),menu_rend_x+5,menu_height+45);
	rctx.fillText('spr: '+(10*player_list[player_id].data.stamina_regen).toFixed(2),menu_rend_x+45,menu_height+45);
	
	//augments
	rctx.fillText('augments:',menu_rend_x+5,menu_height+55);
	
	for (var i=0; i<player_list[player_id].inventory.augments.length; i++) {
		rctx.fillStyle = 'black';
		rctx.fillRect(menu_rend_x, menu_height+60+(i*5)-5, Math.floor(screen_width/2), 8);
		rctx.fillStyle = 'white';
		rctx.fillText(player_list[player_id].inventory.augments[i].name,menu_rend_x+5,menu_height+60+(i*5));
		rctx.fillText(player_list[player_id].inventory.augments[i].effectText,menu_rend_x+40,menu_height+60+(i*5));
	}
}

function draw_minimap() {
	//minimap
	rctx.font="6px monospace";
	for (var i=0; i<minimap.map.length; i++) {
		for(var j=0; j<minimap.map[i].length; j++) {	
			if (minimap.map[i][j] != -1) {
				sX = Math.floor((minimap.map[i][j]-1)/(sheet_width/8))*8;
				sY = ((minimap.map[i][j]-1)%(sheet_width/8))*8;
				rctx.drawImage(sprite_sheet, sY,sX,8,8,(8*j)+(4*8)-(map_loc.x*8)+menu_rend_x,menu_height+(8*i)+(8*8)-(map_loc.y*8),8,8);
				
				if (i == starting_room.y && j == starting_room.x) {
					sX = Math.floor((757-1)/(sheet_width/8))*8;
					sY = ((757-1)%(sheet_width/8))*8;
					rctx.drawImage(sprite_sheet, sY,sX,8,8,(8*j)+(4*8)-(map_loc.x*8)+menu_rend_x,menu_height+(8*i)+(8*8)-(map_loc.y*8),8,8);
				}
				if (i == boss_room.y && j == boss_room.x) {
					sX = Math.floor((583-1)/(sheet_width/8))*8;
					sY = ((583-1)%(sheet_width/8))*8;
					rctx.drawImage(sprite_sheet, sY,sX,8,8,(8*j)+(4*8)-(map_loc.x*8)+menu_rend_x,menu_height+(8*i)+(8*8)-(map_loc.y*8),8,8);
				}
				if (i == map_loc.y && j == map_loc.x) {
					sX = Math.floor((758-1)/(sheet_width/8))*8;
					sY = ((758-1)%(sheet_width/8))*8;
					rctx.drawImage(sprite_sheet, sY,sX,8,8,4*8+menu_rend_x,menu_height+(8*8),8,8);
				}
			}
		}
	}
}

function draw_status_bar() {
	//status bar
	rctx.font="6px monospace";
	rctx.fillStyle = 'black';
	rctx.fillRect(0, screen_height-16, screen_width, 16);
	
	rctx.fillStyle = 'white';
	rctx.fillText('HP[',0,screen_height-10);
	var bar_size = 32;
	for (var i=0; i<player_list[player_id].data.health_max; i++) {
		
		if (i <= bar_size) {
			rctx.fillStyle = '#F83800';
		}
		if (i <= bar_size*2 && i > bar_size) {
			rctx.fillStyle = '#E40058';
		}
		if (i <= bar_size*3 && i> bar_size*2) {
			rctx.fillStyle = '#D800CC';
		}
		if (i <= bar_size*4 && i> bar_size*3) {
			rctx.fillStyle = '#6844FC';
		}
		if (i <= bar_size*5 && i> bar_size*4) {
			rctx.fillStyle = '#0058F8';
		}
		if (i <= bar_size*6 && i> bar_size*5) {
			rctx.fillStyle = '#0078F8';
		}
		if (i <= bar_size*7 && i> bar_size*6) {
			rctx.fillStyle = '#008888';
		}
		if (i <= bar_size*8 && i> bar_size*7) {
			rctx.fillStyle = '#00A844';
		}
		if (i <= bar_size*9 && i> bar_size*8) {
			rctx.fillStyle = '#00B800';
		}
		if (i <= bar_size*10 && i> bar_size*9) {
			rctx.fillStyle = '#E45C10';
		}
		
		
		if (i<player_list[player_id].data.health) {
			rctx.fillText('|',(i%bar_size+5)*2,screen_height-10);
		}
	}
	rctx.fillStyle = "white";
	var cap_pos = bar_size;
	if (player_list[player_id].data.health_max < bar_size) {
		cap_pos = player_list[player_id].data.health_max;
	}
	
	rctx.fillText(']',(cap_pos+5.5)*2,screen_height-10);
	
	rctx.fillText('SP[',0,screen_height-2);
	for (var i=0; i<player_list[player_id].data.stamina_max; i++) {
		if (i<player_list[player_id].data.stamina) {
			rctx.fillText('|',(i+5)*2,screen_height-2);
		} else {
			rctx.fillText(' ',(i+5)*2,screen_height-2);
		}
	}
	rctx.fillText(']',(player_list[player_id].data.stamina_max+5.5)*2,screen_height-2);
	
	if (keys_remaining == 0) {
		sX = Math.floor((581-1)/(sheet_width/8))*8;
		sY = ((581-1)%(sheet_width/8))*8;
		rctx.drawImage(sprite_sheet, sY,sX,8,8,screen_width-80,screen_height-8,8,8);
	} else {
		sX = Math.floor((582-1)/(sheet_width/8))*8;
		sY = ((582-1)%(sheet_width/8))*8;
		rctx.drawImage(sprite_sheet, sY,sX,8,8,screen_width-80,screen_height-8,8,8);
	}
	rctx.fillText(':'+player_list[player_id].inventory.keys.length,screen_width-72,screen_height-2);
	
	/*sX = Math.floor((583-1)/(sheet_width/8))*8;
	sY = ((583-1)%(sheet_width/8))*8;
	rctx.drawImage(sprite_sheet, sY,sX,8,8,screen_width-80,screen_height-15,8,8);
	rctx.fillText(':'+mobs_remaining,screen_width-72,screen_height-10);*/
	rctx.fillText('c: '+cycle_time, screen_width-74,screen_height-10);
	rctx.fillText('s: '+server_time, screen_width-54,screen_height-10);
	rctx.fillText('p: '+call_time, screen_width-34,screen_height-10);
	
	rctx.fillText('XP[',screen_width-50,screen_height-2);
	var xp_percent = player_list[player_id].data.exp/player_list[player_id].data.lvl_next;
	for (var i=0; i<xp_percent*10; i++) {
		if (i<player_list[player_id].data.exp) {
			rctx.fillText('|',screen_width-50+(i+5)*2,screen_height-2);
		} else {
			rctx.fillText(' ',screen_width-50+(i+5)*2,screen_height-2);
		}
	}
	rctx.fillText(']: '+player_list[player_id].data.lvl,screen_width-50+(10+5.5)*2,screen_height-2);
}

//manage title screen
function title_screen() {
	menu_blink++;
	//console.log("drawing title_screen");
	//draw the background
	rctx.drawImage(menu_sheet, 0,144,160,144,0,0,160,144);
	
	if (menu_blink < 25) {
		rctx.drawImage(menu_sheet, 160,144,48,16, 56, 114, 48,16);
	} else {
		rctx.drawImage(menu_sheet, 160,160,48,16, 56, 114, 48,16);
	}
	
	if (menu_blink > 29) {
		menu_blink = 0;
	}
	
	if (pressed_keys.indexOf("_") > -1) {
		console.log("moving to menu");
		mode = -1.1;
		//init(0);
	}
}

//manage start menu
function startMenu() {
	menu_blink++;
	//move courser left
	if (pressed_keys.indexOf('A') > -1 && menu_input_lock == false && char_select_lock == false) {
		menu_courser.x--;
		if (menu_courser.x < 0) {
			menu_courser.x = 0;
		}
		menu_input_lock = true;
	}
	//move courser right
	if (pressed_keys.indexOf('D') > -1 && menu_input_lock == false && char_select_lock == false) {
		menu_courser.x++;
		var menu_x_width = 0;
		for (var i=0; i< start_menu_map[menu_courser.y].length; i++) {
			menu_x_width+= start_menu_map[menu_courser.y][i].options.length;
		}
		if (menu_courser.x >= menu_x_width) {
			menu_courser.x = menu_x_width-1;
		}
		menu_input_lock = true;
	}
	
	//move courser up
	if (pressed_keys.indexOf('W') > -1 && menu_input_lock == false) {
		if (char_select_lock == false) {
			menu_courser.y--;
			if (menu_courser.y < 0) {
				menu_courser.y = 0;
			}
			if (menu_courser.x < 0) {
				menu_courser.x = 0;
			}
			var menu_x_width = 0;
			for (var i=0; i< start_menu_map[menu_courser.y].length; i++) {
				menu_x_width+= start_menu_map[menu_courser.y][i].options.length;
			}
			if (menu_courser.x >= menu_x_width) {
				menu_courser.x = menu_x_width-1;
			}
		} else {
			start_menu_map[menu_courser.y][menu_courser.x].selected++;
			if (start_menu_map[menu_courser.y][menu_courser.x].selected >= start_menu_map[menu_courser.y][menu_courser.x].chars.length) {
				start_menu_map[menu_courser.y][menu_courser.x].selected = 0;
			}
		}
		menu_input_lock = true;
	}
	
	//move courser down
	if (pressed_keys.indexOf('S') > -1 && menu_input_lock == false) {
		if (char_select_lock == false) {
			menu_courser.y++;
			if (menu_courser.y >= start_menu_map.length) {
				menu_courser.y = start_menu_map.length-1;
			}
			if (menu_courser.x < 0) {
				menu_courser.x = 0;
			}
			var menu_x_width = 0;
			for (var i=0; i< start_menu_map[menu_courser.y].length; i++) {
				menu_x_width+= start_menu_map[menu_courser.y][i].options.length;
			}
			if (menu_courser.x >= menu_x_width) {
				menu_courser.x = menu_x_width-1;
			}
		} else {
			start_menu_map[menu_courser.y][menu_courser.x].selected--;
			if (start_menu_map[menu_courser.y][menu_courser.x].selected < 0) {
				start_menu_map[menu_courser.y][menu_courser.x].selected = start_menu_map[menu_courser.y][menu_courser.x].chars.length-1;
			}
		}
		
		menu_input_lock = true;
	}
	
	//make a selection
	if (pressed_keys.indexOf('_') > -1 && menu_input_lock == false) {
		if (menu_courser.y != start_menu_map.length-1) {
			
			if (menu_courser.y == start_menu_map.length-2) {
				if (start_menu_map[2][menu_courser.x].selecting == true) {
					start_menu_map[2][menu_courser.x].selecting = false;
					char_select_lock = false;
				} else {
					start_menu_map[2][menu_courser.x].selecting = true;
					char_select_lock = true;
				}
			} else {
				var selected_space = 0;
				var selection_found = false;
				for (var i=0; i<start_menu_map[menu_courser.y].length; i++) {
					if (selection_found == true) {
						break;
					}
					for (var j=0; j<start_menu_map[menu_courser.y][i].options.length; j++) {
						if (selection_found == true) {
							break;
						}
						if (selected_space == menu_courser.x) {
							start_menu_map[menu_courser.y][i].selected = start_menu_map[menu_courser.y][i].options[j];
							selection_found = true;
						} else {
							selected_space++;
						}
					}
				}
			}
		} else {
			mode = -2;
			player.avatar.gender = start_menu_map[0][0].selected;
			player.avatar.skin = start_menu_map[0][1].selected;
			player.avatar.hair = start_menu_map[1][0].selected;
			var p_name = [];
			for (var i=0; i<start_menu_map[2].length; i++) {
				p_name.push(start_menu_map[2][i].selected);
			}
			player.avatar.name = p_name;
		}
		
		menu_input_lock = true;
	}
	//draw the background
	rctx.drawImage(menu_sheet, 0,0,160,144,0,0,160,144);
	
	//draw the selction squares
	for (i=0; i<start_menu_map.length-2; i++) {
		for (var j=0; j< start_menu_map[i].length; j++) {
			if (j > 0) {
				var menu_section_start = start_menu_map[i][j-1].options.length;
			} else {
				var menu_section_start = 0;
			}
			rctx.drawImage(menu_sheet, 176,32,16,16, ((menu_section_start+start_menu_map[i][j].selected)*16)+60, (i*16)+20, 16,16);
		}
	}
	
	//draw the options overlay
	rctx.drawImage(menu_sheet, 160,48,80,32, 60, 20, 80,32);
	
	var gender = start_menu_map[0][0].selected;
	var skin = start_menu_map[0][1].selected;
	//draw the hairstyles
	for (var i=0; i<start_menu_map[1][0].options.length; i++) {
		rctx.drawImage(extended_player_sheet, skin*64,(i*16)+80-(gender*80),16,16, 60+(16*i),34,16,16);
	}
	var hair = start_menu_map[1][0].selected;
	
	//draw the char select overlays
	for (var i=0; i<start_menu_map[2].length; i++) {
		if (start_menu_map[2][i].selecting == true) {
			if (menu_blink < 15) {
				rctx.drawImage(menu_sheet, 208,0,16,48, (i*16)+60, 36, 16,48);
			} else {
				rctx.drawImage(menu_sheet, 224,0,16,48, (i*16)+60, 36, 16,48);
			}
		}
	}
	
	//draw the selected character
	for (var i=0; i<start_menu_map[2].length; i++) {
		
		var char_sel_x = 160;
		//console.log(start_menu_map[2][i]);
		if (start_menu_map[2][i].selected >=4) {
			char_sel_x = 176;
		}
		var char_sel_y = ((start_menu_map[2][i].selected%4)*16)+80;
		rctx.drawImage(menu_sheet, char_sel_x,char_sel_y,16,16, (i*16)+60,52,16,16);
	}
	
	//draw player preview
	rctx.drawImage(extended_player_sheet, skin*64,(hair*16)+80-(gender*80),16,16, 30,30,16,16);
	rctx.drawImage(extended_player_sheet, 192,(skin*64)+32-(gender*32),16,8, 30,46,16,8);
	
	
	//draw the courser
	if (menu_courser.y == start_menu_map.length-1) {
		//menu_blink++;
		if (menu_blink > 29) {
			menu_blink = 0;
		}
		if (menu_blink < 15) {
			rctx.drawImage(menu_sheet, 160,16,32,16, 108, 112, 32,16);
		} else {
			rctx.drawImage(menu_sheet, 160,0,32,16, 108, 112, 32,16);
		}
	} else {
		
		if (menu_blink > 29) {
			menu_blink = 0;
		}
		if (menu_blink < 15) {
			rctx.drawImage(menu_sheet, 160,32,16,16, (menu_courser.x*16)+60, (menu_courser.y*16)+20, 16,16);
		} else {
			rctx.drawImage(menu_sheet, 192,32,16,16, (menu_courser.x*16)+60, (menu_courser.y*16)+20, 16,16);
		}
	}
}

//check for room transitions
function roomTransition(player_obj) {
	
	//console.log(player_obj.transition_flag);
	
	if (player_obj.transition_flag == 0.1) {
		//minimap.update();
		loadRoom();
		player_obj.transition_flag = -1.1;
	}
	if (player_obj.transition_flag == 2.1) {
		//minimap.update();
		loadRoom();
		player_obj.transition_flag = -1.1;
	}
	if (player_obj.transition_flag == 1.1) {
		//minimap.update();
		loadRoom();
		player_obj.transition_flag = -1.1;
	}
	if (player_obj.transition_flag == 3.1) {
		//minimap.update();
		loadRoom();
		player_obj.transition_flag = -1.1;
	}
}

//render the current room
function render() {
	
	if (room_data != null) {
		
		//render background layer
		render_background();
		
		//render collision layer
		render_middleground();
		
		//render game objects
		render_objects();
		
		//render overlap
		render_foreground();
	}
}

function render_background() {
	//render background layer
	for (var i=0; i<room_data.map[0].length; i++) {
		for (var j=0; j<room_data.map[0][i].length; j++) {
			//current background layer
			if (room_data.map[0][i][j] !=0) {
				drawSprite(room_data.map[0][i][j],player_list[player_id].room_draw_x+Math.floor((j*8)),player_list[player_id].room_draw_y+Math.floor((i*8)));
			}
			
			if (mid_transition != -1) {
				//previouse room background layer
				if (lvl_prev[0][i][j] !=0) {
					if (mid_transition == 0) {
						drawSprite(lvl_prev[0][i][j],player_list[player_id].room_draw_x+Math.floor((j*8)),player_list[player_id].room_draw_y+screen_height-16+Math.floor((i*8)));
					}
					if (mid_transition == 1) {
						drawSprite(lvl_prev[0][i][j],player_list[player_id].room_draw_x+screen_width+Math.floor((j*8)),player_list[player_id].room_draw_y+Math.floor((i*8)));
					}
					if (mid_transition == 2) {
						drawSprite(lvl_prev[0][i][j],player_list[player_id].room_draw_x+Math.floor((j*8)),player_list[player_id].room_draw_y-screen_height+16+Math.floor((i*8)));
					}
					if (mid_transition == 3) {
						drawSprite(lvl_prev[0][i][j],player_list[player_id].room_draw_x-screen_width+Math.floor((j*8)),player_list[player_id].room_draw_y+Math.floor((i*8)));
					}
				}
			}    
		}
	}
}

function render_middleground() {
	for (var i=0; i<room_data.map[1].length; i++) {
		for (var j=0; j<room_data.map[1][i].length; j++) {
			//current collision layer
			if (room_data.map[1][i][j] !=0) {
				drawSprite(room_data.map[1][i][j],player_list[player_id].room_draw_x+Math.floor((j*8)),player_list[player_id].room_draw_y+Math.floor((i*8)));
			}
			
			//previous room collision layer
			if (lvl_prev[1][i][j] !=0) {
				if (mid_transition == 0) {
					drawSprite(lvl_prev[1][i][j],player_list[player_id].room_draw_x+Math.floor((j*8)),player_list[player_id].room_draw_y+screen_height-16+Math.floor((i*8)));
				}
				if (mid_transition == 1) {
					drawSprite(lvl_prev[1][i][j],player_list[player_id].room_draw_x+screen_width+Math.floor((j*8)),player_list[player_id].room_draw_y+Math.floor((i*8)));
				}
				if (mid_transition == 2) {
					drawSprite(lvl_prev[1][i][j],player_list[player_id].room_draw_x+Math.floor((j*8)),player_list[player_id].room_draw_y-screen_height+16+Math.floor((i*8)));
				}
				if (mid_transition == 3) {
					drawSprite(lvl_prev[1][i][j],player_list[player_id].room_draw_x-screen_width+Math.floor((j*8)),player_list[player_id].room_draw_y+Math.floor((i*8)));
				}
			}
		}
	}	
}

function render_foreground() {
	//curr room overlap
	for (var i=0; i<room_data.map[2].length; i++) {
		for (var j=0; j<room_data.map[2][i].length; j++) {
			//current room overlap
			if (room_data.map[2][i][j] !=0) {
				drawSprite(room_data.map[2][i][j],player_list[player_id].room_draw_x+Math.floor((j*8)),player_list[player_id].room_draw_y+Math.floor((i*8)));
			}
			
			//previous room overlap
			if (lvl_prev[2][i][j] !=0 && mid_transition != -1) {
				if (mid_transition == 0) {
					drawSprite(lvl_prev[2][i][j],player_list[player_id].room_draw_x+Math.floor((j*8)),player_list[player_id].room_draw_y+screen_height-16+Math.floor((i*8)));
				}
				if (mid_transition == 1) {
					drawSprite(lvl_prev[2][i][j],player_list[player_id].room_draw_x+screen_width+Math.floor((j*8)),player_list[player_id].room_draw_y+Math.floor((i*8)));
				}
				if (mid_transition == 2) {
					drawSprite(lvl_prev[2][i][j],player_list[player_id].room_draw_x+Math.floor((j*8)),player_list[player_id].room_draw_y-screen_height+16+Math.floor((i*8)));
				}
				if (mid_transition == 3) {
					drawSprite(lvl_prev[2][i][j],player_list[player_id].room_draw_x-screen_width+Math.floor((j*8)),player_list[player_id].room_draw_y+Math.floor((i*8)));
				}
			}
		}
	}
}

function render_objects() {
	render_queue = [];
		
	if (mid_transition == -1) {
		//draw the contents of the room
		if (room_content) {
			for (var i=0; i<room_content.length; i++) {
				if (room_content[i] != null) {
					if (room_content[i].data != null) {
						if (room_content[i].data.type == 'aug') {
							ent_aug_draw_func(room_content[i]);
						}
						if (room_content[i].data.type == 'wep') {
							ent_wep_draw_func(room_content[i]);
						}
						if (room_content[i].data.type == 'key') {
							ent_key_draw_func(room_content[i]);
						}
						if (room_content[i].data.type == 'door') {
							ent_key_door_draw_func(room_content[i]);
						}
						if (room_content[i].data.type == 'drop') {
							ent_drop_draw_func(room_content[i]);
						}
						if (room_content[i].data.type == 'bag') {
							ent_bag_draw_func(room_content[i]);
						}
						if (room_content[i].data.type == 'goal') {
							ent_goal_draw_func(room_content[i]);
						}
						if (room_content[i].data.type == 'chest') {
							ent_chest_draw_func(room_content[i]);
						}
						if (room_content[i].data.type == 'mob') {
							mob_draw_func(room_content[i]);
						}
						if (room_content[i].data.type == 'boss') {
							boss_draw_func(room_content[i]);
						}
					}
				}
			}
		}
		
		//draw the players
		for (var i=0; i<player_list.length; i++) {
			if (player_list[i] != null) {
				if (player_list[i].data.x_map == map_loc.x && player_list[i].data.y_map == map_loc.y) {
					//check for our player to ensure proper animation data preservation
					if (player_list[i].id == player_id) {
						player_draw(player_list[player_id]);	
					} else {
						player_draw(player_list[i]);
					}
				}
			}
		}	
	}
	
	render_queue.sort(function(a,b) {
		if (a != null && b != null) {
			return a.y-b.y;
		} else {
			return a;
		}
	});
	
	for (var i=0; i<render_queue.length; i++) {
		process_render_request(render_queue[i]);
	}
}

function process_render_request(request) {
	switch (request.action) {
		case	0:	drawSprite(			//draw a sprite
						request.sprite, 
						request.x, 
						request.y
					);
					break;
		case	1:	ctx.drawImage(		//draw an image
						request.sheet, 
						request.sheet_x, 
						request.sheet_y, 
						request.sheet_w, 
						request.sheet_h, 
						request.x, 
						request.y, 
						request.w, 
						request.h
					);
					break;
		case	2:	ctx.fillStyle = request.color;
					ctx.fillRect(		//draw a rect
						request.x,
						request.y,
						request.w,
						request.h
					);
					break;
		case	3:	for (var j=0; j<request.batch.length; j++) {	//batch of renders
						process_render_request(request.batch[j]);
					}
					break;
	}
}

//main loop
function mainLoop() {
	start_time = new Date;
	
	rctx.scale(scale_factor,scale_factor);	//scale up the render canvas
	
	if (mode == -1) {	//start menu mode
		title_screen();
	}
	
	if (mode == 0) {	//start menu mode
		startMenu();
	}
	
	if (mode == 1) {	//play mode
		frames++;
		//blank the canvas
		ctx.fillStyle = '#F1F1F1';
		ctx.fillRect(0,0,screen_width,screen_height-16);
		
		if (player_list[player_id]) {
			
			if (player_list[player_id].data.states.is_dead == false) {
				
				if (frames%15 == 0) {
					if (blink == true) {
						blink = false;
					} else {
						blink = true;
					}
				}
				
				if (player_list[player_id].transition_flag == 0 || player_list[player_id].transition_flag == 1 ||
					player_list[player_id].transition_flag == 2 || player_list[player_id].transition_flag == 3) {
				
					mid_transition = player_list[player_id].transition_flag;
				} else {
					mid_transition = -1;
				}
				
				//check if we need to change rooms
				roomTransition(player_list[player_id]);
				
				//draw the level
				render();
			}
		}
		
		//apply pallette swap
		if (pals_enabled == true) {
			img = ctx.getImageData(0,0,160,144-16);
			for(var i = 0; i < img.data.length; i += 4) {
				if (img.data[i+3] > 0) {
					/*if (img.data[i] == pals[0][0][0] && img.data[i+1] == pals[0][0][1] && img.data[i+2] == pals[0][0][2]) {
						img.data[i] = pal_curr[0][0];
						img.data[i+1] = pal_curr[0][1];
						img.data[i+2] = pal_curr[0][2];
					}*/
					if (img.data[i] == pals[0][1][0] && img.data[i+1] == pals[0][1][1] && img.data[i+2] == pals[0][1][2]) {
						img.data[i] = pal_curr[1][0];
						img.data[i+1] = pal_curr[1][1];
						img.data[i+2] = pal_curr[1][2];
					}
					/*if (img.data[i] == pals[0][2][0] && img.data[i+1] == pals[0][2][1] && img.data[i+2] == pals[0][2][2]) {
						img.data[i] = pal_curr[2][0];
						img.data[i+1] = pal_curr[2][1];
						img.data[i+2] = pal_curr[2][2];
					}*/
					/*if (img.data[i] == pals[0][3][0] && img.data[i+1] == pals[0][3][1] && img.data[i+2] == pals[0][3][2]) {
						img.data[i] = pal_curr[3][0];
						img.data[i+1] = pal_curr[3][1];
						img.data[i+2] = pal_curr[3][2];
					}*/
				} 
			} 
			ctx.putImageData(img, 0, 0);
		}
		
		//put final image to our rendering canvas
		rctx.putImageData(ctx.getImageData(0,0,screen_width,screen_height),0,0);
		
		rctx.drawImage(render_canvas, 0,0);
		//update/render menu
		menuSystem();
		//switch to game over screen if needed
		if (player_list[player_id].data.states.is_dead == true) {
			mode = 2;
			init(2);
		}
	}
	
	if (mode == 2) {	//game over screen
		rctx.font="7px monospace";
		rctx.fillStyle = 'black';
		rctx.fillRect(0,0,screen_width,screen_height-16);
		rctx.fillStyle = 'white';
		rctx.fillText('GAME OVER', (screen_width/2)-20, ((screen_height-16)/2));
		rctx.fillText('Refresh to Retry', (screen_width/2)-34, ((screen_height-16)/2)+8);
	}
	
	rctx.scale(1/scale_factor,1/scale_factor);	//scale down the render canvas
	
	end_time = new Date();
	cycle_time = end_time.getTime()-start_time.getTime();
	delay_time = 8-cycle_time;
	if (delay_time < 0) {
		delay_time = 0;
	}
	//setTimeout(update, delay_time);
	window.requestAnimationFrame(mainLoop);
}

//play queued sounds
function play_sounds() {
	//get new sounds
	while (audio_queue.length > 0) {
		switch(audio_queue[0]) {
			case	0:	console.log("adding new sound");
						sounds_queue.push(new Audio('assets/swing.wav'));
						audio_queue.shift()
						break;
		}
	}
	for (var i=0; i<sounds_queue.length; i++) {
		if(sounds_queue[i].ended) {
			sounds_queue.splice(i,1);
			i--;
		}
	}
	for (var i=0; i<sounds_queue.length; i++) {
		if (!sounds_queue[i].paused) {
			sounds_queue.play();
			console.log("playing");
		}
	}
}