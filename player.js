var screen_width = 160;		        //Game Resolution Width
var screen_height = 144;		    //Game Resolution Height
var tile_size = 8;

var player = {
	data:{
		x: 9*8,				//x location in the current room
		y: 8*8,				//y location in the current room
		x_map: 0,			//x location of current room in map
		y_map: 0,			//y location of current room in map
		dir: 2,				//direction player is facing 0,1,2,3 -> up,left,right,down
		strafe: false,		//flag for if the player is strafing
		invincibility_counter: 0,		//frame counter for how long invincibility lasts
		invincibility_limit: 60,		//max number of frames that invincibility can last
		move_while_attacking: false,	//flag for if the player can move while attacking
		speed: 1,			//current player speed (in pixels)
		speed_current: .25,	//current speed of the player 
		speed_limit: 4,		//max speed the player can reach
		base_damage: 1,		//base damage the player can deal
		base_defense: 1,	//base amount of damage the palyer can absorb
		health: 10,			//current player health
		health_regen: 0,	//health regeneration rate
		health_max: 10,		//max health the player currently has
		health_limit: 256,	//absolute max health the player can have
		stamina: 10,		//current player stamina
		stamina_regen: .1,	//stamina regeneration rate
		stamina_max: 10,	//max stamina the player can currently have
		stamina_limit: 32,	//absolute maximum stamina the player can have
		curse: 0,			//current level of curse on the player
		cures_regen: .0001,	//growth rate of the curse
		cures_max: 10,		//max value the curse can reach
		exp: 0,				//player's experience points
		exp_past: 0,		//experience from past level-ups
		lvl: 0,				//player's current level
		lvl_next: 10,		//experience needed for the next level-up
		lvl_reward: 5,		//reward to be applied to stats on level-up
		status_count: -1,	//counter for how long a status bubble hangs over a player's head
		status_new: -1,		//coutner for the status rising into position
		h_anim_curr: 0,		//index of the head animation's current frame
		b_anim_curr: 1,		//index of the body animation's current frame
		h_anim_index: 0,	//index for the current head animation set
		b_anim_index: 0,	//index for the current body animation set
		h_anim_counter: -1,	//counter for the head animation's current frame
		b_anim_counter: -1,	//counter for the body animation's current frame
		headbob: 0,			//state of head bob (really it's just a pixel offset in y)
		states: {			//states of the player
			is_idle: true,			//player is standing still
			is_moving: false,		//player is moving
			is_strafing: false,		//player is strafing
			is_invincible: false,	//player is invincible
			is_attacking: false,	//player is attacking
			is_dead: false,			//player is dead
			is_stunned: false,		//player is stunned (unused)
			is_enflamed: false,		//player is on fire (unused)
			is_frozen: false,		//player is frozen (unused)
			is_electric: false,		//player is electrified (unused)
			is_wet: false			//player is wet (unused)
		},
		idle_timer: 100,	//timer while the player is idle, until their name displays
		paused: false,		//flag for if the player is paused
		hit_box: {			//hit-box for the player
			x: -4,			//x offset from player x
			y: 0,			//y offset from player y
			w: 16,			//box width
			h: 8			//box height
		}
	},
	avatar: {		//object describing how the player looks as custimized by the user
		gender: 0,	//0|1 -> male|female
		skin: 0,	//0|1|2 -> white,yellow,brown
		hair: 0,	//hair style
		name: [		//name (in symbols) 
			0,		//1st symbol
			0,		//2nd symbol
			0,		//3rd symbol
			0,		//4th symbol
			0		//5th symbol
		]
	},
	inventory: {			//object representing the player's inventory
		keys: [],			//list of held keys
		augments: [],		//list of power-ups
		augments_max: 4,	//limit of how many power-ups the player can have
		weapons: [],		//list of held weapons
		weapons_max: 1,		//limit of how many weapons the player can have
		weapons_index: 0,	//index of the currently selected weapon
		abilities: [],		//list of held abilities
		abilities_max: 1	//limit of how many abilites the player can have
	},
	death_bag: null,		//holds the player's death bag
	id: -1,					//id of the player
	pressed_keys: [],		//list of pressed input keys
	transition_flag: -1,	//flag describing if a/what kind of room transition
	reset_map: false,		//flag noting if the user's map need's resettign
	local_audio: []			//queue of sounds to playe on the user's client
};

var player_animations = [	//animation definitions for the player
	[	//head idle 
		[{x:48,y:0,h:16,w:16,dur:4}],
		[{x:32,y:0,h:16,w:16,dur:4}],
		[{x:0,y:0,h:16,w:16,dur:4}],
		[{x:16,y:0,h:16,w:16,dur:4}]
	],
	[	//body idle
		[{x:192,y:24,h:8,w:16,dur:4}],
		[{x:192,y:16,h:8,w:16,dur:4}],
		[{x:192,y:0,h:8,w:16,dur:4}],
		[{x:192,y:8,h:8,w:16,dur:4}]
	],
	[	//body walk
		[
			{x:208,y:24,h:8,w:16,dur:4},
			{x:192,y:24,h:8,w:16,dur:4},
			{x:224,y:24,h:8,w:16,dur:4},
			{x:192,y:24,h:8,w:16,dur:4}
		],
		[
			{x:208,y:16,h:8,w:16,dur:4},
			{x:192,y:16,h:8,w:16,dur:4},
			{x:224,y:16,h:8,w:16,dur:4},
			{x:192,y:16,h:8,w:16,dur:4}
		],
		[
			{x:208,y:0,h:8,w:16,dur:4},
			{x:192,y:0,h:8,w:16,dur:4},
			{x:224,y:0,h:8,w:16,dur:4},
			{x:192,y:0,h:8,w:16,dur:4}
		],
		[
			{x:208,y:8,h:8,w:16,dur:4},
			{x:192,y:8,h:8,w:16,dur:4},
			{x:224,y:8,h:8,w:16,dur:4},
			{x:192,y:8,h:8,w:16,dur:4}
		]
	],
	[	//body attack
		[
			{x:240,y:24,h:8,w:16,dur:4},
			{x:256,y:24,h:8,w:16,dur:4},
			{x:272,y:24,h:8,w:16,dur:4}
		],
		[
			{x:240,y:16,h:8,w:16,dur:4},
			{x:256,y:16,h:8,w:16,dur:4},
			{x:272,y:16,h:8,w:16,dur:4}
		],
		[
			{x:240,y:0,h:8,w:16,dur:4},
			{x:256,y:0,h:8,w:16,dur:4},
			{x:272,y:0,h:8,w:16,dur:4}
		],
		[
			{x:240,y:8,h:8,w:16,dur:4},
			{x:256,y:8,h:8,w:16,dur:4},
			{x:272,y:8,h:8,w:16,dur:4}
		]
	]
];

