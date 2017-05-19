var screen_width = 160;		        //Game Resolution Width
var screen_height = 144;		    //Game Resolution Height
var tile_size = 8;
////////////////////////////////AI's//////////////////////////////////////

var aggressive_ai = function(mob, players, lvl_curr) {
	
	if (mob.data.phase == -1) {
		mob.data.cooldown--;
	}
	if (mob.data.cooldown  <= 0) {
		mob.data.phase = 1;
	}
	
	if (mob.data.hit_by < 0) {
		mob.data.target_player = players[Math.floor(Math.random()*players.length)];
	} else {
		mob.data.target_player = players[0];
		for (var i=0; i<players.length; i++) {
			if (players[i].id == mob.data.hit_by) {
				mob.data.target_player = players[i];
			}
		}
	}
	
	if (mob.data.phase == 1 && mob.data.states.is_stunned == false) {
		var rand;
							
		if (mob.data.move_path.length <= 0) {	//gen a path
			for (var i=0; i<mob.data.path_length; i++) {
				var new_point;
				
				var ref_location = {x:mob.data.loc.x, y:mob.data.loc.y};
				if (mob.data.move_path.length > 0) {
					ref_location = {
						x: mob.data.move_path[mob.data.move_path.length-1].x,
						y: mob.data.move_path[mob.data.move_path.length-1].y
					};
				}
				
				if (Math.floor(Math.random()*2) == 1) {
					if ((ref_location.x - mob.data.target_player.data.x) > 0) {
						rand = 1;
					} else {
						rand = 3;
					}
				} else{
					if ((ref_location.y - mob.data.target_player.data.y) > 0) {
						rand = 0;
					} else {
						rand = 2;
					}
				}
				var margin_of_error = 16-Math.floor(Math.random()*32);
				var p_diff_x = ref_location.x - mob.data.target_player.data.x;
				var p_diff_y = ref_location.y - mob.data.target_player.data.y;
				
				var max_reach_y = p_diff_y-margin_of_error;
				var max_reach_x = p_diff_x-margin_of_error;
				if (Math.abs(max_reach_y) > mob.data.move_length) {
					max_reach_y = mob.data.move_length - Math.floor(Math.random()*mob.data.move_length/2);
				}
				if (Math.abs(max_reach_x) > mob.data.move_length) {
					max_reach_x = mob.data.move_length - Math.floor(Math.random()*mob.data.move_length/2);
				}
				
				var lower_x = (ref_location.x)+(mob.data.hit_box.x);
				var upper_x = (ref_location.x)+(mob.data.hit_box.x)+(mob.data.hit_box.w);
				var lower_y = (ref_location.y)+(mob.data.hit_box.y);
				var upper_y = (ref_location.y)+(mob.data.hit_box.y)+(mob.data.hit_box.h);
				
				if (rand == 0) {
					var can_move = 0;
					for (var j=0; j<max_reach_y; j++) {
						if (lower_y-can_move-mob.data.speed >= 16 && lvl_curr[1][Math.floor((lower_y-can_move-mob.data.speed)/8)]) {
							if (lvl_curr[1][Math.floor((lower_y-can_move-mob.data.speed)/8)][Math.floor((lower_x)/8)] ==0 && 
								lvl_curr[1][Math.floor((lower_y-can_move-mob.data.speed)/8)][Math.floor((upper_x)/8)] == 0) {
								
								can_move+=mob.data.speed;
							} else {
								break;
							}
						}
					}
					
					new_point = {
						x: ref_location.x,
						y: ref_location.y-can_move
					}
					mob.dir = 0;
				}
				if (rand == 1) {
					var can_move = 0;
					for (var j=0; j<max_reach_x; j++) {
						if (lower_x-can_move-mob.data.speed >= 16 && lvl_curr[1][Math.floor((lower_y)/8)] && lvl_curr[1][Math.floor((upper_y)/8)]) {
							if (lvl_curr[1][Math.floor((lower_y)/8)][Math.floor((lower_x-can_move-mob.data.speed)/8)] == 0 &&
								lvl_curr[1][Math.floor((upper_y)/8)][Math.floor((lower_x-can_move-mob.data.speed)/8)] == 0) {
								can_move+=mob.data.speed;
							} else {
								break;
							}
						}
					}
					new_point = {
						x: ref_location.x-can_move,
						y: ref_location.y
					}
					mob.data.dir = 1;
				}
				if (rand == 2) {
					var can_move = 0;
					for (var j=0; j<max_reach_y; j++) {
						if (upper_y+can_move+mob.data.speed < screen_height-32 && lvl_curr[1][Math.floor((upper_y+can_move+mob.data.speed)/8)]) {
							if (lvl_curr[1][Math.floor((upper_y+can_move+mob.data.speed)/8)][Math.floor((lower_x)/8)] == 0 &&
								lvl_curr[1][Math.floor((upper_y+can_move+mob.data.speed)/8)][Math.floor((upper_x)/8)] == 0) {
								can_move+=mob.data.speed;
							} else {
								break;
							}
						}	
					}
					
					new_point = {
						x: ref_location.x,
						y: ref_location.y+can_move
					}
					mob.data.dir = 2;
				}
				if (rand == 3) {
					var can_move = 0;
					for (var j=0; j<max_reach_x; j++) {
						if (upper_x+can_move+1 < screen_width-16 && lvl_curr[1][Math.floor((upper_y)/8)] && lvl_curr[1][Math.floor((lower_y)/8)]) {
							if (lvl_curr[1][Math.floor((upper_y)/8)][Math.floor((upper_x+can_move+mob.data.speed)/8)] == 0 &&
								lvl_curr[1][Math.floor((lower_y)/8)][Math.floor((upper_x+can_move+mob.data.speed)/8)] == 0) {
								can_move+=mob.data.speed;
							} else {
								break;
							}
						}	
					}
					new_point = {
						x: ref_location.x+can_move,
						y: ref_location.y
					}
					mob.data.dir = 3;
				}
				mob.data.move_path.push(new_point);
			}
		}
		
		mob_move(mob, mob.data.move_path);	
	}
	
}
var cowardly_ai = function(mob, players, lvl_curr){
	
	if (mob.data.phase == -1) {
		mob.data.cooldown--;
	}
	if (mob.data.cooldown  <= 0) {
		mob.data.phase = 1;
	}
	
	if (mob.data.hit_by < 0) {
		mob.data.target_player = players[Math.floor(Math.random()*players.length)];
	} else {
		mob.data.target_player = 0;
		for (var i=0; i<players.length; i++) {
			if (players[i].id == mob.data.hit_by) {
				mob.data.target_player = players[i];
			}
		}
	}
	
	if (Math.random() < mob.data.action_probability && mob.data.phase == 1  && mob.data.states.is_stunned == false) {
		var rand;
				
		var ref_location = {x:mob.data.loc.x, y:mob.data.loc.y};
		if (mob.data.move_path.length > 0) {
			ref_location = {
				x: mob.data.move_path[mob.data.move_path.length-1].x,
				y: mob.data.move_path[mob.data.move_path.length-1].y
			};
		}
				
		if (mob.data.move_path.length <= 0) {	//gen a path
			for (var i=0; i<1; i++) {
				var new_point;
				
				if (Math.floor(Math.random()*2) == 1) {
					if ((mob.data.loc.x - mob.data.target_player.data.x) > 0) {
						rand = 3;
					} else {
						rand = 1;
					}
				} else{
					if ((mob.data.loc.y - mob.data.target_player.data.y) > 0) {
						rand = 2;
					} else {
						rand = 0;
					}
				}
				var margin_of_error = 16-Math.floor(Math.random()*32);
				var p_diff_x = mob.data.loc.x - mob.data.target_player.data.x;
				var p_diff_y = mob.data.loc.y - mob.data.target_player.data.y;
				
				var max_reach_y = p_diff_y-margin_of_error;
				var max_reach_x = p_diff_x-margin_of_error;
				if (Math.abs(max_reach_y) > mob.data.move_length) {
					max_reach_y = mob.data.move_length;
				}
				if (Math.abs(max_reach_x) > mob.data.move_length) {
					max_reach_x = mob.data.move_length;
				}
				
				var lower_x = (mob.data.loc.x)+(mob.data.hit_box.x);
				var upper_x = (mob.data.loc.x)+(mob.data.hit_box.x)+(mob.data.hit_box.w);
				var lower_y = (mob.data.loc.y)+(mob.data.hit_box.y);
				var upper_y = (mob.data.loc.y)+(mob.data.hit_box.y)+(mob.data.hit_box.h);
				
				if (rand == 0) {
					var can_move = 0;
					for (var j=0; j<max_reach_y; j++) {
						if (lower_y-can_move-mob.data.speed >= 16 && lvl_curr[1][Math.floor((lower_y-can_move-mob.data.speed)/8)]) {
							if (lvl_curr[1][Math.floor((lower_y-can_move-mob.data.speed)/8)][Math.floor((lower_x)/8)] ==0 && 
								lvl_curr[1][Math.floor((lower_y-can_move-mob.data.speed)/8)][Math.floor((upper_x)/8)] == 0) {
								
								can_move+=mob.data.speed;
							} else {
								break;
							}
						}
					}
					
					new_point = {
						x: ref_location.x,
						y: ref_location.y-can_move
					}
					mob.dir = 0;
				}
				if (rand == 1) {
					var can_move = 0;
					for (var j=0; j<max_reach_x; j++) {
						if (lower_x-can_move-mob.data.speed >= 16 && lvl_curr[1][Math.floor((lower_y)/8)] && lvl_curr[1][Math.floor((upper_y)/8)]) {
							if (lvl_curr[1][Math.floor((lower_y)/8)][Math.floor((lower_x-can_move-mob.data.speed)/8)] == 0 &&
								lvl_curr[1][Math.floor((upper_y)/8)][Math.floor((lower_x-can_move-mob.data.speed)/8)] == 0) {
								can_move+=mob.data.speed;
							} else {
								break;
							}
						}
					}
					new_point = {
						x: ref_location.x-can_move,
						y: ref_location.y
					}
					mob.data.dir = 1;
				}
				if (rand == 2) {
					var can_move = 0;
					for (var j=0; j<max_reach_y; j++) {
						if (upper_y+can_move+mob.data.speed < screen_height-32 && lvl_curr[1][Math.floor((upper_y+can_move+mob.data.speed)/8)]) {
							if (lvl_curr[1][Math.floor((upper_y+can_move+mob.data.speed)/8)][Math.floor((lower_x)/8)] == 0 &&
								lvl_curr[1][Math.floor((upper_y+can_move+mob.data.speed)/8)][Math.floor((upper_x)/8)] == 0) {
								can_move+=mob.data.speed;
							} else {
								break;
							}
						}	
					}
					
					new_point = {
						x: ref_location.x,
						y: ref_location.y+can_move
					}
					mob.data.dir = 2;
				}
				if (rand == 3) {
					var can_move = 0;
					for (var j=0; j<max_reach_x; j++) {
						if (upper_x+can_move+1 < screen_width-16 && lvl_curr[1][Math.floor((upper_y)/8)] && lvl_curr[1][Math.floor((lower_y)/8)]) {
							if (lvl_curr[1][Math.floor((upper_y)/8)][Math.floor((upper_x+can_move+mob.data.speed)/8)] == 0 &&
								lvl_curr[1][Math.floor((lower_y)/8)][Math.floor((upper_x+can_move+mob.data.speed)/8)] == 0) {
								can_move+=mob.data.speed;
							} else {
								break;
							}
						}	
					}
					new_point = {
						x: ref_location.x+can_move,
						y: ref_location.y
					}
					mob.data.dir = 3;
				}
				mob.data.move_path.push(new_point);
			}
		}
		mob_move(mob, mob.data.move_path);	
	}
}
var neutral_ai = function(mob, players, lvl_curr){
	
	if (mob.data.phase == -1) {
		mob.data.cooldown--;
	}
	if (mob.data.cooldown  <= 0) {
		mob.data.phase = 1;
	}
	
	if (mob.data.hit_by < 0) {
		mob.data.target_player = players[Math.floor(Math.random()*players.length)];
	} else {
		mob.data.target_player = 0;
		for (var i=0; i<players.length; i++) {
			if (players[i].id == mob.data.hit_by) {
				mob.data.target_player = players[i];
			}
		}
	}
	
	if (Math.random() < mob.data.action_probability && mob.data.phase == 1  && mob.data.states.is_stunned == false) {
		
		var rand;
		var ref_location = {x:mob.data.loc.x, y:mob.data.loc.y};
		if (mob.data.move_path.length > 0) {
			ref_location = {
				x: mob.data.move_path[mob.data.move_path.length-1].x,
				y: mob.data.move_path[mob.data.move_path.length-1].y
			};
		}	
		if (mob.data.move_path.length <= 0) {	//gen a path
			for (var i=0; i<1; i++) {
				var new_point;
				
				if (Math.floor(Math.random()*2) == 1) {
					if ((mob.data.loc.x - mob.data.target_player.data.x) > 0) {
						rand = 3;
					} else {
						rand = 1;
					}
				} else{
					if ((mob.data.loc.y - mob.data.target_player.data.y) > 0) {
						rand = 2;
					} else {
						rand = 0;
					}
				}
				var margin_of_error = 16-Math.floor(Math.random()*32);
				var p_diff_x = mob.data.loc.x - mob.data.target_player.data.x;
				var p_diff_y = mob.data.loc.y - mob.data.target_player.data.y;
				
				var max_reach_y = p_diff_y-margin_of_error;
				var max_reach_x = p_diff_x-margin_of_error;
				if (Math.abs(max_reach_y) > mob.data.move_length) {
					max_reach_y = mob.data.move_length;
				}
				if (Math.abs(max_reach_x) > mob.data.move_length) {
					max_reach_x = mob.data.move_length;
				}
				
				var lower_x = (mob.data.loc.x)+(mob.data.hit_box.x);
				var upper_x = (mob.data.loc.x)+(mob.data.hit_box.x)+(mob.data.hit_box.w);
				var lower_y = (mob.data.loc.y)+(mob.data.hit_box.y);
				var upper_y = (mob.data.loc.y)+(mob.data.hit_box.y)+(mob.data.hit_box.h);
				
				if (rand == 0) {
					var can_move = 0;
					for (var j=0; j<max_reach_y; j++) {
						if (lower_y-can_move-mob.data.speed >= 16 && lvl_curr[1][Math.floor((lower_y-can_move-mob.data.speed)/8)]) {
							if (lvl_curr[1][Math.floor((lower_y-can_move-mob.data.speed)/8)][Math.floor((lower_x)/8)] ==0 && 
								lvl_curr[1][Math.floor((lower_y-can_move-mob.data.speed)/8)][Math.floor((upper_x)/8)] == 0) {
								
								can_move+=mob.data.speed;
							} else {
								break;
							}
						}
					}
					
					new_point = {
						x: ref_location.x,
						y: ref_location.y-can_move
					}
					mob.dir = 0;
				}
				if (rand == 1) {
					var can_move = 0;
					for (var j=0; j<max_reach_x; j++) {
						if (lower_x-can_move-mob.data.speed >= 16 && lvl_curr[1][Math.floor((lower_y)/8)] && lvl_curr[1][Math.floor((upper_y)/8)]) {
							if (lvl_curr[1][Math.floor((lower_y)/8)][Math.floor((lower_x-can_move-mob.data.speed)/8)] == 0 &&
								lvl_curr[1][Math.floor((upper_y)/8)][Math.floor((lower_x-can_move-mob.data.speed)/8)] == 0) {
								can_move+=mob.data.speed;
							} else {
								break;
							}
						}
					}
					new_point = {
						x: ref_location.x-can_move,
						y: ref_location.y
					}
					mob.data.dir = 1;
				}
				if (rand == 2) {
					var can_move = 0;
					for (var j=0; j<max_reach_y; j++) {
						if (upper_y+can_move+mob.data.speed < screen_height-32 && lvl_curr[1][Math.floor((upper_y+can_move+mob.data.speed)/8)]) {
							if (lvl_curr[1][Math.floor((upper_y+can_move+mob.data.speed)/8)][Math.floor((lower_x)/8)] == 0 &&
								lvl_curr[1][Math.floor((upper_y+can_move+mob.data.speed)/8)][Math.floor((upper_x)/8)] == 0) {
								can_move+=mob.data.speed;
							} else {
								break;
							}
						}	
					}
					
					new_point = {
						x: ref_location.x,
						y: ref_location.y+can_move
					}
					mob.data.dir = 2;
				}
				if (rand == 3) {
					var can_move = 0;
					for (var j=0; j<max_reach_x; j++) {
						if (upper_x+can_move+1 < screen_width-16 && lvl_curr[1][Math.floor((upper_y)/8)] && lvl_curr[1][Math.floor((lower_y)/8)]) {
							if (lvl_curr[1][Math.floor((upper_y)/8)][Math.floor((upper_x+can_move+mob.data.speed)/8)] == 0 &&
								lvl_curr[1][Math.floor((lower_y)/8)][Math.floor((upper_x+can_move+mob.data.speed)/8)] == 0) {
								can_move+=mob.data.speed;
							} else {
								break;
							}
						}	
					}
					new_point = {
						x: ref_location.x+can_move,
						y: ref_location.y
					}
					mob.data.dir = 3;
				}
				mob.data.move_path.push(new_point);
			}
		}
		mob_move(mob, mob.data.move_path);	
	}
}

