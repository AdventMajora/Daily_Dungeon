var screen_width = 160;		        //Game Resolution Width
var screen_height = 144;		    //Game Resolution Height
var tile_size = 8;
////////////////////////////////room entities/////////////////////////////

var ent_aug = {
	data:{
		type: 'aug', 
		sprite: [614,615], 
		loc: {x: 9*8, y: 8*8}, 
		hit_box: {x:0,y:0,w:8,h:8},
		collected: false,
		aug: -1
	}
};
var ent_key = {
	data:{
		type: 'key',
		sprite: [581, 580], 
		loc: {x: 9*8, y: 8*8}, 
		hit_box: {x:0,y:0,w:8,h:8},
		collected: false,
	}
};
var ent_drop = {
	data:{
		type: 'drop',
		sprite: [614],
		loc: {x:-1,y:-1},
		hit_box: {x:0,y:0,w:8,h:8},
		collected: false
	}	
};
var ent_goal = {
	data:{
		type: 'goal',
		sprite: [613],
		loc: {x: 9.5*8, y: 8*8},
		hit_box: {x:0,y:0,w:8,h:8},
		diff: -1
	}
};
var ent_chest = {
	data:{
		type: 'chest',
		sprite: [544, 543], 
		loc: {x: 9*8, y: 8*8},
		hit_box: {x:0,y:0,w:8,h:8},
		open: false,
		contents:'drop',
		augType: -1,
		diff: -1
	}
};	
var ent_bag = {
	data:{
		type: 'bag',
		sprite: [616],
		loc: {x:-1, y:-1},
		hit_box: {x:0,y:0,w:8,h:8},
		collected: false,
		cooldown:90,
		exp:0,
		keys:[],
		augs:[],
		weapons:[]
	}
}
var ent_key_door = {
	data:{
		loc:{
			x:-1,
			y:-1
		},
		room: {
			x:-1,
			y:-1
		},
		hit_box:{	//relative to loc
			x:0,
			y:0,
			w:-1,
			h:-1
		},
		color: "red",
		type: 'door',
		config: 0,
		keys_needed:1,
		tiles:[],
		locked:true
	}
}
var ent_wep = {
	data:{
		type: 'wep', 
		sprite: [614,615], 
		loc: {x: 9*8, y: 8*8}, 
		hit_box: {x:0,y:0,w:8,h:8},
		collected: false,
		wep: -1
	}
}

var ent_wep_update_func = function ent_wep_update(entity, players, weps_list, room_contents) {
	for (var i=0; i< players.length; i++) {
		if (!(	(entity.data.loc.x)+(entity.data.hit_box.x) > (players[i].data.x)+(players[i].data.hit_box.x)+(players[i].data.hit_box.w) || 
				(entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w) < (players[i].data.x)+(players[i].data.hit_box.x) || 
				(entity.data.loc.y)+(entity.data.hit_box.y) > (players[i].data.y)+(players[i].data.hit_box.y)+(players[i].data.hit_box.h) ||
				(entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h) < (players[i].data.y)+(players[i].data.hit_box.y)) &&
			entity.data.collected == false) {
			console.log("weapon: "+ entity.data.wep+" collected");
			
			
			players[i].inventory.weapons.push(JSON.parse(JSON.stringify(weps_list[entity.data.wep])));
			players[i].data.status_count = 50;
			//players[i].data.status_new = augments[entity.data.aug].sprite;
			if (players[i].inventory.weapons.length > players[i].inventory.weapons_max) {
				var new_wep = JSON.parse(JSON.stringify(ent_wep));
				new_wep.data.wep = players[i].inventory.weapons[0].index;
				players[i].inventory.weapons.shift();
				
				switch(players[i].data.dir) {
					case	0:	new_wep.data.loc = {x: players[i].data.x, y:players[i].data.y+players[i].data.hit_box.y+players[i].data.hit_box.h+4};
								break;
					case	1:	new_wep.data.loc = {x: players[i].data.x+players[i].data.hit_box.x+players[i].data.hit_box.w+4, y:players[i].data.y};
								break;
					case	2:	new_wep.data.loc = {x: players[i].data.x, y:players[i].data.y+players[i].data.hit_box.y-(entity.data.hit_box.h)-4};
								break;
					case	3:	new_wep.data.loc = {x: players[i].data.x+players[i].data.hit_box.x-(entity.data.hit_box.w)-4, y:players[i].data.y};
								break;
				}
				room_contents.push(new_wep);
			}
			entity.data.collected = true;
			break;
		}
	}
}
var ent_wep_draw_func = function ent_wep_draw(entity) {
	if (entity.data.collected == false) {	
		if (blink == true) {
			render_queue.push({action: 0, sprite: weps[entity.data.wep].sprite, x: entity.data.loc.x, y: entity.data.loc.y});
		} else {
			render_queue.push({action: 0, sprite: weps[entity.data.wep].sprite, x: entity.data.loc.x, y: entity.data.loc.y-1});
		}
	}
	if (show_hitboxes == true) {
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x), y: (entity.data.loc.y)+(entity.data.hit_box.y), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w), y: (entity.data.loc.y)+(entity.data.hit_box.y), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x), y: (entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w), y: (entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h), w: 1, h: 1});
	}
}

