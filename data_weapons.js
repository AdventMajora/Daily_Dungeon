var screen_width = 160;		        //Game Resolution Width
var screen_height = 144;		    //Game Resolution Height
var tile_size = 8;
////////////////////////////////weapons///////////////////////////////////

var weps = [
	{   name:'cursed sword',
		index:0,
		sprite: 929,
		rarity: 5,
		type: 0,
		init_cost: 3,	//cost to start using the weapon
		cont: false,	//does this weapon work continuosly?
		swung: false,	//has this weapon been swung?
		use_cost: .1,	//cost to continue using the weapon
		knockback: 8,	//how far does this weapon push the enemeis back (in pixels)?
		curseScale: 0,	//does using this weapon afflict curse?
		hitbox: [		//areas of effect per animation (relative x,y,(relative to player) height and width of hitbox, duration of hitbox)
			[{x: 0, y: -16, w:16, h:8, dur:4},	{x: -12, y: -16, w:16, h:8, dur:4},	{x: -12, y: -8, w:8, h:16, dur:4}],
			[{x: 0, y: -16, w:16, h:8, dur:4},	{x: -12, y: -16, w:16, h:8, dur:4},	{x: -12, y: -8, w:8, h:16, dur:4}],
			[{x: -8, y: +8, w:16, h:8, dur:4},	{x: +4, y: +8, w:16, h:8, dur:4},	{x: +12, y: -8, w:8, h:16, dur:4}],
			[{x: -12, y: -16, w:16, h:8, dur:4},{x: 0, y: -16, w:16, h:8, dur:4},	{x: +12, y: -8, w:8, h:16, dur:4}],
		],
		animations: [	//image coordinate from sheet
			[{x:0,y:0,w:32,h:32},	{x:32,y:0,w:32,h:32},	{x:64,y:0,w:32,h:32}],
			[{x:0,y:32,w:32,h:32},	{x:32,y:32,w:32,h:32},	{x:64,y:32,w:32,h:32}],
			[{x:0,y:64,w:32,h:32},	{x:32,y:64,w:32,h:32},	{x:64,y:64,w:32,h:32}],
			[{x:0,y:96,w:32,h:32},	{x:32,y:96,w:32,h:32},	{x:64,y:96,w:32,h:32}]
		],
		damage: 3,		//damage this weapon deals
		durCount:0,		//how long has this weapon been in use?
		atkIndex:0,		//frame of attack we are in
		actioning: false,	//is the weapon in use?
		buffs:[]
	},
	{   name:'dagger',
		rarity: 99,
		index: 1,
		sprite: 930,
		type: 0,
		init_cost: 3,	//cost to start using the weapon
		cont: false,	//does this weapon work continuosly?
		swung: false,	//has this weapon been swung?
		use_cost: .1,	//cost to continue using the weapon
		knockback: 8,	//how far does this weapon push the enemeis back (in pixels)?
		curseScale: 0,	//does using this weapon afflict curse?
		hitbox: [		//areas of effect per animation (relative x,y,(relative to player) height and width of hitbox, duration of hitbox)
			[{x: 0, y: -16, w:16, h:4, dur:4},	{x: -12, y: -16, w:16, h:4, dur:4},	{x: -12, y: -8, w:4, h:16, dur:4}],
			[{x: 0, y: -16, w:16, h:4, dur:4},	{x: -12, y: -16, w:16, h:4, dur:4},	{x: -12, y: -8, w:4, h:16, dur:4}],
			[{x: -8, y: +8, w:16, h:4, dur:4},	{x: +4, y: +8, w:16, h:4, dur:4},	{x: +12, y: -8, w:4, h:16, dur:4}],
			[{x: -12, y: -16, w:16, h:4, dur:4},{x: 0, y: -16, w:16, h:4, dur:4},	{x: +12, y: -8, w:4, h:16, dur:4}],
		],
		animations: [	//image coordinate from sheet
			[{x:0,y:128,w:32,h:32},	{x:32,y:128,w:32,h:32},	{x:64,y:129,w:32,h:32}],
			[{x:0,y:160,w:32,h:32},	{x:32,y:160,w:32,h:32},	{x:64,y:160,w:32,h:32}],
			[{x:0,y:192,w:32,h:32},	{x:32,y:192,w:32,h:32},	{x:64,y:192,w:32,h:32}],
			[{x:0,y:224,w:32,h:32},	{x:32,y:224,w:32,h:32},	{x:64,y:224,w:32,h:32}]
		],
		damage: 1,		//damage this weapon deals
		durCount:0,		//how long has this weapon been in use?
		atkIndex:0,		//frame of attack we are in
		actioning: false,	//is the weapon in use?
		buffs:[]
	},
	{   name:'firebrand',
		index: 2,
		rarity: 7,
		sprite: 931,
		type: 0,
		init_cost: 5,	//cost to start using the weapon
		cont: false,	//does this weapon work continuosly?
		swung: false,	//has this weapon been swung?
		use_cost: .1,	//cost to continue using the weapon
		knockback: 8,	//how far does this weapon push the enemeis back (in pixels)?
		curseScale: 0,	//does using this weapon afflict curse?
		hitbox: [		//areas of effect per animation (relative x,y,(relative to player) height and width of hitbox, duration of hitbox)
			[{x: 0, y: -16, w:16, h:8, dur:5},	{x: -12, y: -16, w:16, h:8, dur:5},	{x: -12, y: -8, w:8, h:16, dur:5}],
			[{x: 0, y: -16, w:16, h:8, dur:5},	{x: -12, y: -16, w:16, h:8, dur:5},	{x: -12, y: -8, w:8, h:16, dur:5}],
			[{x: -8, y: +8, w:16, h:8, dur:5},	{x: +4, y: +8, w:16, h:8, dur:5},	{x: +12, y: -8, w:8, h:16, dur:5}],
			[{x: -12, y: -16, w:16, h:8, dur:5},{x: 0, y: -16, w:16, h:8, dur:5},	{x: +12, y: -8, w:8, h:16, dur:5}],
		],
		animations: [	//image coordinate from sheet
			[{x:96,y:0,w:32,h:32},	{x:128,y:0,w:32,h:32},	{x:160,y:0,w:32,h:32}],
			[{x:96,y:32,w:32,h:32},	{x:128,y:32,w:32,h:32},	{x:160,y:32,w:32,h:32}],
			[{x:96,y:64,w:32,h:32},	{x:128,y:64,w:32,h:32},	{x:160,y:64,w:32,h:32}],
			[{x:96,y:96,w:32,h:32},	{x:128,y:96,w:32,h:32},	{x:160,y:96,w:32,h:32}]
		],
		damage: 5,		//damage this weapon deals
		durCount:0,		//how long has this weapon been in use?
		atkIndex:0,		//frame of attack we are in
		actioning: false,	//is the weapon in use?
		buffs:["fire"]
	},
	{   name:'chidori',
		index: 3,
		sprite: 932,
		rarity: 19,
		type: 0,
		init_cost: 8,	//cost to start using the weapon
		cont: false,	//does this weapon work continuosly?
		swung: false,	//has this weapon been swung?
		use_cost: .1,	//cost to continue using the weapon
		knockback: 8,	//how far does this weapon push the enemeis back (in pixels)?
		curseScale: 0,	//does using this weapon afflict curse?
		hitbox: [		//areas of effect per animation (relative x,y,(relative to player) height and width of hitbox, duration of hitbox)
			[{x: 0, y: -16, w:16, h:16, dur:6},	{x: -12, y: -16, w:16, h:16, dur:4},	{x: -12, y: -8, w:16, h:16, dur:4}],
			[{x: 0, y: -16, w:16, h:16, dur:6},	{x: -12, y: -16, w:16, h:16, dur:4},	{x: -12, y: -8, w:16, h:16, dur:4}],
			[{x: -8, y: +8, w:16, h:16, dur:6},	{x: +4, y: +8, w:16, h:16, dur:4},	{x: +12, y: -8, w:16, h:16, dur:4}],
			[{x: -12, y: -16, w:16, h:16, dur:6},{x: 0, y: -16, w:16, h:16, dur:4},	{x: +12, y: -8, w:16, h:16, dur:4}],
		],
		animations: [	//image coordinate from sheet
			[{x:96,y:128,w:32,h:32},	{x:128,y:128,w:32,h:32},	{x:160,y:128,w:32,h:32}],
			[{x:96,y:160,w:32,h:32},	{x:128,y:160,w:32,h:32},	{x:160,y:160,w:32,h:32}],
			[{x:96,y:192,w:32,h:32},	{x:128,y:192,w:32,h:32},	{x:160,y:192,w:32,h:32}],
			[{x:96,y:224,w:32,h:32},	{x:128,y:224,w:32,h:32},	{x:160,y:224,w:32,h:32}]
		],
		damage: 5,		//damage this weapon deals
		durCount:0,		//how long has this weapon been in use?
		atkIndex:0,		//frame of attack we are in
		actioning: false,	//is the weapon in use?
		buffs:["electric"],
		target_tiles:[]
	}/*,
	{   name:'wep_continuos_test',
		index:4,
		type: 0,
		init_cost: 3,	//cost to start using the weapon
		cont: true,		//does this weapon work continuosly?
		swung: false,	//has this weapon been swung?
		use_cost: .1,	//cost to continue using the weapon
		knockback: 8,	//how far does this weapon push the enemeis back (in pixels)?
		curseScale: 0,	//does using this weapon afflict curse?
		hitbox: [		//areas of effect per animation (relative x,y,(relative to player) height and width of hitbox, duration of hitbox)
			[{x: 0, y: -16, w:16, h:8, dur:2},	{x: -12, y: -16, w:16, h:8, dur:2},	{x: -12, y: -8, w:8, h:16, dur:2}],
			[{x: 0, y: -16, w:16, h:8, dur:2},	{x: -12, y: -16, w:16, h:8, dur:2},	{x: -12, y: -8, w:8, h:16, dur:2}],
			[{x: -8, y: +8, w:16, h:8, dur:2},	{x: +4, y: +8, w:16, h:8, dur:2},	{x: +12, y: -8, w:8, h:16, dur:2}],
			[{x: -12, y: -16, w:16, h:8, dur:2},{x: 0, y: -16, w:16, h:8, dur:2},	{x: +12, y: -8, w:8, h:16, dur:2}],
		],
		animations: [	//image coordinate from sheet
			[{x:0,y:0,w:32,h:32},	{x:32,y:0,w:32,h:32},	{x:64,y:0,w:32,h:32}],
			[{x:0,y:32,w:32,h:32},	{x:32,y:32,w:32,h:32},	{x:64,y:32,w:32,h:32}],
			[{x:0,y:64,w:32,h:32},	{x:32,y:64,w:32,h:32},	{x:64,y:64,w:32,h:32}],
			[{x:0,y:96,w:32,h:32},	{x:32,y:96,w:32,h:32},	{x:64,y:96,w:32,h:32}]
		],
		damage: 1,		//damage this weapon deals
		durCount:0,		//how long has this weapon been in use?
		atkIndex:0,		//frame of attack we are in
		actioning: false,	//is the weapon in use?
		buffs:[]
	}*/
];

try {
	module.exports = {
		weps:weps
	}
}
catch (e) {
	
}