//initialize the player
var player_init = function(player_obj) {
	player_obj.data.health = 10;
	player_obj.data.health_max = 10;
	player_obj.data.stamina = 10;
	player_obj.data.stamina_max = 10;
	player_obj.data.curse = 0;
	player_obj.move_while_attacking = false;
	
	player_obj.data.x = 9*8;
	player_obj.data.y = 8*8;
	player_obj.data.dir = 2;
	player_obj.data.states.is_strafing = false;
	player_obj.data.states.is_moving = false;
	player_obj.data.states.is_attacking = false;
	player_obj.data.speed = 1;
	player_obj.data.base_damage = 1;
	player_obj.data.base_defense = 1;

	player_obj.data.health_regen = 0;
	player_obj.data.stamina_regen = .1;
	player_obj.data.cures_regen = .0001;
	player_obj.data.exp = 0;
	player_obj.data.lvl = 0;
	
	//defaults to a randomized avatar [DEPRICATED?] Overwritten by character creation
	var set = Math.floor(Math.random()*4)*32;
	
	player_obj.avatar.body_style = set;
	player_obj.avatar.head_style = set;
	
	player_obj.inventory.augments = [];
	player_obj.inventory.keys = [];
	
	player_obj.data.b_anim_index = 0;
	player_obj.data.b_anim_counter = -1;
	
	player_obj.inventory.weapons_index = 0;
	player_obj.data.b_anim_curr = 1;
	player_obj.local_audio = [];
}

//move the player across the screen/room
var player_move = function(player_obj, dir, col_map) {
	if (player_obj.data.states.is_moving == true) {
		
		//build up to player's speed in tiny increments. Othewixe if speed is too large, player might skip over objects
		if (player_obj.data.speed_current < player_obj.data.speed) {
			player_obj.data.speed_current+=.0625;
		}
		
		if (dir == 0) {	//facing up
			if (player_obj.data.strafe == false) {	//if we aren't strafing, set the player's dir to up
				player_obj.data.dir = 0;
			}
			var canMove = player_obj.data.speed_current;
			//only move if we aren't about to go off the top of the screen
			if (player_obj.data.y-player_obj.data.speed_current <= 0) {	
				canMove = 0 - (player_obj.data.y-player_obj.data.speed_current);
				if (canMove < 0) {
					canMove = 0;
				}
				player_obj.data.y-=canMove;
			} else {
				canMove =  .25;
				//move in tiney increments up to the calculated max displacement
				while (canMove <= player_obj.data.speed_current) {
					try {
						//static collision detection with environment
						if (col_map[Math.floor((player_obj.data.y-(.25))/8)][Math.floor(Math.floor(player_obj.data.x)/8)] ==0 &&
							col_map[Math.floor((player_obj.data.y-(.25))/8)][Math.ceil(Math.ceil(player_obj.data.x)/8)] ==0) {
							player_obj.data.y-=.25;	//all clear, make the move
						} else {
							break;
						}
						canMove+=.25;
					}
					catch (e) {
						console.log("can't move there...");
						break;
					}
				}
			}
		}
		if (dir == 1) {	//facing left
			if (player_obj.data.strafe == false) {
				player_obj.data.dir = 1;
			}
			var canMove = player_obj.data.speed_current;
			if (player_obj.data.x-player_obj.data.speed_current <= 0) {
				canMove = 0 - (player_obj.data.x-player_obj.data.speed_current);
				if (canMove < 0) {
					canMove = 0;
				}
				if (player_obj.data.x-canMove >= 0) {
					player_obj.data.x-=canMove;
				}
			} else {
				canMove = .25;
				while (canMove <= player_obj.data.speed_current) {
					try {
						if (col_map[Math.floor((Math.floor(player_obj.data.y))/8)][Math.floor((player_obj.data.x-.25)/8)] == 0 &&
							col_map[Math.ceil(((Math.ceil(player_obj.data.y)))/8)][Math.floor((player_obj.data.x-.25)/8)] == 0) {
							
							if (player_obj.data.x-.25 >= 0) {
								player_obj.data.x-=.25;
							}
						} else {
							break;
						}
						canMove+=.25;
					} 
					catch (e) {
						console.log("can't move there...");
						break;
					}
				}
			}	
		}
		if (dir == 2) {	//facing down
			if (player_obj.data.strafe == false) {
				player_obj.data.dir = 2;
			}
			var canMove = player_obj.data.speed_current;
			if (player_obj.data.y+player_obj.data.speed_current+8 >= screen_height-16) {
				canMove = (player_obj.data.y+player_obj.data.speed_current) - screen_height-16;
				if (canMove < 0) {
					canMove = 0;
				}
				player_obj.data.y+=canMove;
			} else {
				canMove = .25;
				while (canMove <= player_obj.data.speed_current) {
					try {
						if (col_map[Math.ceil((player_obj.data.y+.25)/8)][Math.floor(Math.floor(player_obj.data.x)/8)] == 0 &&
							col_map[Math.ceil((player_obj.data.y+.25)/8)][Math.ceil(Math.ceil(player_obj.data.x)/8)] == 0) {
							
							player_obj.data.y+=.25;
						} else {
							break;
						}
						canMove+=.25;
					}
					catch (e) {
						console.log("can't move there...");
						break;
					}
				}
			}	
		}
		if (dir == 3) {	//facing right
			if (player_obj.data.strafe == false) {
				player_obj.data.dir = 3;
			}
			var canMove = player_obj.data.speed_current;
			if (player_obj.data.x+player_obj.data.speed_current+8 >= screen_width) {
				canMove = (player_obj.data.x+player_obj.data.speed_current) - screen_width;
				if (canMove < 0) {
					canMove = 0;
				}
				player_obj.data.x+=canMove;
			} else {
				canMove = .25;
				while (canMove <= player_obj.data.speed_current) {
					try {
						if (col_map[Math.ceil(Math.ceil(player_obj.data.y)/8)][Math.ceil((player_obj.data.x+.25)/8)] == 0 &&
							col_map[Math.floor(Math.floor(player_obj.data.y)/8)][Math.ceil((player_obj.data.x+.25)/8)] == 0) {
						
							player_obj.data.x+=.25;
						} else {
							break;
						}
						canMove+=.25;
					}
					catch (e) {
						console.log("can't move there...");
						break;
					}
				}
			}
		}
	}
}