var ent_aug_update_func = function ent_aug_update(entity, players, augs_list, room_contents) {
	for (var i=0; i< players.length; i++) {
		if (!(	(entity.data.loc.x)+(entity.data.hit_box.x) > (players[i].data.x)+(players[i].data.hit_box.x)+(players[i].data.hit_box.w) || 
				(entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w) < (players[i].data.x)+(players[i].data.hit_box.x) || 
				(entity.data.loc.y)+(entity.data.hit_box.y) > (players[i].data.y)+(players[i].data.hit_box.y)+(players[i].data.hit_box.h) ||
				(entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h) < (players[i].data.y)+(players[i].data.hit_box.y)) &&
			entity.data.collected == false) {
			players[i].inventory.augments.push(JSON.parse(JSON.stringify(augs_list[entity.data.aug].data)));
			players[i].data.status_count = 50;
			//players[i].data.status_new = augments[entity.data.aug].sprite;
			if (players[i].inventory.augments.length > players[i].inventory.augments_max) {
				augs_list[players[i].inventory.augments[0].index].onDrop(players[i]);
				
				var new_aug = JSON.parse(JSON.stringify(ent_aug));
				new_aug.data.aug = players[i].inventory.augments[0].index;
				players[i].inventory.augments.shift();
				switch(players[i].data.dir) {
					case	0:	new_aug.data.loc = {x: players[i].data.x, y:players[i].data.y+players[i].data.hit_box.y+players[i].data.hit_box.h+4};
								break;
					case	1:	new_aug.data.loc = {x: players[i].data.x+players[i].data.hit_box.x+players[i].data.hit_box.w+4, y:players[i].data.y};
								break;
					case	2:	new_aug.data.loc = {x: players[i].data.x, y:players[i].data.y+players[i].data.hit_box.y-(entity.data.loc.y+entity.data.hit_box.y+entity.data.hit_box.h)-4};
								break;
					case	3:	new_aug.data.loc = {x: players[i].data.x+players[i].data.hit_box.x-(entity.data.loc.x+entity.data.hit_box.x+entity.data.hit_box.w)-4, y:players[i].data.y};
								break;
				}
				room_contents.push(new_aug);
			}
			augs_list[entity.data.aug].onPickup(players[i]);
			entity.data.collected = true;
			break;
		}
	}
}
var ent_aug_draw_func = function ent_aug_draw(entity) {
	if (entity.data.collected == false) {	
		if (blink == true) {
			render_queue.push({action: 0, sprite: augments[entity.data.aug].data.sprite, x: entity.data.loc.x, y: entity.data.loc.y});
		} else {
			render_queue.push({action: 0, sprite: augments[entity.data.aug].data.sprite, x: entity.data.loc.x, y: entity.data.loc.y-1});
		}
	}
	if (show_hitboxes == true) {
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x), y: (entity.data.loc.y)+(entity.data.hit_box.y), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w), y: (entity.data.loc.y)+(entity.data.hit_box.y), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x), y: (entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w), y: (entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h), w: 1, h: 1});
	}
}

