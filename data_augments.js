var screen_width = 160;		        //Game Resolution Width
var screen_height = 144;		    //Game Resolution Height
var tile_size = 8;
////////////////////////////////augments//////////////////////////////////

var augments = [
	{   
		data:{
			index: 0,
			name: 'Scarf', 
			sprite: 993,
			effectText: '+.25 spd', 
			sprite_space: 0,
			rarity: 0
		},
		onPickup:   function(player_obj) {player_obj.data.speed = player_obj.data.speed+.25;},
		onDrop:     function(player_obj) {player_obj.data.speed = player_obj.data.speed-.25;},
		action:     function(player_obj) {}
	},
	{   
		data:{
			index: 1,
			name: 'Pin', 
			sprite: 994,
			effectText: '+.005 hpr',
			sprite_space: 32,
			rarity: 0
		},
		onPickup:   function(player_obj) {player_obj.data.health_regen = player_obj.data.health_regen+.005;}, 	
		onDrop:     function(player_obj) {player_obj.data.health_regen = player_obj.data.health_regen-.005;},
		action:     function(player_obj) {}
	},
	{   
		data:{
			index:2,
			name: 'Brace',
			sprite: 995,
			effectText: '+.1 spr',
			sprite_space: 64,
			rarity: 0
		}, 
		onPickup:   function(player_obj) {player_obj.data.spirit_regen = player_obj.data.spirit_regen+.1;},
		onDrop:     function(player_obj) {player_obj.data.spirit_regen = player_obj.data.spirit_regen-.1;},
		action:     function(player_obj) {}
	},
	{   
		data:{
			index:3,
			name: 'Tabard', 
			sprite: 996,
			effectText: '+move+atk',
			sprite_space: 96,
			rarity: 0
		},
		onPickup:   function(player_obj) {player_obj.data.move_while_attacking = true;},
		onDrop:	    function(player_obj) {player_obj.data.move_while_attacking = false;},
		action:     function(player_obj) {}
	},
	{   
		data:{
			index:4,
			name: 'Robe', 
			sprite: 997,
			effectText: '+1 def',
			sprite_space: 128,
			rarity: 0
		},
		onPickup:   function(player_obj) {player_obj.data.base_defense = player_obj.data.base_defense+1}, 
		onDrop:     function(player_obj) {player_obj.data.base_defense = player_obj.data.base_defense-1},
		action:     function(player_obj){}
	},
	{   
		data:{
			index:5,
			name: 'Horns',
			sprite: 998,
			effectText: '+1 dmg',
			sprite_space: 160,
			rarity: 0
		},
		onPickup:   function(player_obj) {player_obj.data.base_damage = player_obj.data.base_damage+1},
		onDrop:	    function(player_obj) {player_obj.data.base_damage = player_obj.data.base_damage-1},
		action:     function(player_obj){}
	},
	{   
		data:{
			index: 6,
			name: 'S.Scarf', 
			sprite: 961,
			effectText: '+1.0 spd', 
			sprite_space: 192,
			rarity: 15
		},
		onPickup:   function(player_obj) {player_obj.data.speed = player_obj.data.speed+1;},
		onDrop:     function(player_obj) {player_obj.data.speed = player_obj.data.speed-1;},
		action:     function(player_obj) {}
	},
	{   
		data:{
			index: 7,
			name: 'S.Pin', 
			sprite: 962,
			effectText: '+.05 hpr',
			sprite_space: 224,
			rarity: 19
		},
		onPickup:   function(player_obj) {player_obj.data.health_regen = player_obj.data.health_regen+.05;}, 	
		onDrop:     function(player_obj) {player_obj.data.health_regen = player_obj.data.health_regen-.05;},
		action:     function(player_obj) {}
	},
	{   
		data:{
			index:8,
			name: 'S.Brace',
			sprite: 963,
			effectText: '+.5 spr',
			sprite_space: 256,
			rarity: 10
		}, 
		onPickup:   function(player_obj) {player_obj.data.spirit_regen = player_obj.data.spirit_regen+.5;},
		onDrop:     function(player_obj) {player_obj.data.spirit_regen = player_obj.data.spirit_regen-.5;},
		action:     function(player_obj) {}
	},
	{   
		data:{
			index:9,
			name: 'S.Robe', 
			sprite: 965,
			effectText: '+5 def',
			sprite_space: 320,
			rarity: 10
		},
		onPickup:   function(player_obj) {player_obj.data.base_defense = player_obj.data.base_defense+5}, 
		onDrop:     function(player_obj) {player_obj.data.base_defense = player_obj.data.base_defense-5},
		action:     function(player_obj){}
	}
];

var augment_animations = [	//template for augment animations
	[	//h
		[{x:144,y:0,h:16,w:16,dur:4}],
		[{x:128,y:16,h:16,w:16,dur:4}],
		[{x:128,y:0,h:16,w:16,dur:4}],
		[{x:144,y:16,h:16,w:16,dur:4}]
	],
	[	//b_idle
		[{x:160,y:24,h:8,w:16,dur:4}],
		[{x:160,y:16,h:8,w:16,dur:4}],
		[{x:160,y:0,h:8,w:16,dur:4}],
		[{x:160,y:8,h:8,w:16,dur:4}]
	],
	[	//b_walk
		[{x:176,y:24,h:8,w:16,dur:4},	{x:160,y:24,h:8,w:16,dur:4},	{x:192,y:24,h:8,w:16,dur:4},	{x:160,y:24,h:8,w:16,dur:4}],
		[{x:176,y:16,h:8,w:16,dur:4},	{x:160,y:16,h:8,w:16,dur:4},	{x:192,y:16,h:8,w:16,dur:4},	{x:160,y:16,h:8,w:16,dur:4}],
		[{x:176,y:0,h:8,w:16,dur:4},	{x:160,y:0,h:8,w:16,dur:4},		{x:192,y:0,h:8,w:16,dur:4},		{x:160,y:0,h:8,w:16,dur:4}],
		[{x:176,y:8,h:8,w:16,dur:4},	{x:160,y:8,h:8,w:16,dur:4},		{x:192,y:8,h:8,w:16,dur:4},		{x:160,y:8,h:8,w:16,dur:4}]
	],
	[	//b_attack
		[{x:208,y:24,h:8,w:16,dur:4},	{x:224,y:24,h:8,w:16,dur:4},	{x:240,y:24,h:8,w:16,dur:4}],
		[{x:208,y:16,h:8,w:16,dur:4},	{x:224,y:16,h:8,w:16,dur:4},	{x:240,y:16,h:8,w:16,dur:4}],
		[{x:208,y:0,h:8,w:16,dur:4},	{x:224,y:0,h:8,w:16,dur:4},		{x:240,y:0,h:8,w:16,dur:4}],
		[{x:208,y:8,h:8,w:16,dur:4},	{x:224,y:8,h:8,w:16,dur:4},		{x:240,y:8,h:8,w:16,dur:4}]
	]
	
];

function augment_draw(states, dir) {
	var out = {h:augment_animations[0][dir], b:augment_animations[1][dir]};
	
	if (states.is_idle == true) {
		out = {h:augment_animations[0][dir], b:augment_animations[1][dir]};
	}
	
	if (states.is_moving == true) {
		out = {h:augment_animations[0][dir], b:augment_animations[2][dir]};
	}
	
	if (states.is_attacking == true) {
		out = {h:augment_animations[0][dir], b:augment_animations[3][dir]};
	}
	return out;
}

try {
	module.exports = {
		augments:augments
	}
}
catch (e) {
	console.log(e);
}