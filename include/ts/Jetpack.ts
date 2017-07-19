function Jetpack() {
	
	var self = this;

	this.paused = true;
	this.editMode = false;

	this.moveSpeed = 7;

	this.map; // Map object
	this.renderer; // Renderer object
	this.collisions; // Collisions object
	this.levels; // Levels object

	this.nextPlayerID = 1;
	this.score = 0;	

	this.playerTypes={
		'egg': {
			'type':'egg',
			'title':"It is of course the egg",
			'img':'egg-sprite.png',
			'frames':18,
			'multiplier':1
		},
		'red-egg': {
			'type':'red-egg',
			'title':"It is of course the red egg",
			'img':'egg-sprite-red.png',
			'frames':18,
			'multiplier':2
		},
		'blue-egg': {
			'type':'blue-egg',
			'title':"It is of course the blue egg",
			'img':'egg-sprite-blue.png',
			'frames':18,
			'multiplier':5
		},
		'yellow-egg': {
			'type':'yellow-egg',
			'title':"It is of course the yellow egg",
			'img':'egg-sprite-yellow.png',
			'frames':18,
			'multiplier':10
		}
	}
	
	

	this.players = [];

	this.go = function() {
		this.bootstrap();

		this.bindSizeHandler();
		this.bindClickHandler();
		
		this.createPlayers();
		
		this.resetScore();
		var s = setTimeout(function() {
			self.startRender();
		},1000);
	}

	// go function but for edit mode
	this.edit = function() {
		this.bootstrap();
		this.editMode = true;
		this.bindSizeHandler();
		this.bindClickHandler();
		var s = setTimeout(function() {
			self.startRender();
		},1000);
	}

	this.bootstrap = function() {
		var tileSet = new TileSet();
		var tiles = tileSet.getTiles();

		this.map = new Map(tiles);

		this.renderer = new Renderer(this, this.map, tiles, this.playerTypes);

		this.collisions = new Collisions(this);

		this.levels = new Levels(this);
	}

	this.startRender = function() {
		if (!this.paused) return false;
		window.cancelAnimationFrame(this.animationHandle);
		this.map.markAllForRedraw();
		this.paused = false;
		this.animationHandle = window.requestAnimationFrame(self.renderer.render);
	}

	this.resetScore = function(score) {
		this.score = 0;
		this.addScore(0);
	}

	this.addScore = function(amount) {
		this.score += amount;
		var scoreElement = document.getElementById('score');
		scoreElement.innerHTML = this.score;
	}



	this.pauseRender = function() {
		this.paused = true;
		window.cancelAnimationFrame(this.animationHandle);
	}

	

	this.doPlayerCalcs = function() {
		for (var i in this.players) {
			var player = this.players[i]
			player.doCalcs();
		}
	}



	this.createPlayers = function() {
		for (var i = 0; i < 4; i++) {
			var x = parseInt(Math.random() * this.map.boardSize.width) - 1;
			var y = parseInt(Math.random() * this.map.boardSize.height) - 2;
			if (x<0) x = 0;
			if (y<0) y = 0;
			var type = 'egg';
			var coords = {
				'x':x,
				'y':y,
				'offsetX':0,
				'offsetY':0
			}
			var player = this.createNewPlayer(type, coords, 1);	
		}
	}

	this.deletePlayer = function(player:Player) {
		delete this.players[player.id];
	}

	// create player and load their sprite
	this.createNewPlayer = function(type, coords, direction) {
		var playerType = this.playerTypes[type];
		var params = JSON.parse(JSON.stringify(playerType));
		params.id = this.nextPlayerID++;
		params.currentFrame = 0;
		params.x = coords.x; // x in tiles
		params.y = coords.y; // y in tiles
		params.direction = direction;
		params.oldDirection = 0;
		params.falling = false; // can't move when falling
		params.offsetX = coords.offsetX;
		params.offsetY = coords.offsetY;
		params.moveSpeed = this.moveSpeed;
		var player = new Player(params, this.map, this.renderer, this, this.collisions);
		this.players[player.id] = player;
		return player;
	}

	// make this actually fucking rotate, and choose direction, and do the visual effect thing
	this.rotateBoard = function(clockwise) {
		
		self.pauseRender();

		this.map.rotateBoard(clockwise);

		for (var i in this.players) {
			this.map.rotatePlayer(this.players[i], clockwise);
		}

		this.renderer.drawRotatingBoard(clockwise, function() {
			self.startRender();
		});

		return true;
	}

	this.revertEditMessage = function() {
		var s = setTimeout(function() {
			var message = document.getElementById('message');
			message.innerHTML="EDIT MODE";
		},3000);
	}

	this.showEditMessage = function(text) {
		var message = document.getElementById('message');
		message.innerHTML = text;
		this.revertEditMessage();
	}

	this.saveLevel = function() {
		this.levels.saveLevel(this.map.board, this.map.boardSize, this.levels.levelID, function(levelID) {
			var text = "Level " + levelID + " saved";
			self.showEditMessage(text);
		});
	}

	this.loadLevelFromList = function() {
		var select = document.getElementById('levelList');
        var index = select.selectedIndex;
        var levelID = select.options[index].value;
    	self.loadLevel(levelID);        
	}

	this.loadLevel = function(levelID) {
		this.levels.loadLevel(levelID, function(data) {
			var text = "Level " + data.levelID + " loaded!";
			self.showEditMessage(text);
			self.map.updateBoard(data.board, data.boardSize);
		})
	}

	this.bindSizeHandler = function() {
		window.addEventListener('resize', function() {
			self.checkResize = true; // as this event fires quickly - simply request system check new size on next redraw
		});
	}

	this.bindClickHandler = function() {
		var canvas = document.getElementById('canvas');
		canvas.addEventListener('click', function(event) {
		    var tileSize = self.renderer.tileSize;
		    var coords = {
		    	x: parseInt(event.offsetX / tileSize),
	        	y: parseInt(event.offsetY / tileSize),
	        	offsetX: (event.offsetX % tileSize) - (tileSize / 2),
	        	offsetY: (event.offsetY % tileSize) - (tileSize / 2)
	        }
	        self.handleClick(coords);
	    });
	}

	// coords is always x,y,offsetX, offsetY
	this.handleClick = function(coords) {
		if (this.editMode) {
			this.map.cycleTile(coords.x,coords.y);	
		} else {
			// destroy tile or something
		}
	}

	
}