var ent_key_update_func = function ent_key_update(entity, players) {
	for (var i=0; i<players.length; i++) {
		if (!(	(entity.data.loc.x)+(entity.data.hit_box.x) > (players[i].data.x)+(players[i].data.hit_box.x)+(players[i].data.hit_box.w) || 
				(entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w) < (players[i].data.x)+(players[i].data.hit_box.x) || 
				(entity.data.loc.y)+(entity.data.hit_box.y) > (players[i].data.y)+(players[i].data.hit_box.y)+(players[i].data.hit_box.h) ||
				(entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h) < (players[i].data.y)+(players[i].data.hit_box.y)) &&
			entity.data.collected == false) {
			players[i].inventory.keys.push(entity.data);
			//keys_remaining--;
			players[i].data.status_new = 581;
			players[i].data.status_count = 50;
			entity.data.collected = true;
			break;
		}
	}
}
var ent_key_draw_func = function ent_key_draw(entity) {
	if (entity.data.collected == false) {	
		//drawSprite(entity.data.sprite[0], entity.data.loc.x, entity.data.loc.y);
		render_queue.push({action: 0, sprite: entity.data.sprite[0], x: entity.data.loc.x, y: entity.data.loc.y});		
	}
	if (show_hitboxes == true) {
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x), y: (entity.data.loc.y)+(entity.data.hit_box.y), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w), y: (entity.data.loc.y)+(entity.data.hit_box.y), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x), y: (entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w), y: (entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h), w: 1, h: 1});
	}
}

var ent_drop_update_func = function ent_drop_update(entity, players) {
	for (var i=0; i<players.length; i++) {
		if (!(	(entity.data.loc.x)+(entity.data.hit_box.x) > (players[i].data.x)+(players[i].data.hit_box.x)+(players[i].data.hit_box.w) || 
				(entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w) < (players[i].data.x)+(players[i].data.hit_box.x) || 
				(entity.data.loc.y)+(entity.data.hit_box.y) > (players[i].data.y)+(players[i].data.hit_box.y)+(players[i].data.hit_box.h) ||
				(entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h) < (players[i].data.y)+(players[i].data.hit_box.y)) &&
			entity.data.collected == false) {
			players[i].data.health = players[i].data.health+1;
			players[i].data.status_new = 999;
			players[i].data.status_count = 50;
			entity.data.collected = true;
			break;
		}
	}
}
var ent_drop_draw_func = function ent_drop_draw(entity) {
	if (entity.data.collected == false) {
		//drawSprite(entity.data.sprite[0], entity.data.loc.x, entity.data.loc.y);
		render_queue.push({action: 0, sprite: entity.data.sprite[0], x: entity.data.loc.x, y: entity.data.loc.y});		
	}
	if (show_hitboxes == true) {
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x), y: (entity.data.loc.y)+(entity.data.hit_box.y), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w), y: (entity.data.loc.y)+(entity.data.hit_box.y), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x), y: (entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w), y: (entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h), w: 1, h: 1});
	}
}