//updates made to the player per frame
var player_update = function(player_obj, col_map, room_entities, player_augs){  
	player_obj.local_audio = [];	//clear the audio queue
	if (player_obj.data.states.is_dead == false) {	//only update if alive
		
		//invincibility counter
		if (player_obj.data.states.is_invincible == true) {
			player_obj.data.invincibility_counter++;
			if (player_obj.data.invincibility_counter > player_obj.data.invincibility_limit) {
				player_obj.data.states.is_invincible = false;
				player_obj.data.invincibility_counter = 0;
			}
		}
		
		//speed limit b/c 2fast4me
		if (player_obj.data.speed > player_obj.data.speed_limit) {
			player_obj.data.speed = player_obj.data.speed_limit;
		}
		
		//regen health
		player_obj.data.health+=player_obj.data.health_regen;
		if (player_obj.data.health > player_obj.data.health_max) {
			player_obj.data.health = player_obj.data.health_max;
		}
		
		//progress curse
		/*player_obj.curse+=player_obj.cures_regen;
		if (player_obj.curse > player_obj.cures_max) {
			player_obj.curse = player_obj.cures_max;
		}*/
		
		//check on level progression
		if (player_obj.data.exp >= player_obj.data.lvl_next) {
			console.log(player_obj.id+" Leveled up! "+player_obj.data.lvl-1+"->"+player_obj.data.lvl);
			player_obj.data.lvl++;
			player_obj.data.exp_past+=player_obj.data.lvl_next;
			player_obj.data.exp-=player_obj.data.lvl_next;
			player_obj.data.health_max = player_obj.data.health_max+player_obj.data.lvl_reward;
			if (player_obj.data.health_max > player_obj.data.health_limit) {
				player_obj.data.health_max = player_obj.data.health_limit;
			}
			player_obj.data.health = player_obj.data.health_max;
			player_obj.data.stamina_max = player_obj.data.stamina_max+player_obj.data.lvl_reward;
			if (player_obj.data.stamina_max > player_obj.data.stamina_limit) {
				player_obj.data.stamina_max = player_obj.data.stamina_limit;
			}
			player_obj.data.base_defense+=player_obj.data.lvl_reward/5;
			player_obj.data.base_damage+=player_obj.data.lvl_reward/5;
			//diminishing returns of level ups
			player_obj.data.lvl_next = player_obj.data.lvl_next*1.5;
			player_obj.data.lvl_reward = Math.ceil(player_obj.data.lvl/2);
		}
		
		//TO DO GET ABILITES WORKING
		//check if/where the player should be facing
		if (player_obj.pressed_keys.indexOf('J') > -1) {
			player_obj.data.strafe = true;
		} else {
			player_obj.data.strafe = false;
		}
			
		//check for weapon progress
		if (player_obj.inventory.weapons[player_obj.inventory.weapons_index]) {
			if (player_obj.pressed_keys.indexOf('_') < 0 && player_obj.inventory.weapons[player_obj.inventory.weapons_index].swung == true) {
				player_obj.inventory.weapons[player_obj.inventory.weapons_index].swung = false;
			}
			
			//update the weapon
			weapon_update(player_obj, player_obj.inventory.weapons[player_obj.inventory.weapons_index], room_entities, col_map);
		}
		
		//stamina max
		if (player_obj.data.stamina > player_obj.data.stamina_max) {
			player_obj.data.stamina = player_obj.data.stamina_max;
		}
		
		//Check if the use is trying to move the player
		if (player_obj.pressed_keys.indexOf('W') > -1 || player_obj.pressed_keys.indexOf('A')>-1||	//any move keys pressed?
			player_obj.pressed_keys.indexOf('S') > -1 || player_obj.pressed_keys.indexOf('D') > -1) {
			
			if (player_obj.transition_flag != 0 || player_obj.transition_flag != 1 || //Don't want to move during a room change
				player_obj.transition_flag != 2 || player_obj.transition_flag != 3) {
				
				if (player_obj.data.states.is_moving == false && player_obj.data.states.is_attacking == false) {
					player_obj.data.states.is_idle = false;
					player_obj.data.states.is_moving = true;
				}
				if (player_obj.data.b_anim_counter == -1) {
					player_obj.data.b_anim_counter = 0;
				}
				if (player_obj.data.h_anim_counter == -1) {
					player_obj.data.h_anim_counter = 0;
				}
				
				if (player_obj.pressed_keys.indexOf('W') > -1) {
					player_move(player_obj, 0, col_map);
				}
				
				if (player_obj.pressed_keys.indexOf('A') > -1) {
					player_move(player_obj, 1, col_map);
				}
				
				if (player_obj.pressed_keys.indexOf('S') > -1) {
					player_move(player_obj, 2, col_map);
				}
				
				if (player_obj.pressed_keys.indexOf('D') > -1) {
					player_move(player_obj, 3, col_map);
				}
			}
		} else {
			player_obj.data.speed_current = .0625;
			player_obj.data.states.is_moving = false;
		}
		
		//use weapon or regen stamina
		if (player_obj.data.states.is_attacking == true) {
			if (player_obj.data.move_while_attacking == false) {
				player_obj.data.states.is_moving = false;
			}
			if (player_obj.inventory.weapons[player_obj.inventory.weapons_index].cont == false && player_obj.inventory.weapons[player_obj.inventory.weapons_index].swung == false) {
				weapon_action(player_obj.inventory.weapons[player_obj.inventory.weapons_index], player_obj.local_audio); 
			} else if (player_obj.inventory.weapons[player_obj.inventory.weapons_index].cont == true) {
				weapon_action(player_obj.inventory.weapons[player_obj.inventory.weapons_index], player_obj.local_audio);
			}
			
			if (player_obj.data.b_anim_counter == -1) {
				player_obj.data.b_anim_counter = 0;
				player_obj.data.b_anim_index = 0;
			}
			if (player_obj.data.h_anim_counter == -1) {
				player_obj.data.h_anim_counter = 0;
				player_obj.data.h_anim_index = 0;
			}
		} else {
			player_obj.data.stamina = player_obj.data.stamina+player_obj.data.stamina_regen;
		} 
		
		if (player_obj.pressed_keys.indexOf('_') > -1) {
			
			if (player_obj.inventory.weapons[player_obj.inventory.weapons_index] != null) {
				
				if (player_obj.stamina >= player_obj.inventory.weapons[player_obj.inventory.weapons_index].init_cost) {
					player_obj.data.states.is_attacking = true;
					player_obj.data.stamina = player_obj.data.stamina-player_obj.inventory.weapons[player_obj.inventory.weapons_index].init_cost;
				}
				
				//not attacking -> attacking
				if (player_obj.data.states.is_attacking == false && 
					player_obj.data.stamina >= player_obj.inventory.weapons[player_obj.inventory.weapons_index].init_cost && 
					player_obj.inventory.weapons[player_obj.inventory.weapons_index].swung == false) {
					
					player_obj.data.b_anim_index = 0;
					player_obj.data.b_anim_counter = 0;
					player_obj.data.h_anim_index = 0;
					player_obj.data.h_anim_counter = 0;
					
					player_obj.data.states.is_attacking = true;
					player_obj.data.stamina = player_obj.data.stamina-player_obj.inventory.weapons[player_obj.inventory.weapons_index].init_cost;
				}
				
				//attacking -> still attacking
				if (player_obj.data.states.is_attacking == true && player_obj.inventory.weapons[player_obj.inventory.weapons_index].cont == true){
					player_obj.data.stamina = player_obj.data.stamina-player_obj.inventory.weapons[player_obj.inventory.weapons_index].use_cost;
					if (player_obj.data.stamina < -1) {
						player_obj.data.states.is_attacking = false;
						player_obj.data.stamina = -1;
					}
				}
			}
		} else {
			if (player_obj.data.states.is_attacking == true && player_obj.inventory.weapons[player_obj.inventory.weapons_index].cont == true){
				player_obj.data.states.is_attacking = false;
				player_obj.inventory.weapons[player_obj.inventory.weapons_index].actioning = false;
			}
		}
		
		if (player_obj.data.states.is_moving == false && player_obj.data.states.is_attacking == false) {
			player_obj.data.states.is_idle = true;
		}
		
		if (player_obj.data.health <=0 || player_obj.data.curse >=10) {
			player_obj.data.states.is_dead = true;
		}

		//update player status/pickup
		if (player_obj.data.status_count > -1) {
			player_obj.data.status_count = player_obj.data.status_count-1;
			if (player_obj.data.status_count <= -1) {
				player_obj.data.status_new = -1;
			}
		}
		
		//check for idle animation set
		if (player_obj.data.states.is_idle == true) {
			player_obj.data.h_anim_curr = 0;
			player_obj.data.b_anim_curr = 1;
		}
		
		//check for moving animation set
		if (player_obj.data.states.is_moving == true) {
			player_obj.data.h_anim_curr = 0;
			player_obj.data.b_anim_curr = 2;
		}
		
		//check for attacking animation set
		if (player_obj.data.states.is_attacking == true) {
			player_obj.data.h_anim_curr = 0;
			player_obj.data.b_anim_curr = 3;
		}
		
		//if the player isn't idle, bob their head
		if (player_obj.data.states.is_idle == false) {
			player_obj.data.headbob = 1;
		} else {
			player_obj.data.headbob = 0;
		}  
		
		//ensure we're within the current animation
		if (player_obj.data.b_anim_index >= player_animations[player_obj.data.b_anim_curr][player_obj.data.dir].length) {
			player_obj.data.b_anim_index = 0;
		}
		if (player_obj.data.h_anim_index >= player_animations[player_obj.data.h_anim_curr][player_obj.data.dir].length) {
			player_obj.data.h_anim_index = 0;
		}
		
		//progress current animation 
		if (player_obj.data.states.is_attacking == true) {	//match weapon animation speed if attacking
			var frame_dur = player_obj.inventory.weapons[player_obj.inventory.weapons_index].hitbox[player_obj.data.dir][player_obj.inventory.weapons[player_obj.inventory.weapons_index].atkIndex].dur;
			//console.log(frame_dur);
		} else {
			var frame_dur = player_animations[player_obj.data.b_anim_curr][player_obj.data.dir][player_obj.data.b_anim_index].dur;
		}
		player_obj.data.b_anim_counter++;
		if (player_obj.data.b_anim_counter >= frame_dur) {
			player_obj.data.b_anim_counter = 0;
			player_obj.data.b_anim_index++;
			if (player_obj.data.b_anim_index >= player_animations[player_obj.data.b_anim_curr][player_obj.data.dir].length) {
				player_obj.data.b_anim_index = 0;
			}
		}
		player_obj.data.h_anim_counter++;
		if (player_obj.data.h_anim_counter >= player_animations[player_obj.data.h_anim_curr][player_obj.data.dir][player_obj.data.h_anim_index].dur) {
			player_obj.data.h_anim_counter = 0;
			player_obj.data.h_anim_index++;
			if (player_obj.data.h_anim_index >= player_animations[player_obj.data.h_anim_curr][player_obj.data.dir].length) {
				player_obj.data.h_anim_index = 0;
			}
		}
		
		
		
		if (player_obj.data.states.is_idle == true) {
			player_obj.data.idle_timer--;
			if (player_obj.data.idle_timer < 0) {
				player_obj.data.idle_timer = 0;
			}
		} else {
			player_obj.data.idle_timer = 100;
		}
	} else {
		/*player_obj.data.health = 0;
		player_obj.data.stamina = 0;
		player_obj.data.curse = 0;
		player_obj.inventory.keys = [];
		//player_obj.data.x = 0;
		//player_obj.data.y = 0;
		player_obj.data.exp = 0;
		player_obj.data.lvl = 0;*/
		
		if (player_obj.death_bag != null) {
			drop_bag(player_obj, room_entities);
		}
	}	
}