var boss_ai = function(mob, lvl_curr) {
	//console.log(players.length);
	if (mob.data.phase == -1) {	//cooldown phase
		mob.data.cooldown--;
		if (mob.data.cooldown  <= 0) {
			mob.data.curr_phase++;
			if (mob.data.curr_phase >= mob.data.phase_pattern.length) {
				mob.data.curr_phase =0;
			}
			mob.data.phase = mob.data.phase_pattern[mob.data.curr_phase];
		}
	}
	
	if (mob.data.phase == 1) {	//move
		if (mob.data.move_path.length <= 0) {	//gen a path
			for (var i=0; i<8; i++) {
				var new_point = {
					x:(Math.floor(Math.random()*19))*8,
					y:(Math.floor(Math.random()*15))*8
				}
				mob.data.move_path.push(new_point);
			}
		}
		mob_move(mob, mob.data.move_path);
	}
	
	if (mob.data.phase == 2 || mob.data.phase == 2.1) {	//lightning
		lightning_attack(mob);
	}
}

var lightning_attack = function(mob) {	
	
	if (mob.data.phase == 2) {
		mob.data.num_targets = Math.floor(Math.random()*40)+8;
		//console.log("starting lightning attack");
		if (mob.data.target_tiles.length != mob.data.num_targers) {
			//console.log("initializing the tiles");
			mob.data.target_tiles = [];
			for (var i=0; i<mob.data.num_targets; i++) {
				var new_point = {
					x:(Math.floor(Math.random()*19))*8,
					y:(Math.floor(Math.random()*15))*8,
					hit_box:{x:0, y:0, w:8, h: 8},
					damage: 5,
					charge_time_limit: 120,
					charge_time:0,
					electric_time_limit: 30,
					electric_time:0,
					is_electric:false,
					active:true	
				}
				mob.data.target_tiles.push(new_point);
			}
		} else {
			//console.log("reseting the tiles")
			for (var i=0; i<mob.data.target_tiles.length; i++) {
				if (mob.data.target_tiles[i].x == -1) {
					mob.data.target_tiles[i].x = (Math.floor(Math.random()*12))*8
				}
				if (mob.data.target_tiles[i].y == -1) {
					mob.data.target_tiles[i].y = (Math.floor(Math.random()*12))*8
				}
				mob.data.target_tiles[i].active = true;
			}
		}
		mob.data.phase = 2.1;
	}
}