var ent_chest_update_func = function ent_chest_update(entity, players, room_contents) {
	for (var i=0; i<players.length; i++) {
		if (!(	(entity.data.loc.x)+(entity.data.hit_box.x) > (players[i].data.x)+(players[i].data.hit_box.x)+(players[i].data.hit_box.w) || 
				(entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w) < (players[i].data.x)+(players[i].data.hit_box.x) || 
				(entity.data.loc.y)+(entity.data.hit_box.y) > (players[i].data.y)+(players[i].data.hit_box.y)+(players[i].data.hit_box.h) ||
				(entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h) < (players[i].data.y)+(players[i].data.hit_box.y)) &&
			entity.data.open == false) {
			
				entity.data.open = true;
				if (entity.data.contents == 'key') {
					room_contents.push(Object.assign(true, {}, ent_key));
				} else if (entity.data.contents == 'aug'){
					room_contents.push(Object.assign(true, {}, ent_aug));
					room_contents[room_contents.length-1].aug = entity.data.augType;
				}else {
					room_contents.push(Object.assign(true, {}, ent_drop));
				}
				
				room_contents[room_contents.length-1].data.loc.x = players[i].data.x;
				room_contents[room_contents.length-1].data.loc.y = players[i].data.y;
				break;
		}
	}
}
var ent_chest_draw_func = function ent_chest_draw(entity) {
	if (entity.data.open == false) {
		//drawSprite(entity.data.sprite[0], entity.data.loc.x, entity.data.loc.y);
		render_queue.push({action: 0, sprite: entity.data.sprite[0], x: entity.data.loc.x, y: entity.data.loc.y});		
	} else {
		//drawSprite(entity.data.sprite[1], entity.data.loc.x, entity.data.loc.y);
		render_queue.push({action: 0, sprite: entity.data.sprite[1], x: entity.data.loc.x, y: entity.data.loc.y});				
	}
	if (show_hitboxes == true) {
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x), y: (entity.data.loc.y)+(entity.data.hit_box.y), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w), y: (entity.data.loc.y)+(entity.data.hit_box.y), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x), y: (entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w), y: (entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h), w: 1, h: 1});
	}
}

var ent_bag_update_func = function ent_bag_update(entity, players, augs_list) {
	if (entity.data.cooldown > 0) {
		entity.data.cooldown--;
	} else {
		for (var i=0; i<players.length; i++) {
			if (!(	(entity.data.loc.x)+(entity.data.hit_box.x) > (players[i].data.x)+(players[i].data.hit_box.x)+(players[i].data.hit_box.w) || 
					(entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w) < (players[i].data.x)+(players[i].data.hit_box.x) || 
					(entity.data.loc.y)+(entity.data.hit_box.y) > (players[i].data.y)+(players[i].data.hit_box.y)+(players[i].data.hit_box.h) ||
					(entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h) < (players[i].data.y)+(players[i].data.hit_box.y)) &&
				entity.data.collected == false && players[i].data.states.is_dead == false) {
				
				console.log("bag claimed...");
				players[i].inventory.keys = players[i].inventory.keys.concat(entity.data.keys);
				for (var j=0; j<entity.data.augs.length; j++) {
					console.log("Adding augment...");
					players[i].inventory.augments.push(entity.data.augs[j]);
					if (players[i].inventory.augments.length > players[i].inventory.augments_max) {
						augs_list[players[i].inventory.augments[0].index].onDrop(players[i]);
						players[i].inventory.augments.shift();
					}
					augs_list[entity.data.augs[j].index].onPickup(players[i]);
					
					/*if (players[i].inventory.augments.length > players[i].inventory.augments_max) {
						augs_list[players[i].inventory.augments[0].index].onDrop(players[i]);
						
						var new_aug = JSON.parse(JSON.stringify(ent_aug));
						new_aug.data.aug = players[i].inventory.augments[0].index;
						players[i].inventory.augments.shift();
						switch(players[i].data.dir) {
							case	0:	new_aug.data.loc = {x: players[i].data.x, y:players[i].data.y+players[i].data.hit_box.y+players[i].data.hit_box.h+4};
										break;
							case	1:	new_aug.data.loc = {x: players[i].data.x+players[i].data.hit_box.x+players[i].data.hit_box.w+4, y:players[i].data.y};
										break;
							case	2:	new_aug.data.loc = {x: players[i].data.x, y:players[i].data.y+players[i].data.hit_box.y-(entity.data.loc.y+entity.data.hit_box.y+entity.data.hit_box.h)-4};
										break;
							case	3:	new_aug.data.loc = {x: players[i].data.x+players[i].data.hit_box.x-(entity.data.loc.x+entity.data.hit_box.x+entity.data.hit_box.w)-4, y:players[i].data.y};
										break;
						}
						room_contents.push(new_aug);
					}*/
					
				}
				players[i].inventory.weapons.concat(entity.data.weapons);
				players[i].data.exp+=entity.data.exp;
				players[i].data.status_new = 616;
				players[i].data.status_count = 50;
				entity.data.collected = true;
				break;
			}
		}
	}
}
var ent_bag_draw_func = function ent_bag_draw(entity) {
	if (entity.data.collected == false) {
		if (entity.data.cooldown%2 == 0 ) {
			drawSprite(entity.data.sprite[0], entity.data.loc.x, entity.data.loc.y);
		}
	}
	if (show_hitboxes == true) {
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x), y: (entity.data.loc.y)+(entity.data.hit_box.y), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w), y: (entity.data.loc.y)+(entity.data.hit_box.y), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x), y: (entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w), y: (entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h), w: 1, h: 1});
	}
}