//drop bag containing player inventory upon death
function drop_bag(player_obj, contents) {
	console.log("dropping bag");
	if (player_obj.death_bag != null) {
		var new_bag = player_obj.death_bag;
		new_bag.data.keys = player_obj.inventory.keys;
		new_bag.data.augs = player_obj.inventory.augments;
		new_bag.data.weapons = player_obj.inventory.weapons;
		new_bag.data.loc.x = player_obj.data.x;
		new_bag.data.loc.y = player_obj.data.y;
		new_bag.data.exp = player_obj.data.exp+player_obj.data.exp_past;
		contents.push(new_bag);
		player_obj.death_bag = null;
	}
}

//updates made to the player's equipped weapon per frame
function weapon_update(player_obj, wep, room_entities, room_col, audio_queue) {
			
	if (wep.actioning == true) {
		wep.durCount++;
		
		if (wep.buffs.indexOf("electric") > -1) {
			lightning_attack(player_obj, wep, room_entities);
		}
		
		//loop through the active mobs and see if we're hitting anything
		for (var i=0; i<room_entities.length; i++) {
			if (room_entities[i] != null) {
				if (room_entities[i].data.type == 'mob' || room_entities[i].data.type == 'boss') {
				
					var lower_x = (room_entities[i].data.loc.x)+(room_entities[i].data.hit_box.x);
					var upper_x = (room_entities[i].data.loc.x)+(room_entities[i].data.hit_box.x)+(room_entities[i].data.hit_box.w);
					var lower_y = (room_entities[i].data.loc.y)+(room_entities[i].data.hit_box.y);
					var upper_y = (room_entities[i].data.loc.y)+(room_entities[i].data.hit_box.y)+(room_entities[i].data.hit_box.h);
					
					//2 == mob
					//1 == wep
					
					if (room_entities[i].data.states.is_dead == false &&	//if mob isn't dead
						room_entities[i].data.states.is_invincible == false &&
						!(	lower_x > player_obj.data.x+wep.hitbox[player_obj.data.dir][wep.atkIndex].x+wep.hitbox[player_obj.data.dir][wep.atkIndex].w || 
							upper_x < player_obj.data.x+wep.hitbox[player_obj.data.dir][wep.atkIndex].x || 
							lower_y > player_obj.data.y+wep.hitbox[player_obj.data.dir][wep.atkIndex].y+wep.hitbox[player_obj.data.dir][wep.atkIndex].h ||
							upper_y < player_obj.data.y+wep.hitbox[player_obj.data.dir][wep.atkIndex].y)) {
						
						
						//apply damage to enemy
						room_entities[i].data.health = room_entities[i].data.health-((player_obj.data.base_damage+wep.damage)+player_obj.data.curse*wep.curseScale);
						room_entities[i].data.hit_flash = true;
						room_entities[i].data.states.is_invincible = true;
						room_entities[i].data.invincibility_counter = 0;
						room_entities[i].data.hit_by = player_obj.id;
						
						if (wep.buffs.indexOf("fire") > -1) {
							room_entities[i].data.states.is_enflamed = true;
							room_entities[i].data.states.enflamed_count += 480;
						}
						
						//knock the enemy back
						if (player_obj.data.dir == 0) {
							if (Math.floor((lower_y-wep.knockback)/tile_size) > 0 && 
								Math.floor((upper_y-wep.knockback)/tile_size) < 15 &&
								Math.floor((lower_x)/tile_size) > 0 &&
								Math.floor((upper_x)/tile_size) < 19) {
								
								if (room_col[Math.floor((lower_y-wep.knockback)/tile_size)][Math.floor((lower_x)/tile_size)] == 0) {
									room_entities[i].data.loc.y = room_entities[i].data.loc.y-wep.knockback;
								}
							}
						}
						if (player_obj.data.dir == 1) {
							if (Math.floor((lower_y)/tile_size) > 0 && 
								Math.floor((upper_y)/tile_size) < 15 &&
								Math.floor((lower_x-wep.knockback)/tile_size) > 0 &&
								Math.floor((upper_x-wep.knockback)/tile_size) < 19) {
									
								if (room_col[Math.floor((lower_y)/tile_size)][Math.floor((lower_x-wep.knockback)/tile_size)] == 0) {
									room_entities[i].data.loc.x = room_entities[i].data.loc.x-wep.knockback;
								}
							}
						}
						if (player_obj.data.dir == 2) {
							if (Math.floor((lower_y+wep.knockback)/tile_size) > 0 && 
								Math.floor((upper_y+wep.knockback)/tile_size) < 15 &&
								Math.floor((lower_x)/tile_size) > 0 &&
								Math.floor((upper_x)/tile_size) < 19) {
							
								if (room_col[Math.floor((upper_y+wep.knockback)/tile_size)][Math.floor((lower_x)/tile_size)] == 0) {
									room_entities[i].data.loc.y = room_entities[i].data.loc.y+wep.knockback;
								}
							}	
						}
						if (player_obj.data.dir == 3) {
							if (Math.floor((lower_y)/tile_size) > 0 && 
								Math.floor((upper_y)/tile_size) < 15 &&
								Math.floor((lower_x+wep.knockback)/tile_size) > 0 &&
								Math.floor((upper_x+wep.knockback)/tile_size) < 19) {
							
								if (room_col[Math.floor((lower_y)/tile_size)][Math.floor((upper_x+wep.knockback)/tile_size)] == 0) {
									room_entities[i].data.loc.x = room_entities[i].data.loc.x+wep.knockback;
								}
							}
						}
											
					}
				}
			}
			
		}
		
		//simulate the moving hitbox
		if (wep.durCount > wep.hitbox[player_obj.data.dir][wep.atkIndex].dur) {
			wep.durCount = 0;
			wep.atkIndex++;
			if (wep.atkIndex >= wep.hitbox[player_obj.data.dir].length) {
				wep.atkIndex = 0;
				wep.actioning = false;
				if (wep.cont == false) {
					player_obj.data.states.is_attacking = false;
				}
			}
		}
	}
	
	if (wep.buffs.indexOf("electric") > -1) {
		for (var i=0; i<wep.target_tiles.length; i++) {
			lightning_tile_update(player_obj, wep.target_tiles[i], room_entities);
		}
	}
}