var lightning_tile_update = function(tile, players, lvl_curr) {
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
			
			for (var i=0; i<players.length; i++) {
				if (players[i].data.states.is_invincible == false &&
					!(	(tile.x)+(tile.hit_box.x) > (players[i].data.x)+(players[i].data.hit_box.x)+(players[i].data.hit_box.w) || 
						(tile.x)+(tile.hit_box.x)+(tile.hit_box.w) < (players[i].data.x)+(players[i].data.hit_box.x) || 
						(tile.y)+(tile.hit_box.y) > (players[i].data.y)+(players[i].data.hit_box.y)+(players[i].data.hit_box.h) ||
						(tile.y)+(tile.hit_box.y)+(tile.hit_box.h) < (players[i].data.y)+(players[i].data.hit_box.y))) {
						
					if (tile.damage-(players[i].data.base_defense-1) > 0) {
						players[i].data.health = players[i].data.health-(tile.damage-(players[i].data.base_defense-1));
					}
					players[i].data.states.is_invincible = true;
					players[i].data.invincibility_counter = 0;
				}
			}
		}	
	}
}

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


var mob_move  = function(mob, path) {
	//console.log("boss_f;ight");
	if (path[0] != null) {
		if (path[0].x != null && path[0].y != null) {
			if (mob.data.loc.x == path[0].x && mob.data.loc.y == path[0].y) {
				path.shift();
				if (path.length <= 0) {
					mob.data.phase = -1;
					mob.data.cooldown = mob.data.cooldown_limit;
				}
			} else {
				if (mob.data.loc.x < path[0].x) {
					mob.data.loc.x+=mob.data.speed;
				}
				if (mob.data.loc.x > path[0].x) {
					mob.data.loc.x-=mob.data.speed;
				}
				if (mob.data.loc.y < path[0].y) {
					mob.data.loc.y+=mob.data.speed;
				}
				if (mob.data.loc.y > path[0].y) {
					mob.data.loc.y-=mob.data.speed;
				}
			}
		}
	}
}