var ent_key_door_update_func = function ent_key_door_update(entity, players, map_ref) {
	for (var i=0; i< players.length; i++) {
		if (!(	(entity.data.loc.x)+(entity.data.hit_box.x) > (players[i].data.x)+(players[i].data.hit_box.x)+(players[i].data.hit_box.w) || 
				(entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w) < (players[i].data.x)+(players[i].data.hit_box.x) || 
				(entity.data.loc.y)+(entity.data.hit_box.y) > (players[i].data.y)+(players[i].data.hit_box.y)+(players[i].data.hit_box.h) ||
				(entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h) < (players[i].data.y)+(players[i].data.hit_box.y)) &&
			entity.data.locked == true && players[i].data.dir == entity.data.config) {
			
			//console.log("HITTING");
			
			if (players[i].inventory.keys.length >= entity.data.keys_needed) {
				//console.log("UNLOCKING");
				entity.data.locked = false;	//unlock
				
				//remove collisions and unlock corresponding door
				switch(entity.data.config) {
					case	0:	map_ref[entity.data.room.y][entity.data.room.x].map[1][0][9] = 0;
								map_ref[entity.data.room.y][entity.data.room.x].map[1][0][10] = 0;
								//unlock other door
								for (var j=0; j<map_ref[entity.data.room.y-1][entity.data.room.x].contents.length; j++) {
									if (map_ref[entity.data.room.y-1][entity.data.room.x].contents[j].data.type == 'door') {
										if (map_ref[entity.data.room.y-1][entity.data.room.x].contents[j].data.config == 2) {
											map_ref[entity.data.room.y-1][entity.data.room.x].contents[j].data.locked = false;
											map_ref[entity.data.room.y-1][entity.data.room.x].map[1][15][9] = 0;
											map_ref[entity.data.room.y-1][entity.data.room.x].map[1][15][10] = 0;
										}
									}
								}
								break;
					case	1:	map_ref[entity.data.room.y][entity.data.room.x].map[1][7][0] = 0;
								map_ref[entity.data.room.y][entity.data.room.x].map[1][8][0] = 0;
								//unlock other door
								for (var j=0; j<map_ref[entity.data.room.y][entity.data.room.x-1].contents.length; j++) {
									if (map_ref[entity.data.room.y][entity.data.room.x-1].contents[j].data.type == 'door') {
										if (map_ref[entity.data.room.y][entity.data.room.x-1].contents[j].data.config == 3) {
											map_ref[entity.data.room.y][entity.data.room.x-1].contents[j].data.locked = false;
											map_ref[entity.data.room.y][entity.data.room.x-1].map[1][7][19] = 0;
											map_ref[entity.data.room.y][entity.data.room.x-1].map[1][8][19] = 0;
										}
									}
								}
								break;
					case	2:	map_ref[entity.data.room.y][entity.data.room.x].map[1][15][9] = 0;
								map_ref[entity.data.room.y][entity.data.room.x].map[1][15][10] = 0;
								//unlock other door
								for (var j=0; j<map_ref[entity.data.room.y+1][entity.data.room.x].contents.length; j++) {
									if (map_ref[entity.data.room.y+1][entity.data.room.x].contents[j].data.type == 'door') {
										if (map_ref[entity.data.room.y+1][entity.data.room.x].contents[j].data.config == 0) {
											map_ref[entity.data.room.y+1][entity.data.room.x].contents[j].data.locked = false;
											map_ref[entity.data.room.y+1][entity.data.room.x].map[1][0][9] = 0;
											map_ref[entity.data.room.y+1][entity.data.room.x].map[1][0][10] = 0;
										}
									}
								}
								break;
					case	3:	map_ref[entity.data.room.y][entity.data.room.x].map[1][7][19] = 0;
								map_ref[entity.data.room.y][entity.data.room.x].map[1][8][19] = 0;
								//unlock other door
								for (var j=0; j<map_ref[entity.data.room.y][entity.data.room.x+1].contents.length; j++) {
									if (map_ref[entity.data.room.y][entity.data.room.x+1].contents[j].data.type == 'door') {
										if (map_ref[entity.data.room.y][entity.data.room.x+1].contents[j].data.config == 1) {
											map_ref[entity.data.room.y][entity.data.room.x+1].contents[j].data.locked = false;
											map_ref[entity.data.room.y][entity.data.room.x+1].map[1][7][0] = 0;
											map_ref[entity.data.room.y][entity.data.room.x+1].map[1][8][0] = 0;
										}
									}
								}
								break;
				}
				//deduct a key from the player
				players[i].inventory.keys.shift();
				
				i=players.length +1;
			}
		}
	}
}
var ent_key_door_draw_func = function ent_key_door_draw(entity) {
	if (entity.data.locked == true) {
		//ctx.fillStyle = entity.data.color;
		//ctx.fillRect(entity.data.loc.x+(entity.data.hit_box.x),entity.data.loc.y+(entity.data.hit_box.y),entity.data.hit_box.w,entity.data.hit_box.h);
		
		if (entity.data.config == 0 || entity.data.config == 2) {
			render_queue.push({
				action: 1,
				sheet: sprite_sheet,
				sheet_x: 64,
				sheet_y: 64,
				sheet_w: 16,
				sheet_h: 12,
				x: entity.data.loc.x+(entity.data.hit_box.x),
				y: entity.data.loc.y+(entity.data.hit_box.y),
				w: 16,
				h: 12
			});
		} else {
			render_queue.push({
				action: 1,
				sheet: sprite_sheet,
				sheet_x: 52,
				sheet_y: 56,
				sheet_w: 12,
				sheet_h: 16,
				x: entity.data.loc.x+(entity.data.hit_box.x),
				y: entity.data.loc.y+(entity.data.hit_box.y),
				w: 12,
				h: 16
			});
		}
	}
	
	if (show_hitboxes == true) {
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x), y: (entity.data.loc.y)+(entity.data.hit_box.y), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w), y: (entity.data.loc.y)+(entity.data.hit_box.y), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x), y: (entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h), w: 1, h: 1});
		render_queue.push({action: 2, color: "yellow", x: (entity.data.loc.x)+(entity.data.hit_box.x)+(entity.data.hit_box.w), y: (entity.data.loc.y)+(entity.data.hit_box.y)+(entity.data.hit_box.h), w: 1, h: 1});
	}
	
}

try {
	module.exports = {
		ent_aug: ent_aug,
		ent_wep: ent_wep,
		ent_key: ent_key,
		ent_drop: ent_drop,
		ent_chest: ent_chest,
		ent_bag: ent_bag,
		ent_key_door: ent_key_door,
		ent_aug_update: ent_aug_update_func,
		ent_aug_draw: ent_aug_draw_func,
		ent_wep_update: ent_wep_update_func,
		ent_wep_draw: ent_wep_draw_func,
		ent_key_update: ent_key_update_func,
		ent_key_draw: ent_key_draw_func,
		ent_drop_update: ent_drop_update_func,
		ent_drop_draw: ent_drop_draw_func,
		ent_chest_update: ent_chest_update_func,
		ent_chest_draw: ent_chest_draw_func,
		ent_bag_update: ent_bag_update_func,
		ent_bag_draw: ent_bag_draw_func,
		ent_key_door_update: ent_key_door_update_func,
		ent_key_door_draw: ent_key_door_draw_func
	}
}
catch (e) {
	
}