//start action of weapon
function weapon_action(wep, audio_queue) {
	if (wep.actioning == false) {
		//console.log("swingign")
		audio_queue.push(0);
		wep.actioning = true;
		wep.swung = true;
		wep.durCount = 0;
	}
}

//lightening attack update used with lightning sword
var lightning_attack = function(player_obj, wep, room_entities) {	
	
	//console.log("initializing the tiles");
	if (wep.target_tiles.length <=0) {
		make_tiles();
	} else {
		var all_clear = true;
		for (var i=0; i<wep.target_tiles.length; i++) {
			if (wep.target_tiles[i].active == true) {
				all_clear = false;
			}
		}
		
		if (all_clear == true) {
			make_tiles();
		}
		
	}
	
	function make_tiles() {
		var x_range = [0,19*8];
		var y_range = [0,16*8];
		/*switch(player_obj.data.dir) {
			case	0:	x_range = [player_obj.data.x-16, player_obj.data.x+16]
						y_range = [0, player_obj.data.y];
						break;
			case	1:	x_range = [0, player_obj.data.x];
						y_range = [player_obj.data.y-16, player_obj.data.y+16]
						break;
			case	2:	x_range = [player_obj.data.x-16, player_obj.data.x+16]
						y_range = [player_obj.data.y+8, screen_height-16];
						break;
			case	3:	x_range = [player_obj.data.x, screen_width];
						y_range = [player_obj.data.y-16, player_obj.data.y+16]
						break;
		}*/
		for (var i=0; i<13; i++) {
			var new_point = {
				x:(Math.floor(Math.random()*(x_range[1]-x_range[0]))+x_range[0]),
				y:(Math.floor(Math.random()*(y_range[1]-y_range[0]))+y_range[0]),
				hit_box:{x:0, y:0, w:8, h: 8},
				damage: 5,
				charge_time_limit: 15,
				charge_time:0,
				electric_time_limit: 30,
				electric_time:0,
				is_electric:false,
				active:true	
			}
			wep.target_tiles.push(new_point);
		}
	}
}