var ais = [
	{   name: 'aggressive',
		behavoir: aggressive_ai
	},
	
	{   name: 'neutral',
		behavoir: neutral_ai
	},
	
	{   name: 'cowardly',
		behavoir: cowardly_ai
	}
];

var boss_ais = [
	{   name: 'flight',
		behavoir: boss_ai
	}
];

////////////////////////////////mobs//////////////////////////////////////

var mobs = [//(considered a subtype of room entities and therefore must have all the necessary elements)
    {    
		data:{
			type: 'mob', name:'minor_ghost', 
			sprite: [
				{x:72,y:224,w:8,h:8},
				{x:72,y:232,w:8,h:8},
				{x:72,y:240,w:8,h:8},
				{x:72,y:248,w:8,h:8}
			],
			hit_box:{x:-4,y:-4,w:8,h:8},
			loc: {
				x: -1,
				y: -1
			}, 
			rarity: 2,
			speed: 1, 
			dir: 0,
			health: 2,
			health_max: 2,
			exp_reward: 1,
			move_length: 8,
			path_length:1,
			animations:{
				
			},
			damage: 1,
			cursePenalty: 0,
			states: {
				is_idle: true,
				is_moving: false,
				is_strafing: false,
				is_invincible: false,
				is_attacking: false,
				is_dead: false,
				is_stunned: false,
				is_enflamed: false,
				is_frozen: false,
				is_electric: false,
				is_wet: false,
				enflamed_count: 0,
				stunned_count:0,
				frozen_count:0,
				electric_count:0,
				wet_count:0
			},
			target_player:0,
			hit_by:-1,
			hit_flash: 0,
			aiIndex:0,
			ai: 0,
			drop:null,
			flash_anim_curr: 0,
			flash_anim_index:0,
			flash_anim_counter:-1,
			level:1,
			level_range:[1,8],
			action_probability: .9,
			phase:-1,
			cooldown:0,
			cooldown_limit:150,
			move_path:[],
			respawn_time_limit:600,
			respawn_time:0,
			invincibility_counter: 0,
			invincibility_limit:30,
			local_audio:[]	
		}
	},
	{    
		data:{
			type: 'mob', name:'major_ghost', 
			sprite: [
				{x:80,y:192,w:16,h:16},
				{x:80,y:208,w:16,h:16},
				{x:80,y:224,w:16,h:16},
				{x:80,y:240,w:16,h:16}
			], 
			hit_box:{x:-8,y:-8,w:16,h:16}, 
			rarity: 5,
			loc: {x: -1, y:-1}, speed: .5, dir: 0, health: 2, health_max: 2, exp_reward: 1,
			move_length: 8,
			path_length: 8,
			animations:{
				
			},
			damage: 5,
			cursePenalty: 0,
			states: {
				is_idle: true,
				is_moving: false,
				is_strafing: false,
				is_invincible: false,
				is_attacking: false,
				is_dead: false,
				is_stunned: false,
				is_enflamed: false,
				is_frozen: false,
				is_electric: false,
				is_wet: false,
				enflamed_count: 0,
				stunned_count:0,
				frozen_count:0,
				electric_count:0,
				wet_count:0
			},
			target_player:0,
			hit_by:-1,
			hit_flash: 0,
			aiIndex:0,
			ai: 0,
			drop:null,
			flash_anim_curr: 0,
			flash_anim_index:0,
			flash_anim_counter:-1,
			level:1,
			level_range:[8,16],
			action_probability: .9,
			phase:-1,
			cooldown:0,
			cooldown_limit:60,
			move_path:[],
			respawn_time_limit:1200,
			respawn_time:0,
			invincibility_counter: 0,
			invincibility_limit:30,
			local_audio: []
		}
	}
];

