import { Player } from '../Player.ts';

test("Create a player and check defaults", () => {
	var player = new Player();
	expect(player.x).toEqual(0);
	expect(player.y).toEqual(0);
	expect(player.offsetX).toEqual(0);
	expect(player.offsetY).toEqual(0);
	expect(player.direction).toEqual(0);
	expect(player.oldDirection).toEqual(0);
	expect(player.currentFrame).toEqual(0);
}

test("Stay still when not moving", () => {
	var player = new Player();
	expect(player.incrementPlayerFrame()).toEqual(false);
}

test("Wipe old direction when stopped", () => {
	var player = new Player();
	player.oldDirection = 1;
	player.incrementPlayerFrame();
	expect(player.oldDirection).toEqual(0);
}

test("change frame left", () => {
	var player = new Player();
	player.currentFrame = 3;
	player.direction = -1;
	player.incrementPlayerFrame();
	expect(player.currentFrame).toEqual(2);
}

test("change frame right", () => {
	var player = new Player();
	player.currentFrame = 10;
	player.frames = 11;
	player.oldDirection = 1;
	player.incrementPlayerFrame();
	expect(player.currentFrame).toEqual(0);
}

test("only check tile action when in whole grid", () => {
	var player = new Player();
	player.offsetX = 12;
	expect(player.checkPlayerTileAction()).toEqual(false);
}

test("Calculate move amount", () => {
	var player = new Player();
	expect(player.calcMoveAmount(10,64)).toEqual(10);
	expect(player.calcMoveAmount(10,32)).toEqual(5);
}