//updates for the lightning tiles spawned by the lightning sword
var lightning_tile_update = function(player_obj, tile, room_contents) {
	if (tile.active == true) {
		if (tile.is_electric == false) {
			tile.charge_time++;
			if (tile.charge_time >= tile.charge_time_limit) {
				tile.is_electric = true;
				tile.charge_time = 0;
			}
		} else {
			tile.electric_time++;
			if (tile.electric_time >= tile.electric_time_limit) {
				tile.is_electric = false;
				tile.electric_time = 0;
				tile.x = -1;
				tile.y = -1;
				tile.active = false;
			}
			
			for (var i=0; i<room_contents.length; i++) {
				if (room_contents[i] != null) {
					if (room_contents[i].data.type == "mob" || room_contents[i].data.type == "boss") {
						if (room_contents[i].data.states.is_invincible == false && room_contents[i].data.states.is_dead == false &&
							!(	(tile.x)+(tile.hit_box.x) > (room_contents[i].data.x)+(room_contents[i].data.hit_box.x)+(room_contents[i].data.hit_box.w) || 
								(tile.x)+(tile.hit_box.x)+(tile.hit_box.w) < (room_contents[i].data.x)+(room_contents[i].data.hit_box.x) || 
								(tile.y)+(tile.hit_box.y) > (room_contents[i].data.y)+(room_contents[i].data.hit_box.y)+(room_contents[i].data.hit_box.h) ||
								(tile.y)+(tile.hit_box.y)+(tile.hit_box.h) < (room_contents[i].data.y)+(room_contents[i].data.hit_box.y))) {
								
							
							room_contents[i].data.health = room_contents[i].data.health-(tile.damage);
							if (room_contents[i].data.health <=0) {
								room_contents[i].data.states.is_dead = true;
								player_obj.data.exp = player_obj.data.exp+room_contents[i].data.exp_reward;
								player_obj.data.curse = player_obj.data.curse + room_contents[i].data.cursePenalty;
							} else {
								room_contents[i].data.states.is_invincible = true;
								room_contents[i].data.invincibility_counter = 0;
								room_contents[i].data.states.is_stunned = true;
								room_contents[i].data.states.stunned_count = 120;
							}
						}
					}
				}
				
			}
		}	
	}
}