var bosses = [
	{    
		data:{
			type: 'boss', name:'angel', 
			sprite: [], 
			loc: {x: 8*8, y:8*8}, 
			hit_box:{x:-10.5,y:-12.5,w:21,h:25},
			speed: 1, 
			dir: 0, 
			health: 500, 
			health_max: 5000,
			exp_reward: 5000,
			anim_curr: 0,
			anim_index: 0,
			anim_counter: 0,
			animations:[
				//idle
				[{x:96,y:192,w:64,h:32,dur:4},{x:96,y:224,w:64,h:32,dur:4}]
			],
			damage: 1,//25,
			cursePenalty: 0,
			states:{
				is_idle: true,
				is_moving: false,
				is_strafing: false,
				is_invincible: false,
				is_attacking: false,
				is_dead: false,
				is_stunned: false,
				is_enflamed: false,
				is_frozen: false,
				is_electric: false,
				is_wet: false,
				enflamed_count: 0,
				stunned_count:0,
				frozen_count:0,
				electric_count:0,
				wet_count:0
			},
			target_player:0,
			hit_by:-1,
			hit_flash: 0,
			aiIndex:0,
			ai: 0,
			drop:null,
			flash_anim_curr: 0,
			flash_anim_index:0,
			flash_anim_counter:-1,
			phase:-1,
			curr_phase:0,
			phase_pattern: [
				1,
				1,
				1,
				1,
				2,
				2,
				2
			],
			cooldown:0,
			cooldown_limit:90,
			move_path:[],
			target_tiles:[],
			num_targets:12,
			respawn_time_limit:1200,
			respawn_time:0,
			invincibility_counter: 0,
			invincibility_limit:30,
			local_audio: []
		}
	}
];

