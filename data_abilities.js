var abilities = [
	{
		name:'blink',
		blink_distance: 32,
		max_blink_distance: 32,
		action: function() {
			switch(player.data.dir) {
				case 0:	if (player.data.spirit > 5) {
							player.data.spirit = 0;
							player.data.y -=this.blink_distance;
							break;
						}
				case 1:	if (player.data.spirit > 5) {
							player.data.spirit = 0;
							player.data.x -=this.blink_distance;
							break;
						}
				case 2:	if (player.data.spirit > 5) {
							player.data.spirit = 0;
							player.data.y +=this.blink_distance;
							break;
						}
				case 3:	if (player.data.spirit > 5) {
							player.data.spirit = 0;
							player.data.x +=this.blink_distance;
							break;
						}
			}
		}
	}
];

module.exports = {
	abilities:abilities
}