//renders the player to the screen
var player_draw = function(player_obj) {  
	if (player_obj.data.invincibility_counter%2 == 0) {
		
		//draw player status/pickup
		if (player_obj.data.status_count > -1) {
			render_queue.push({action: 0, sprite:player_obj.data.status_new, x:player_obj.data.x, y: player_obj.data.y-20});
		}
		
		//draw body
		var render_batch = {
			action: 3,
			batch: [
				{	action: 1,
					sheet: extended_player_sheet,
					sheet_x: player_animations[player_obj.data.b_anim_curr][player_obj.data.dir][player_obj.data.b_anim_index].x,
					sheet_y: player_animations[player_obj.data.b_anim_curr][player_obj.data.dir][player_obj.data.b_anim_index].y+(player_obj.avatar.skin*64)+32-(player_obj.avatar.gender*32),
					sheet_w: player_animations[player_obj.data.b_anim_curr][player_obj.data.dir][player_obj.data.b_anim_index].w,
					sheet_h: player_animations[player_obj.data.b_anim_curr][player_obj.data.dir][player_obj.data.b_anim_index].h,
					x: player_obj.data.x-4, 
					y: player_obj.data.y,
					w: 16,
					h: 8
				}
			],
			x: player_obj.data.x-4,
			y: player_obj.data.y
		}
		
		//draw weapon
		weapon_draw(player_obj, player_obj.inventory.weapons[player_obj.inventory.weapons_index], render_batch);
		
		//draw head
		render_batch.batch.push({
			action: 1,
			sheet: extended_player_sheet,
			sheet_x: player_animations[player_obj.data.h_anim_curr][player_obj.data.dir][player_obj.data.h_anim_index].x+player_obj.avatar.skin*64,
			sheet_y: player_animations[player_obj.data.h_anim_curr][player_obj.data.dir][player_obj.data.h_anim_index].y+(player_obj.avatar.hair*16)+80-(player_obj.avatar.gender*80),
			sheet_w: player_animations[player_obj.data.h_anim_curr][player_obj.data.dir][player_obj.data.h_anim_index].w,
			sheet_h: player_animations[player_obj.data.h_anim_curr][player_obj.data.dir][player_obj.data.h_anim_index].h,
			x: player_obj.data.x-4,
			y: player_obj.data.y-16+player_obj.data.headbob,
			w: 16,
			h: 16
		});
		
		var aug_data = augment_draw(player_obj.data.states, player_obj.data.dir);
		//draw augments
		for (var i=0; i<player_obj.inventory.augments.length; i++) {
			try {
				//body
				render_batch.batch.push({
					action: 1,
					sheet: player_sheet,
					sheet_x: aug_data.b[player_obj.data.b_anim_index].x,
					sheet_y: aug_data.b[player_obj.data.b_anim_index].y+player_obj.inventory.augments[i].sprite_space,
					sheet_w: aug_data.b[player_obj.data.b_anim_index].w,
					sheet_h: aug_data.b[player_obj.data.b_anim_index].h,
					x: player_obj.data.x-4, 
					y: player_obj.data.y,
					w: 16,
					h: 8
				});
				
			} catch (e) {
				
			}
			
			try {
				//head
				render_batch.batch.push({
					action: 1,
					sheet: player_sheet,
					sheet_x: aug_data.h[player_obj.data.h_anim_index].x,
					sheet_y: aug_data.h[player_obj.data.h_anim_index].y+player_obj.inventory.augments[i].sprite_space,
					sheet_w: aug_data.h[player_obj.data.h_anim_index].w,
					sheet_h: aug_data.h[player_obj.data.h_anim_index].h,
					x: player_obj.data.x-4, 
					y: player_obj.data.y-15+player_obj.data.headbob,
					w: 16,
					h: 16
				});
				
			} catch (e) {
				
			}
		}
		
		if (player_obj.data.idle_timer == 0) {
			for (var i=0; i<player_obj.avatar.name.length; i++) {
				render_batch.batch.push({
					action: 1,
					sheet: menu_sheet, 
					sheet_x: 192, 
					sheet_y: (player_obj.avatar.name[i]*5)+80,
					sheet_w: 4,
					sheet_h: 5, 
					x: player_obj.data.x-4+(i*3),
					y: player_obj.data.y-16,
					w: 4,
					h: 5
				});
			}
		}
		render_queue.push(render_batch);
	}
	
	if (show_hitboxes == true) {
		render_queue.push({action: 2, color: "blue", x: player_obj.data.x, y: player_obj.data.y, w: 1, h: 1});
		render_queue.push({action: 2, color: "blue", x: player_obj.data.x+8, y: player_obj.data.y, w: 1, h: 1});
		render_queue.push({action: 2, color: "blue", x: player_obj.data.x, y: player_obj.data.y+8, w: 1, h: 1});
		render_queue.push({action: 2, color: "blue", x: player_obj.data.x+8, y: player_obj.data.y+8, w: 1, h: 1});
	}
}