var mob_update_func = function mob_update(mob, players, map) {
	//mob.damage = 1;//*(cycle+1);
	if (mob.data.flash_anim_index >= hit_flashes[mob.data.flash_anim_curr].length) {
		mob.data.flash_anim_index = 0;
		mob.data.hit_flash = false;
		console.log("ENDING");
	}
	if (mob.data.hit_flash == true) {
		mob.data.flash_anim_counter++;
		if (mob.data.flash_anim_counter >= hit_flashes[mob.data.flash_anim_curr][mob.data.flash_anim_index].dur) {
			mob.data.flash_anim_counter = 0;
			mob.data.flash_anim_index++;
			if (mob.data.flash_anim_index >= hit_flashes[mob.data.flash_anim_curr].length) {
				mob.data.flash_anim_index = 0;
				mob.data.hit_flash = false;
			}
		}
	}
	
	if (mob.data.states.is_dead == false) {
		
		//invincibility counter
		if (mob.data.states.is_invincible == true) {
			mob.data.invincibility_counter++;
			if (mob.data.invincibility_counter > mob.data.invincibility_limit) {
				if (mob.data.states.is_invincible == true) {
					mob.data.states.is_invincible = false;
				}
				mob.data.invincibility_counter = 0;
			}
		}
		
		//progress fire if on fire
		if (mob.data.states.is_enflamed == true) {
			mob.data.health-=.05;
			mob.data.states.enflamed_count--;
			if (mob.data.states.enflamed_count <= 0) {
				mob.data.states.is_enflamed = false;
			}
		}
		
		//progress stun
		if (mob.data.states.is_stunned == true) {
			mob.data.states.stunned_count--;
			if (mob.data.states.stunned_count <= 0) {
				mob.data.states.is_stunned = false;
			}
		}
		
		if (mob.data.health <= 0) {
			if (mob.data.drop != null) {
				//mobs_remaining--;
				var new_drop = JSON.parse(JSON.stringify(mob.data.drop));
				new_drop.data.loc.x = mob.data.loc.x;
				new_drop.data.loc.y = mob.data.loc.y;
				map.contents.push(new_drop);
			}
			
			mob.data.states.is_dead = true;
			for (var i=0; i<players.length; i++) {
				if (players[i].id == mob.data.hit_by) {
					players[i].data.exp = players[i].data.exp+mob.data.exp_reward;
					players[i].data.curse = players[i].data.curse + mob.data.cursePenalty;
				}
			}
		}
		
		ais[mob.data.ai].behavoir(mob, players, map.map);
		
		for (var i=0; i<players.length; i++) {
			if (players[i].data.states.is_invincible == false &&
				!(	(mob.data.loc.x)+(mob.data.hit_box.x) > (players[i].data.x)+(players[i].data.hit_box.x)+(players[i].data.hit_box.w) || 
					(mob.data.loc.x)+(mob.data.hit_box.x)+(mob.data.hit_box.w) < (players[i].data.x)+(players[i].data.hit_box.x) || 
					(mob.data.loc.y)+(mob.data.hit_box.y) > (players[i].data.y)+(players[i].data.hit_box.y)+(players[i].data.hit_box.h) ||
					(mob.data.loc.y)+(mob.data.hit_box.y)+(mob.data.hit_box.h) < (players[i].data.y)+(players[i].data.hit_box.y))) {
					
				if (mob.data.damage-(players[i].data.base_defense-1) > 0) {
					players[i].data.health = players[i].data.health-(mob.data.damage-(players[i].data.base_defense-1));
				}
				if (players[i].data.dir == 0) {
					if (Math.floor((players[i].data.y+8)/tile_size) < screen_height-32) {
						if (map.map[1][Math.floor((players[i].data.y+8)/tile_size)][Math.floor((players[i].data.x)/tile_size)] == 0) {
							players[i].data.y+=8;
						}
					}
				}
				if (players[i].data.dir == 1) {
					if (Math.floor((players[i].data.x+8)/tile_size) < screen_width) {
						if (map.map[1][Math.floor((players[i].data.y)/tile_size)][Math.floor((players[i].data.x+8)/tile_size)] == 0) {
							players[i].data.x+=8;
						}
					}
				}
				
				if (players[i].data.dir == 2) {
					if (Math.floor((players[i].data.y-8)/tile_size) > 0) {
						if  (map.map[1][Math.floor((players[i].data.y-8)/tile_size)][Math.floor((players[i].data.x)/tile_size)] == 0) {
							players[i].data.y-=8;
						}
					}
				}
					
				if (players[i].data.dir == 3) {
					if (Math.floor((players[i].data.x-8)/tile_size) > 0) {
						if (map.map[1][Math.floor((players[i].data.y)/tile_size)][Math.floor((players[i].data.x-8)/tile_size)] == 0) {
							players[i].data.x-=8;
						}
					}
				}
				players[i].data.states.is_invincible = true;
				players[i].data.invincibility_counter = 0;
			}
		}
	}
}

var mob_draw_func = function mob_draw(mob) {
	if (mob.data.states.is_dead == false) {
		//drawSprite(mob.data.sprite[mob.data.dir], mob.data.loc.x, mob.data.loc.y);
		render_queue.push({
			action: 1,
			sheet: sprite_sheet,
			sheet_x: mob.data.sprite[mob.data.dir].x,
			sheet_y: mob.data.sprite[mob.data.dir].y,
			sheet_w: mob.data.sprite[mob.data.dir].w,
			sheet_h: mob.data.sprite[mob.data.dir].h,
			x: mob.data.loc.x+mob.data.hit_box.x, 
			y: mob.data.loc.y+mob.data.hit_box.y,
			w: mob.data.sprite[mob.data.dir].w,
			h: mob.data.sprite[mob.data.dir].h
		});
		
		if (mob.data.states.is_enflamed == true) {
			var flame_frame = Math.floor(Math.random()*flames.length);
			render_queue.push({
				action: 1,
				sheet: sprite_sheet,
				sheet_x: flames[flame_frame].x,
				sheet_y: flames[flame_frame].y,
				sheet_w: flames[flame_frame].w,
				sheet_h: flames[flame_frame].h,
				x:(mob.data.loc.x)-8,
				y:(mob.data.loc.y)+(mob.data.hit_box.y)+(mob.data.hit_box.h)-8,
				w: flames[flame_frame].w,
				h: flames[flame_frame].h,
			});
		}
		
		if (mob.data.states.is_stunned == true) {
			var stun_frame = Math.floor(Math.random()*lightning_stun.length);
			render_queue.push({
				action: 1,
				sheet: sprite_sheet,
				sheet_x: lightning_stun[stun_frame].x,
				sheet_y: lightning_stun[stun_frame].y,
				sheet_w: lightning_stun[stun_frame].w,
				sheet_h: lightning_stun[stun_frame].h,
				x:(mob.data.loc.x)-8,
				y:(mob.data.loc.y)+(mob.data.hit_box.y)+(mob.data.hit_box.h)-16,
				w: lightning_stun[stun_frame].w,
				h: lightning_stun[stun_frame].h,
			});
		}
		
	}
	if (mob.data.hit_flash == true) {
		render_queue.push({
			action: 1,
			sheet: sprite_sheet,
			sheet_x: hit_flashes[mob.data.flash_anim_curr][mob.data.flash_anim_index].x,
			sheet_y: hit_flashes[mob.data.flash_anim_curr][mob.data.flash_anim_index].y,
			sheet_w: hit_flashes[mob.data.flash_anim_curr][mob.data.flash_anim_index].w,
			sheet_h: hit_flashes[mob.data.flash_anim_curr][mob.data.flash_anim_index].h,
			x: mob.data.loc.x, 
			y: mob.data.loc.y,
			w: 16,
			h: 16
		});
	}
	 
	if (show_hitboxes == true) {
		render_queue.push({action: 2, color: "red", x: (mob.data.loc.x)+(mob.data.hit_box.x), y: (mob.data.loc.y)+(mob.data.hit_box.y), w: 1, h: 1});
		render_queue.push({action: 2, color: "red", x: (mob.data.loc.x)+(mob.data.hit_box.x)+(mob.data.hit_box.w), y: (mob.data.loc.y)+(mob.data.hit_box.y), w: 1, h: 1});
		render_queue.push({action: 2, color: "red", x: (mob.data.loc.x)+(mob.data.hit_box.x), y: (mob.data.loc.y)+(mob.data.hit_box.y)+(mob.data.hit_box.h), w: 1, h: 1});
		render_queue.push({action: 2, color: "red", x: (mob.data.loc.x)+(mob.data.hit_box.x)+(mob.data.hit_box.w), y: (mob.data.loc.y)+(mob.data.hit_box.y)+(mob.data.hit_box.h), w: 1, h: 1});
	}	
}

