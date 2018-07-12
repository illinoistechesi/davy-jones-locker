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

function Simulation() {
	
	// private
	let OPTION = {
		GridScale: 4,
		CameraYOffset: 15,
		OceanYOffset: 0,
		OceanPadding: 10,
		ShipYOffset: 0,
		SinkDistance: 5,
		BulletArc: 2,
		WaitTimePerTileMoved: 300,
		WaitTimeBetweenAction: 50 // in miliseconds
	};

	let EVENTS = {
		SliderMouseDown: false,
		SliderMouseUp: false,
		SliderValue: 0
	};

	function getParameterByName(name, url) {
		if (!url) url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
		let results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}

	function transform(data, scale) {
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

	function mapProperty(shipProp, action) {
		console.log(shipProp);
		let structure = {
			states: shipProp.states,
			task: action
		};

		structure.states = shipProp.states.map((ship) => {
			if (action.id === ship.id) {
				switch(action.type) {
					case 'MOVE':
						// update state from the result of the last action list
						let last = action.actions[action.actions.length-1];
						ship.z = last.z;
						ship.x = last.x;
						return ship;
					case 'SINK':
						ship.sunk = true;
						return ship;
					case 'Hit':
						ship.health--;
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

	// Map a sequence of actions that are considered atomic into a chain-able list of actions for smooth animation and movements 
	function actionChain(data) {
		let result = [];
		data.map((entry) => {
			if (result && result.length > 0) { 
				// result[i] will always have at least one item in its action attribute list
				let last = result[result.length-1].actions;
				// action can be chained if they are of the same type from the same ship id
				// console.log("Comparing: ", result[result.length-1], last, entry);
				if (last[0].id === entry.id && last[0].type === entry.type && 
					((last[0].type === "MOVE") || 
					 (last[0].type === "FIRE" && last[0].atX === entry.atX && last[0].atY === entry.atY) )) {
					// Movement can be chained and firing at the same location can be chained
					last.push(entry);
				} 
				else {
					result.push({
						type: entry.type,
						actions: [entry]
					});
				}
			} 
			else { // if result is empty, initial case
				result.push({
					type: entry.type,
					actions: [entry]
				});
			}
		});
		console.log(result);
		return result;
	}

	function preprocess(data) {
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
			ship.health = ship.hull;
		});

		// scale up coordinates in the action list, then call the actionChain to group sequences of action into a unit
		result.turns = actionChain( transform(data.turns, OPTION.GridScale) );
		result.turns.push({type: 'END', actions: undefined}); 
		result.turns.unshift({type: 'START', actions: undefined});

		console.log(result);

		result['timeline'] = [];
		result['present'] = 0;

		console.log('init states: ', result.ships);

		let currentState = {states: result.ships, task: result.turns[0]};
		// calculate ships' state for all the turns, used to animate later
		result.turns.forEach((turn) => {
			currentState = mapProperty(currentState, turn);
			result.timeline.push(currentState);
		});

		console.log(result);
		return result;
	}

	function render(data) {
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

		return htmlElement;
	}

	function initScene(inputs) {
		let doc = document.getElementById('scene');
		let track = document.createElement('a-curve');
		track.setAttribute('id', 'track');
		track.setAttribute('type', 'Line');
		doc.appendChild(track);

		let data = preprocess(inputs);
		let htmlElements = render(data);
		data['html'] = htmlElements

		let slide = document.getElementById('slider');
		slide.setAttribute('min', 0);
		slide.setAttribute('max', data.timeline.length);
		slide.value = 0;
		slide.addEventListener('mousedown', () => {
			EVENTS.SliderMouseDown = true;
		});
		slide.addEventListener('mouseup', () => {
			EVENTS.SliderMouseDown = false;
			EVENTS.SliderMouseUp = true;
			EVENTS.SliderValue = slider.value;
		});

		test = data;

		// begin simulation
		setTimeout(() => {
			simulate(data);
		}, 1000)
	}

	function simulate(data) {
		let slider = document.getElementById("slider");
		let current = data.timeline[data.present++];
		let isDone = false;
		if (data.present == data.timeline.length)
			isDone = true;
		
		// TODO: Use the OPTION's time between per action to animate slider increment
		if (!EVENTS.SliderMouseDown) {
			slider.value = data.present;
		}
		
		if (EVENTS.SliderMouseUp) {
			EVENTS.SliderMouseUp = false;
			data.present = EVENTS.SliderValue;
			battleship.update(data.html, current).then((done) => {
				simulate(data);
			});
			return;
		}

		else if (current && !isDone) {
			switch(current.task.type) {
				case "MOVE":
					battleship.moveShip(data.html, current, OPTION).then((done) => {
						simulate(data);
					}).catch((err) => {
						console.error('Error at movement simulation: ', err);
					});
					break;
				case "FIRE":
					battleship.fireShip(current, OPTION).then((done) => {
						//alert("Fired " + data.turns.length + " actions left");
						// console.log("Fire case 0: ", data.present.task.type);
						simulate(data);
						// });
					}).catch((err) => {
						console.error('Error at firing simulation: ', err);
					});
					break;
				case "SINK":
					battleship.sinkShip(data.html, current, OPTION).then((done) => {
						//alert("Sunk "+ data.turns.length + " actions left");
						simulate(data);
						// });
					}).catch((err) => {
						console.error('Error at sinking simulation: ', err);
					});
					break;
				case "HIT":
					battleship.hitShip(data.html, current).then((done) => {
						simulate(data);
					}).catch((err) => {
						console.log('Error at ship damage simulation: ', err);
					});
					break;
				case "END":
					// Disabled slider because resetting timeline is not working
					// slider.addEventListener('change', () => {
					// 	simulate(data);
					// 	slider.removeEventListener('change');
					// });
					setTimeout(() => {
						alert("Simulation Done, use slider to playback.");
					}, 5000);
					break;
				case "START":
					console.log('Reading start of simulation marker.');
					simulate(data);
					break;
				default:
					console.log(`Unknown Action Type ${current.type} in simulate function, skipping.`);
					// comment below during development to catch bugs, production code should continue along with simulation
					//simulate(data);;
			}
		} else {
			// Disabled slider because resetting timeline is not working
			// slider.addEventListener('change', () => {
			// 	simulate(data);
			// 	slider.removeEventListener('change');
			// });
			setTimeout(() => {
				alert("Simulation Done...");
			}, 10000);
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
					console.log("Firebase: ", res.val());
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