//renders the player's equipeed weapon
function weapon_draw(player_obj, wep, render_batch) {
	if (wep.actioning == true) {
		/*ctx.drawImage(
			weapon_sheet, 
			wep.animations[player_obj.data.dir][wep.atkIndex].x, wep.animations[player_obj.data.dir][wep.atkIndex].y, 
			wep.animations[player_obj.data.dir][wep.atkIndex].w, wep.animations[player_obj.data.dir][wep.atkIndex].h,
			player_obj.data.x-12, player_obj.data.y-16, 
			wep.animations[player_obj.data.dir][wep.atkIndex].w, wep.animations[player_obj.data.dir][wep.atkIndex].h
		);*/
		render_batch.batch.push({
			action: 1,
			sheet: weapon_sheet, 
			sheet_x: wep.animations[player_obj.data.dir][wep.atkIndex].x,
			sheet_y: wep.animations[player_obj.data.dir][wep.atkIndex].y, 
			sheet_w: wep.animations[player_obj.data.dir][wep.atkIndex].w, 
			sheet_h: wep.animations[player_obj.data.dir][wep.atkIndex].h,
			x: player_obj.data.x-12,
			y: player_obj.data.y-16, 
			w: wep.animations[player_obj.data.dir][wep.atkIndex].w,
			h: wep.animations[player_obj.data.dir][wep.atkIndex].h
			});
	}
	
	if (wep.buffs.indexOf("electric") > -1) {
		for (var i=0; i<wep.target_tiles.length; i++) {
			lightning_tile_draw(wep.target_tiles[i]);
		}
	}
	
	if (show_hitboxes == true) {
		render_queue.push({
			action: 2, 
			color: "red", 
			x: player_obj.data.x+wep.hitbox[player_obj.data.dir][wep.atkIndex].x, 
			y: player_obj.data.y+wep.hitbox[player_obj.data.dir][wep.atkIndex].y, 
			w: 1, 
			h: 1
		});
		render_queue.push({
			action: 2, 
			color: "red", 
			x: player_obj.data.x+wep.hitbox[player_obj.data.dir][wep.atkIndex].x+wep.hitbox[player_obj.data.dir][wep.atkIndex].w, 
			y: player_obj.data.y+wep.hitbox[player_obj.data.dir][wep.atkIndex].y, 
			w: 1, 
			h: 1
		});
		render_queue.push({
			action: 2, 
			color: "red", 
			x: player_obj.data.x+wep.hitbox[player_obj.data.dir][wep.atkIndex].x, 
			y: player_obj.data.y+wep.hitbox[player_obj.data.dir][wep.atkIndex].y+wep.hitbox[player_obj.data.dir][wep.atkIndex].h, 
			w: 1, 
			h: 1
		});
		render_queue.push({
			action: 2, 
			color: "red", 
			x: player_obj.data.x+wep.hitbox[player_obj.data.dir][wep.atkIndex].x+wep.hitbox[player_obj.data.dir][wep.atkIndex].w, 
			y: player_obj.data.y+wep.hitbox[player_obj.data.dir][wep.atkIndex].y+wep.hitbox[player_obj.data.dir][wep.atkIndex].h, 
			w: 1, 
			h: 1
		});
	}
}

//renders a lightning tile
var lightning_tile_draw = function (tile) {
	if (tile.active == true) {
		if (tile.is_electric == false) {
			//ctx.fillStyle = "cyan";
			//ctx.fillRect(tile.x, tile.y, 8,8);
			if (blink == false) {
				render_queue.push({
					action: 1,
					sheet: sprite_sheet,
					sheet_x: 40,
					sheet_y: 232,
					sheet_w: 8,
					sheet_h: 8,
					x: tile.x,
					y: tile.y,
					w: 8,
					h: 8
				});
			} else {
				render_queue.push({
					action: 1,
					sheet: sprite_sheet,
					sheet_x: 40,
					sheet_y: 224,
					sheet_w: 8,
					sheet_h: 8,
					x: tile.x,
					y: tile.y,
					w: 8,
					h: 8
				});
			}
		} else {
			var lightning_batch = {
				action: 3,
				batch: [
				],
				x:tile.x,
				y:tile.y
			}
			for (var i=0; i<tile.y+8; i+=8) {
				var sprite = lightning_sprites[Math.floor(Math.random()*lightning_sprites.length)];
				lightning_batch.batch.push({
					action: 1,
					sheet: sprite_sheet,
					sheet_x: sprite.x,
					sheet_y: sprite.y,
					sheet_w: sprite.w,
					sheet_h: sprite.h,
					x: tile.x,
					y: i,
					w: sprite.w,
					h: sprite.h
				});
			}
			//ctx.fillStyle = "yellow";
			//ctx.fillRect(tile.x, tile.y, 8,8);
			var sprite = lightning_tile_sprites[Math.floor(Math.random()*lightning_tile_sprites.length)];
			lightning_batch.batch.push({
				action: 1,
				sheet: sprite_sheet,
				sheet_x: sprite.x,
				sheet_y: sprite.y,
				sheet_w: sprite.w,
				sheet_h: sprite.h,
				x: tile.x,
				y: tile.y,
				w: sprite.w,
				h: sprite.h
			});
			
			render_queue.push(lightning_batch);
		}
	}
}

try {
	module.exports = {
		player_init:player_init,
		player_move:player_move,
		player_update:player_update,
		player_draw:player_draw,
		drop_bag:drop_bag
	}	
}
catch (e) {
	console.log("ERROR; Unable to export player modules");
}