var boss_update_func = function boss_update(mob, players, map) {
	
	if (mob.data.flash_anim_index >= hit_flashes[mob.data.flash_anim_curr].length) {
		mob.data.flash_anim_index = 0;
		mob.data.hit_flash = false;
		console.log("ENDING");
	}
	if (mob.data.hit_flash == true) {
		mob.data.flash_anim_counter++;
		if (mob.data.flash_anim_counter >= hit_flashes[mob.data.flash_anim_curr][mob.data.flash_anim_index].dur) {
			mob.data.flash_anim_counter = 0;
			mob.data.flash_anim_index++;
			if (mob.data.flash_anim_index >= hit_flashes[mob.data.flash_anim_curr].length) {
				mob.data.flash_anim_index = 0;
				mob.data.hit_flash = false;
			}
		}
	}
	
	if (mob.data.states.is_dead == false) {
		
		//invincibility counter
		if (mob.data.states.is_invincible == true) {
			mob.data.invincibility_counter++;
			if (mob.data.invincibility_counter > mob.data.invincibility_limit) {
				if (mob.data.states.is_invincible == true) {
					mob.data.states.is_invincible = false;
				}
				mob.data.invincibility_counter = 0;
			}
		}
		
		//progress fire if on fire
		if (mob.data.states.is_enflamed == true) {
			//console.log("on fire");
			mob.data.health-=.05;
			mob.data.states.enflamed_count--;
			if (mob.data.states.enflamed_count <= 0) {
				//console.log("done being on fire");
				mob.data.states.is_enflamed = false;
				mob.data.states.enflamed_count = 0;
			}
		}
		
		if (mob.data.health <= 0) {
			if (mob.data.drop != null) {
				//mobs_remaining--;
				var new_drop = JSON.parse(JSON.stringify(mob.data.drop));
				new_drop.data.loc.x = mob.data.loc.x;
				new_drop.data.loc.y = mob.data.loc.y;
				map.contents.push(new_drop);
			}
			
			mob.data.states.is_dead = true;
			for (var i=0; i<players.length; i++) {
				if (players[i].id == mob.data.hit_by) {
					players[i].data.exp = players[i].data.exp+mob.data.exp_reward;
					players[i].data.curse = players[i].data.curse + mob.data.cursePenalty;
				}
			}
		}
		
		
		boss_ais[mob.data.ai].behavoir(mob, map.map, mob.data.phase);
		if (mob.data.phase == 2.1) {
			//console.log("running the attack");
			var going = false;
			for (var i=0; i<mob.data.target_tiles.length; i++) {
				lightning_tile_update(mob.data.target_tiles[i], players, map);
				if (mob.data.target_tiles[i].active == true) {
					going = true;
				}
			}
			
			if (going == false) {
				//console.log("ending attack");
				mob.data.cooldown = mob.data.cooldown_limit/10;
				mob.data.phase = -1;
			}
		}	
		
		for (var i=0; i<players.length; i++) {
			if (players[i].data.states.is_invincible == false &&
				!(	(mob.data.loc.x)+(mob.data.hit_box.x) > (players[i].data.x)+(players[i].data.hit_box.x)+(players[i].data.hit_box.w) || 
					(mob.data.loc.x)+(mob.data.hit_box.x)+(mob.data.hit_box.w) < (players[i].data.x)+(players[i].data.hit_box.x) || 
					(mob.data.loc.y)+(mob.data.hit_box.y) > (players[i].data.y)+(players[i].data.hit_box.y)+(players[i].data.hit_box.h) ||
					(mob.data.loc.y)+(mob.data.hit_box.y)+(mob.data.hit_box.h) < (players[i].data.y)+(players[i].data.hit_box.y))) {
					
				if (mob.data.damage-(players[i].data.base_defense-1) > 0) {
					players[i].data.health = players[i].data.health-(mob.data.damage-(players[i].data.base_defense-1));
				}
				if (players[i].data.dir == 0) {
					if (Math.floor((players[i].data.y+8)/tile_size) < screen_height-32) {
						if (map.map[1][Math.floor((players[i].data.y+8)/tile_size)][Math.floor((players[i].data.x)/tile_size)] == 0) {
							players[i].data.y+=8;
						}
					}
				}
				if (players[i].data.dir == 1) {
					if (Math.floor((players[i].data.x+8)/tile_size) < screen_width) {
						if (map.map[1][Math.floor((players[i].data.y)/tile_size)][Math.floor((players[i].data.x+8)/tile_size)] == 0) {
							players[i].data.x+=8;
						}
					}
				}
				
				if (players[i].data.dir == 2) {
					if (Math.floor((players[i].data.y-8)/tile_size) > 0) {
						if  (map.map[1][Math.floor((players[i].data.y-8)/tile_size)][Math.floor((players[i].data.x)/tile_size)] == 0) {
							players[i].data.y-=8;
						}
					}
				}
					
				if (players[i].data.dir == 3) {
					if (Math.floor((players[i].data.x-8)/tile_size) > 0) {
						if (map.map[1][Math.floor((players[i].data.y)/tile_size)][Math.floor((players[i].data.x-8)/tile_size)] == 0) {
							players[i].data.x-=8;
						}
					}
				}
				players[i].data.states.is_invincible = true;
				players[i].data.invincibility_counter = 0;
			}
		}
		
	} else {
	}
}

