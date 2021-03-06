import { Collisions } from "./Collisions";
import { Coords } from "./Coords";
import { Jetpack } from "./Jetpack";
import { Map } from "./Map";
import { Renderer } from "./Renderer";

const SPRITE_SIZE: number = 64;

export class Player {

	map: Map;
	renderer: Renderer;
	jetpack: Jetpack;
	collisions: Collisions;

	x: number = 0;
	y: number = 0;
	offsetX: number = 0;
	offsetY: number = 0;
	direction: number = 0;
	oldDirection: number = 0;
	currentFrame: number = 0;
	id: number = 0;
	frames: number = 1;
	multiplier: number = 1;
	falling: boolean = false;
	type: string = "egg";
	moveSpeed: number = 1;
	lastAction: string = "string";
	value: number = 1;
	img: string;

	constructor(params: object, map: Map, renderer: Renderer, jetpack: Jetpack, collisions: Collisions) {
		for (const i in params) {
			this[i] = params[i];
		}
		this.map = map;
		this.renderer = renderer;
		this.jetpack = jetpack;
		this.collisions = collisions;
	}

	doCalcs() {
		this.setRedrawAroundPlayer();
		this.incrementPlayerFrame();
	 	this.checkFloorBelowPlayer();
	 	this.incrementPlayerDirection();
	 	this.checkPlayerCollisions();
	}

	getCoords() {
		return new Coords(this.x, this.y, this.offsetX, this.offsetY);
	}

	setRedrawAroundPlayer() {
		const coords = new Coords(this.x, this.y);
		const tiles = this.map.getTilesSurrounding(coords);
		tiles.map(tile => {
			tile.needsDraw = true;
		});
	}

	incrementPlayerFrame() {
		if (this.direction === 0 && this.oldDirection === 0 && this.currentFrame === 0) {
			// we are still, as it should be
			return false;
		}
		if (this.direction === 0 && this.currentFrame === 0) {
			// if we're still, and have returned to main frame, disregard old movement
			this.oldDirection = 0;
		}

		// if going left, reduce frame
		if (this.direction < 0 || this.oldDirection < 0) {
			this.currentFrame --;
			if (this.currentFrame < 0) this.currentFrame = (this.frames - 1);
		}

		// if going left, reduce frame
		if (this.direction > 0 || this.oldDirection > 0) {
			this.currentFrame++;
		 if (this.currentFrame >= this.frames) this.currentFrame = 0;
		}
	}

	checkPlayerTileAction() {

		if (this.offsetX != 0 || this.offsetY != 0) return false;

		const coords: Coords = this.map.correctForOverflow(this.x, this.y);

		const tile = this.map.getTileWithCoords(coords);

		if (tile.collectable > 0) {
			const score = tile.collectable * this.multiplier;
			const blankTile = this.map.cloneTile(1);
			blankTile.needsDraw = true;
			this.map.changeTile(coords,blankTile);
			this.jetpack.addScore(score);
			return true;
		}

		if (tile.action == "completeLevel") {
			return this.jetpack.completeLevel();
		} else if (tile.action == "teleport") {
			return this.teleport();
		}

		if (this.falling) {
			const belowCoords = this.map.correctForOverflow(coords.x, coords.y + 1);

			const belowTile = this.map.getTileWithCoords(belowCoords);

			if (belowTile.breakable) {
				this.map.changeTile(belowCoords,this.map.cloneTile(1)); // smash block, replace with empty
				return true;
			}
		}

	}

	checkPlayerCollisions() {
		for (const i in this.jetpack.players) {
			const player = this.jetpack.players[i];
			this.collisions.checkCollision(this, player);
		}
	}

	// find another teleport and go to it
	// if no others, do nothing
	teleport() {
		if (this.lastAction == "teleport") return false;
		const newTile = this.findTile(14);
		if (newTile) {
			this.x = newTile.x;
			this.y = newTile.y;
			this.lastAction = "teleport";
		}
	}

	// find random tile of type
	findTile(id) {
		const tiles = this.map.getAllTiles();
		const teleporters = tiles.filter((tile) => {
			if (tile.x == this.x && tile.y == this.y) return false;
			return (tile.id == id);
		});
		if (teleporters.length == 0) return false; // no options
		const newTile = teleporters[Math.floor(Math.random() * teleporters.length)];
		return newTile;
	}

	incrementPlayerDirection() {

		if (this.falling) return false;
		/*
		if (this.direction !== 0 && !this.checkTileIsEmpty(this.x - 1, this.y) && !this.checkTileIsEmpty(this.x + 1, this.y)) {
			// trapped
			this.oldDirection = this.direction;
			this.direction = 0;
			return false;
		}*/

		const moveAmount = this.calcMoveAmount(this.moveSpeed, this.renderer.tileSize);

		if (this.direction < 0) {
			if (!this.map.checkTileIsEmpty(this.x - 1, this.y)) {
				// turn around
				this.direction = 1;
				this.offsetX = 0;
			} else {
				// move
				this.offsetX -= moveAmount;
			}
		}

		if (this.direction > 0) {
			if (!this.map.checkTileIsEmpty(this.x + 1, this.y)) {
				// turn around
				this.offsetX = 0;
				this.direction = -1;
			} else {
				// move
				this.offsetX += moveAmount;
			}
		}

		// if we've stopped and ended up not quite squared up, correct this
		if (this.direction == 0 && this.falling == false) {
			if (this.offsetX > 0) {
				this.offsetX -= moveAmount;
			} else if (this.offsetX < 0) {
				this.offsetX += moveAmount;
			}
		}
		this.checkIfPlayerIsInNewTile();
	}

	calcMoveAmount(moveSpeed: number, tileSize: number) {
		const fullSize = SPRITE_SIZE; // size of image tiles
		const moveAmount: number = (tileSize / fullSize) * moveSpeed;
		return Math.round(moveAmount);
	}

	checkIfPlayerIsInNewTile() {
		if (this.offsetX > SPRITE_SIZE) {
			this.offsetX = 0;
			this.x ++;
			this.lastAction = "";
			this.checkPlayerTileAction();
		}
		if (this.offsetX < (-1 * SPRITE_SIZE)) {
			this.offsetX = 0;
			this.x --;
			this.lastAction = "";
			this.checkPlayerTileAction();
		}
		if (this.offsetY > SPRITE_SIZE) {
			this.offsetY = 0;
			this.y ++;
			this.lastAction = "";
			this.checkPlayerTileAction();
		}
		if (this.offsetY < (-1 * SPRITE_SIZE)) {
			this.offsetY = 0;
			this.y --;
			this.lastAction = "";
			this.checkPlayerTileAction();
		}
		// have we gone over the edge?
		const coords = this.map.correctForOverflow(this.x, this.y);
		this.x = coords.x;
		this.y = coords.y;
	}

	checkFloorBelowPlayer() {

		if (this.offsetX !== 0) return false;

		const coords = this.map.correctForOverflow(this.x, this.y + 1);

		const tile = this.map.getTileWithCoords(coords);

		if (tile.background) {
			const moveAmount: number = this.calcMoveAmount(this.moveSpeed, this.renderer.tileSize);
			const fallAmount: number = Math.round(moveAmount * 1.5);		
			this.falling = true;
			this.offsetY += fallAmount;
		} else if (this.falling && tile.breakable) {
			this.checkPlayerTileAction();
		} else {
			this.falling = false;
		}

		this.checkIfPlayerIsInNewTile();
	}
}
