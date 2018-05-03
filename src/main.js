// Initialize Firebase
let config = {
	apiKey: "AIzaSyA9EYUXVL5WAh6Aam1qXlWyvi3b7HLcZ1U",
	authDomain: "esigamma.firebaseapp.com",
	databaseURL: "https://esigamma.firebaseio.com",
	projectId: "esigamma",
	storageBucket: "esigamma.appspot.com",
	messagingSenderId: "734163636039"
};
firebase.initializeApp(config);

let database = firebase.database();
let battleship = Ship();

let test;

function getParameterByName(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
	let results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function Simulation() {
	
	// private
	let Constants = {
		GridScale: 4,
		CameraYOffset: 25,
		OceanYOffset: 0,
		OceanPadding: 10,
		ShipYOffset: 0,
		SinkDistance: 5,
		BulletArc: 2,
		WaitTimePerTileMoved: 300,
		WaitTimeBetweenAction: 50 // in miliseconds
	};

	let m_input = {};
	
	let m_ships = []; // stores formatted json of ship initialization
	let m_chain = []; // stores chainable actions in a turn
	let m_entity = {}; // object with id to html dom element of ships

	let m_test = 0;

	let m_ocean; 

	function transform(data, scale, OPTION) {
		console.log("transform() ", data);
		let result = data.map((entry) => {
			if (entry.hasOwnProperty("atX") && entry.hasOwnProperty("atY")) {
				entry.atX = scale * entry.atX;
				entry.atZ = scale * entry.atY; // 3D uses the xz plane as part of the ground
				entry.atY = OPTION.ShipYOffset; // vertical offset with respect to the ground and user in VR mode
			}
			entry.x = scale * entry.x;
			entry.z = scale * entry.y; // 3D uses the xz plane as part of the ground
			entry.y = OPTION.ShipYOffset;
			return entry;
		});
		return result;
	};

	function reducer(tree, action, OPTION) {
		console.log(tree);
		let structure = {
			states: tree.states,
			next: action
		};

		structure.states = tree.states.map((ship) => {
			if (action.id === ship.id) {
				switch(action.type) {
					case 'MOVE':
						// iterate over all the chained actions and apply it the the state
						// function would need to check validity in movement, which not checked in the data
						// action.actions.forEach((a) => {
						// 	if (a.direction === "North") {
						// 		if (ship.z > 0)
						// 			ship.z -= OPTION.GridScale;
						// 	}
						// 	else if (a.direction === "South") {
						// 		ship.z += OPTION.GridScale;
						// 	}
						// 	else if (a.direction === "West") {
						// 		if (ship.x > 0)
						// 			ship.x -= OPTION.GridScale;
						// 	}
						// 	else if (a.direction === "East") {
						// 		ship.x += OPTION.GridScale;
						// 	}
						// });

						// shortcut, update state from the result of the last action list
						let last = action.actions[action.actions.length-1];
						ship.z = last.z;
						ship.x = last.x;
						return ship;
					case 'Sunk':
						ship.sunk = true;
						return ship;
					default:
						return ship;
				}
			}
			else {
				return ship;
			}
		});
		return structure;
	}

	function preprocess(data, OPTION) {
		let result = {};
		console.log("preprocess() ", data);

		// defines the ocean/map configuration
		result.map = {
			x: ((OPTION.GridScale*Math.floor(data.ocean.x/2))-2),
			y: OPTION.OceanYOffset, 
			z: ((OPTION.GridScale*Math.floor(data.ocean.y/2))),
			width: 200, 
			depth: 200,
			density: 120
		}

		// scale up ship's initial locations
		result.ships = transform(data.ships, OPTION.GridScale);

		// add sunk property into the initial state of the ships
		result.ships.forEach((ship) => {
			ship.sunk = false;
		});

		// scale up coordinates in the action list, then call the actionChain to group sequences of action into a unit
		result.turns = actionChain( transform(data.turns, OPTION.GridScale, OPTION) );
		result.turns.push({type: 'END', actions: undefined}); // add end of simulation marker

		console.log(result);

		result.snapshots = {
			past: [],
			present: {},
			future: []
		};

		console.log('init states: ', result.ships);

		let currentState = {states: result.ships, next: resutl.turns[0]};
		result.turns.forEach((turn) => {
			result.snapshots.future.append(currentState);
			currentState = reducer(currentState, turn, OPTION);
		});
		// result.snapshots.future.reverse();
		result.snapshots.present = result.snapshots.future.pop(0);

		console.log(result);
		return result;
	}

	function render(data, OPTION) {
		let htmlElement = {};
		let doc = document.getElementById('scene'); // <a-scene> reference

		// reposition camera - camera must be already present when html loads
		let camera = document.getElementById('camera');
		//camera.setAttribute('position', data.ocean.x + " " + data.ocean.y + " " + data.ocean.z);
		camera.setAttribute('position', data.map.x + " " + data.map.y + " " + (data.map.z+(1.5*data.map.x)));
		camera.setAttribute('camera', 'userHeight: ' + OPTION.CameraYOffset);
		camera.setAttribute('rotation', -Math.atan(OPTION.CameraYOffset/(data.map.z+data.map.x)));

		// Generate Map
		// TODO: Possible edge cases with the map edge not being big enough
		let map = document.createElement('a-ocean');
		map.setAttribute('position', data.map.x + " " + data.map.y + " " + data.map.z);
		map.setAttribute('width', String(data.map.width));
		map.setAttribute('depth', String(data.map.depth));
		map.setAttribute('density', String(data.map.density));
		doc.appendChild(map);

		// Spawn Ships
		data.ships.forEach((entry) => {
			htmlElement[entry.id] = battleship.render(entry);
		});
	}

	function initScene(inputs) {
		let doc = document.getElementById('scene');
		let track = document.createElement('a-curve');
		track.setAttribute('id', 'track');
		track.setAttribute('type', 'Line');
		doc.appendChild(track);

		console.log("initScene() ", inputs);
		let data = preprocess(inputs, Constants);

		let htmlElements = render(data, Constants);
		console.log(data);

		let slide = document.getElementById('slider');
		slide.setAttribute('min', 0);
		slide.setAttribute('max', data.snapshots.future.length);
		slide.value = 0;

		let model = {
			html: htmlElements,
			snapshots:data.snapshots
		};
		test = model;

		// begin simulation
		setTimeout(() => {
			simulate(model, Constants);
		}, 10000)
	}

	function simulate() {
		//console.log("chain: ", m_chain);
		var notStop = true;
		if (m_chain.length == 0) {
			notStop = false;
		}
		var current = m_chain.shift(); // don't shift when length is zero
		if (current && notStop) {
			//console.log("current: ", current);
			switch(current.type) {
				case "MOVE":
					battleship.moveShip(current.actions).then((done) => {
						//alert("Moved " + m_chain.length + " actions left");
						simulate();
					}).catch((err) => {
						console.error(err);
					});
					break;
				case "FIRE":
					/*** Exclusive Or functions ***/

					/* Fire without aiming */
					battleship.fireShip(current.actions).then((done) => {
						simulate();
					}).catch((err) => {
						console.error("error: ", err);	
					});

					// /* Aim then fire (currently buggy)*/
					// battleship.aimShip(current.actions).then((done) => {
					// 	battleship.fireShip(current.actions).then((done) => {
					// 		simulate();
					// 	}).catch((err) => {
					// 		console.error("error: ", err);	
					// 	});
					// }).catch((err) => {
					// 	console.error("error: ", err);
					// });
					break;
				case "HIT":
					battleship.hitShip(current.actions).then((done) => {
						simulate();
					}).catch((err) => {
						console.log(err);
					});
					break;
				case "SINK":
					battleship.sinkShip(current.actions).then((done) => {
						//alert("Sunk "+ m_chain.length + " actions left");
						simulate();
					}).catch((err) => {
						console.error(err);
					});
					break;
				default:
					console.warn(`Unknown Action type ${current.type} in simulate function, skipping.`);
					simulate();
			}
		} else {
			setTimeout(() => {
				//alert("Simulation Done");
				vex.dialog.alert("Simulation Completed.");
			}, 1000);
		}
	}

	// public
	var app = {

		init: () => {
			let inputs = {};
			let code = getParameterByName('code');

			if (code) {
				let ref = database.ref('davy-jones-locker').child(code);
				ref.once('value', (res) => {
					inputs = {
						"ids": res.val().init.ships.map((s) => { return s.id }),
						"ships": res.val().init.ships,
						"turns": res.val().turns,
						"ocean": res.val().init.map
					};
				}, (err) => { 
					console.warn(`Unknown URL Code ${code}, using default offline input`);
					inputs = {
						"ids": input.init.ships.map((s) => { return s.id }),
						"ships": input.init.ships, 
						"turns": input.turns, 
						"ocean": input.init.map
					};
				})
				.then(() => {
					console.log("init() ", inputs);
					initScene(inputs);
				})
			}
			else {
				console.log('Missing URL parameter code, using default offline input');
				inputs = {
					"ids": input.init.ships.map((s) => { return s.id }),
					"ships": input.init.ships, 
					"turns": input.turns, 
					"ocean": input.init.map
				}
				console.log("init() ", inputs);
				initScene(inputs);
			}
		}
	};

	return app;
}

let app = Simulation();
app.init();

//let params = getParameterByName(document.location.search);

// let getDataFromCode = (code) => {
// 	database.ref('davy-jones-locker/' + code).once('value', (snapshot) => {
// 		var gameData = snapshot.val();
// 		if (gameData) {
// 			input = gameData;
// 			app.init();
// 		} else {
// 			getCode(`No data for code ${code}. Enter another code:`);
// 			//app.init();
// 		}
// 	}).catch((err) => {
// 		getCode(`There was an error. Enter another code:`);
// 		//app.init();
// 	});
// }

// let getCode = (message) => {
// 	vex.dialog.prompt({
// 		message: message,
// 		callback: (value) => {
// 			if (value) {
// 				var code = value;
// 				getDataFromCode(code);
// 			} else {
// 				getCode("No code entered. Enter your code:");
// 			}
// 		}
// 	});
// }

// if (params.code) {
// 	getDataFromCode(params.code);
// } else {
// 	getCode("Enter Your Code");
// }


// var BATTLE_SERVER_URL = 'https://battleship-vingkan.c9users.io/1v1?p1=esi17.cs.DestroyerShip&p2=esi17.hli109.Floater';// + Math.ceil(Math.random() * 100);

// $.get(BATTLE_SERVER_URL).then(data => {
// 	input = data;
// 	app.init();
// }).done(() => {
// 	console.log("Data successfully retrieved from server");
// }).fail(() => {
// 	console.log("Unable to retrieve data, starting with local data");
// 	app.init();
// });