var boss_draw_func = function mob_draw(mob) {
	if (mob.data.states.is_dead == false) {
		//drawSprite(mob.data.sprite[mob.data.dir], mob.data.loc.x, mob.data.loc.y);
		render_queue.push({
			action: 1,
			sheet: sprite_sheet,
			sheet_x: mob.data.animations[mob.data.anim_curr][mob.data.anim_index].x,
			sheet_y: mob.data.animations[mob.data.anim_curr][mob.data.anim_index].y,
			sheet_w: mob.data.animations[mob.data.anim_curr][mob.data.anim_index].w,
			sheet_h: mob.data.animations[mob.data.anim_curr][mob.data.anim_index].h,
			x: mob.data.loc.x-(mob.data.animations[mob.data.anim_curr][mob.data.anim_index].w)/2, 
			y: mob.data.loc.y-(mob.data.animations[mob.data.anim_curr][mob.data.anim_index].h)/2,
			w: mob.data.animations[mob.data.anim_curr][mob.data.anim_index].w,
			h: mob.data.animations[mob.data.anim_curr][mob.data.anim_index].h
		});
		for (var i=0; i<mob.data.target_tiles.length; i++) {
			lightning_tile_draw(mob.data.target_tiles[i]);
		}
		if (mob.data.states.is_enflamed == true) {
			var flame_frame = Math.floor(Math.random()*flames.length);
			render_queue.push({
				action: 1,
				sheet: sprite_sheet,
				sheet_x: flames[flame_frame].x,
				sheet_y: flames[flame_frame].y,
				sheet_w: flames[flame_frame].w,
				sheet_h: flames[flame_frame].h,
				x:(mob.data.loc.x)-8,
				y:(mob.data.loc.y)+(mob.data.hit_box.y)+(mob.data.hit_box.h)-8,
				w: flames[flame_frame].w,
				h: flames[flame_frame].h,
			});
		}
		
		if (mob.data.states.is_stunned == true) {
			var stun_frame = Math.floor(Math.random()*lightning_stun.length);
			render_queue.push({
				action: 1,
				sheet: sprite_sheet,
				sheet_x: lightning_stun[stun_frame].x,
				sheet_y: lightning_stun[stun_frame].y,
				sheet_w: lightning_stun[stun_frame].w,
				sheet_h: lightning_stun[stun_frame].h,
				x:(mob.data.loc.x)-8,
				y:(mob.data.loc.y)+(mob.data.hit_box.y)+(mob.data.hit_box.h)-16,
				w: lightning_stun[stun_frame].w,
				h: lightning_stun[stun_frame].h,
			});
		}
		
	}
	if (show_hitboxes == true) {
		render_queue.push({action: 2, color: "purple", 
			x: (mob.data.loc.x), 
			y: (mob.data.loc.y), 
			w: 1, 
			h: 1
		});
		render_queue.push({action: 2, color: "red", 
			x: (mob.data.loc.x)+(mob.data.hit_box.x), 
			y: (mob.data.loc.y)+(mob.data.hit_box.y), 
			w: 1, 
			h: 1
		});
		render_queue.push({action: 2, color: "red", 
			x: (mob.data.loc.x)+(mob.data.hit_box.x)+(mob.data.hit_box.w), 
			y: (mob.data.loc.y)+(mob.data.hit_box.y),
			w: 1, 
			h: 1
		});
		render_queue.push({action: 2, color: "red", 
			x: (mob.data.loc.x)+(mob.data.hit_box.x), 
			y: (mob.data.loc.y)+(mob.data.hit_box.y)+(mob.data.hit_box.h), 
			w: 1, 
			h: 1
		});
		render_queue.push({action: 2, color: "red", 
			x: (mob.data.loc.x)+(mob.data.hit_box.x)+(mob.data.hit_box.w), 
			y: (mob.data.loc.y)+(mob.data.hit_box.y)+(mob.data.hit_box.h), 
			w: 1, 
			h: 1
		});
	}
}

var hit_flashes = [
	[{x:64, y:144, w:16, h:16, dur: 4},{x:80, y:144, w:16, h:16, dur: 4},{x:96, y:144, w:16, h:16, dur: 4}]
];

var flames = [
	{x:40, y:200, w:16, h:8},
	{x:40, y:208, w:16, h:8},
	{x:40, y:216, w:16, h:8}
];

var lightning_sprites = [
	{x:56, y:176, w:8, h:8},
	{x:56, y:184, w:8, h:8},
	{x:56, y:192, w:8, h:8},
	{x:56, y:200, w:8, h:8},
	{x:56, y:208, w:8, h:8},
	{x:56, y:216, w:8, h:8},
	{x:56, y:224, w:8, h:8},
	{x:56, y:232, w:8, h:8}
];

var lightning_tile_sprites = [
	{x:48, y:224, w:8, h:8},
	{x:48, y:232, w:8, h:8},
	{x:48, y:240, w:8, h:8}
];

var lightning_stun = [
	{x:24, y:176, w:16, h:16},
	{x:24, y:192, w:16, h:16},
	{x:24, y:208, w:16, h:16}
];

try {
	module.exports = {
		ais: ais,
		boss_ais: boss_ais,
		mobs: mobs,
		bosses: bosses,
		mob_update:mob_update_func,
		mob_draw:mob_draw_func,
		boss_update: boss_update_func,
		boss_draw:boss_draw_func
	}
}
catch (e) {
	console.log(e);
}