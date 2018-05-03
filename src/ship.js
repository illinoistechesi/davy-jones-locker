
function Ship() {
	let action = {
		render: (data, OPTION) => {
			let attr = {
				"dom": null, // ships html dom component
				"health": null, // ship's health bar, display as dots
				"color": null, // ship color
				"name": null, // ship's display name
				"owner": null,
				"id": null,
				"x": null,
				"y": null,
				"z": null,
				"firepower": null,
				"hull": null,
				"speed": null,
				"range": null,
				"sunk": null
			}
			for (let keys in data) {
				attr[keys] = data[keys];
			}

			let doc = document.getElementById('scene');
			let ship = document.createElement('a-entity');

			ship.setAttribute('position', data.x + ' ' + data.y + ' ' + data.z);
			if (attr.color === 'rgb(255, 255, 0)') {
				ship.setAttribute('template', 'src: #submarine-template');
				ship.setAttribute('class', 'submarine');
			}
			else {
				ship.setAttribute('template', 'src: #boat-template');
				ship.setAttribute('class', 'boat');
			}

			let heart = '';
			for (let i = 0; i < attr.hull; i++) {
				heart += ' •';
			}
			attr.health = heart;

			// ${variable} <- variable name be lower case
			ship.setAttribute('data-ship_color', 'color: '+attr.color+'; metalness: 0.4;');
			ship.setAttribute('data-ship_name', 'value: '+attr.name+'; font: #play;');
			ship.setAttribute('data-ship_health', 'value: '+heart+';');

			attr.dom = doc.appendChild(ship);

			return attr;
		},

		sinkShip: (data, OPTION) => {
			console.log('sink: ', data);
			return new Promise((resolve, reject) => {
				let doc = document.getElementById('scene');
				let track = document.getElementById('track');
				let action = data.present.next.actions[0]; // sink action should only have a size of one
				let ship = data.html[action.id];
				
				let debug = document.createElement('a-draw-curve');
				debug.setAttribute('curveref', '#track');
				debug.setAttribute('material', 'shader: line; color: black;');
				doc.appendChild(debug);

				var point1 = document.createElement('a-curve-point');
				var point2 = document.createElement('a-curve-point');
				point1.setAttribute('position', action.x + ' ' + action.y + ' ' + action.z);
				point2.setAttribute('position', action.x + ' ' + (action.y - OPTION.SinkDistance) + ' ' + action.z);
				track.appendChild(point1);
				track.appendChild(point2);

				ship.dom.setAttribute('alongpath', 'curve: #track; rotate: true; constraint: 0 1 0; delay: ' + OPTION.WaitTimeBetweenAction + '; dur: 3000;');

				ship.dom.addEventListener('movingended', () => {
					ship.dom.removeAttribute('alongpath');
					if (debug.parentNode) {
						doc.removeChild(debug);
					}

					while(track.hasChildNodes()) {
						track.removeChild(track.childNodes[0]);
					}

					ship.dom.removeAttribute('alongpath');
					ship.dom.setAttribute('visible', false);
					// shipDom.childNodes.forEach((node) => {
					// 	console.log(node);
					// 	node.setAttribute('visible', false);
					// });

					resolve();
				});
			});
		},

		hitShip: (data) => {
			return new Promise((resolve, reject) => {
				let action = data.present.next.actions[0];
				let ship = data.html[action.id];
				let heart = '';

				for (let i = 0; i < data[0].health; i++) {
					heart += ' •';
				}

				for (let i = 0; i < ship.dom.childNodes.length; i++) {
					if (ship.dom.childNodes[i].className === 'ship-health') {
						ship.dom.childNodes[i].setAttribute('text-geometry', 'value: ' + heart + ';');
						break;
					}
				}

				resolve();
			});
		},

		fireShip: (data, OPTION) => {
			return new Promise((resolve, reject) => {
				let doc = document.getElementById('scene');
				let track = document.getElementById('track');

				let bullet = document.createElement('a-sphere');
				let source = document.createElement('a-curve-point');
				let arc = document.createElement('a-curve-point');
				let target = document.createElement('a-curve-point');
				bullet.setAttribute('color', 'gray');
				bullet.setAttribute('radius', '0.1');
				bullet.setAttribute('position', data[0].x + ' ' + data[0].y + ' ' + data[0].z);
				source.setAttribute('position', data[0].x + ' ' + data[0].y + ' ' + data[0].z);
				target.setAttribute('position', data[0].atX + ' ' + data[0].atY + ' ' + data[0].atZ);
				arc.setAttribute('position', (data[0].atX+data[0].x)/2 + " " + (((data[0].atY+data[0].y)/2)+OPTION.BulletArc) + " " + (data[0].atZ+data[0].z)/2);
				track.appendChild(source);
				track.appendChild(arc);
				track.appendChild(target);

				let debug = document.createElement('a-draw-curve');
				debug.setAttribute('curveref', '#track');
				debug.setAttribute('material', 'shader: line; color: red;');
				doc.appendChild(debug);

				let path = doc.appendChild(bullet);
				path.setAttribute('alongpath', 'curve: #track; rotate: true; constant: 0 0 1; delay: 200; dur: 500');

				path.addEventListener('movingended', () => {
					path.removeAttribute('alongpath');
					if (debug.parentNode) {
						doc.removeChild(debug);
					}

					while(track.hasChildNodes()) {
						track.removeChild(track.childNodes[0]);
					}

					if (path.parentNode) {
						doc.removeChild(path);
					}

					resolve();
				});
			});
		},

		moveShip: (model, data, OPTION) => {
			console.log("moveShip() ", model, data);
			return new Promise((resolve, reject) => {
				console.log(data, model);
				let doc = document.getElementById('scene');
				let track = document.getElementById('track');
				let ship = model[data[0].id];

				// add a path to show movement along the path
				let debug = document.createElement('a-draw-curve');
				debug.setAttribute('curveref', '#track');
				debug.setAttribute('material', 'shader: line; color: blue;');
				doc.appendChild(debug);

				// add current location as a starting point of the curve
				let point = document.createElement('a-curve-point');
				point.setAttribute('position', ship.x + ' ' + ship.y + ' ' + ship.z);
				track.appendChild(point);
				// add chain-able goal locations to the curve
				let previous = {'x': ship.x, 'z': ship.z};
				let xDistance = 0;
				let zDistance = 0;
				// console.log("current: ", model[data[0].id])
				// console.log("length: ", data);
				console.log('past the debug');
				for (let i = 0; i < data.length; i++) {
					point = document.createElement('a-curve-point');
					point.setAttribute('position', data[i].x + ' ' + data[i].y + ' ' + data[i].z);
					xDistance += Math.abs(data[i].x - previous.x);
					zDistance += Math.abs(data[i].z - previous.z);
					track.appendChild(point);
					previous = {'x': data[i].x, 'y': data[i].z};
					if (i + 1 < data.length && data[i].x === data[i+1].x && data[i].z === data[i+1].z) {
						i++;
					}
				}

				// define time for movement so that speed of difference distance is consistent
				let duration = (xDistance+zDistance)*OPTION.WaitTimePerTileMoved;
				ship.dom.setAttribute('alongpath', 'curve: #track; rotate: true; constraint: 0 0 1; delay: '+OPTION.WaitTimeBetweenAction+'; dur: '+duration+';');
				console.log('past the set attribute');

				ship.dom.addEventListener('movingended', () => {
					if (debug.parentNode) {
						doc.removeChild(debug);
					}

					while(track.hasChildNodes()) {
						track.removeChild(track.childNodes[0]);
					}
					console.log(data);
					ship.dom.removeAttribute('alongpath');
					ship.x = data[data.length-1].x;
					ship.y = data[data.length-1].y;
					ship.z = data[data.length-1].z;
					console.log('past the updater');
					resolve();
				});
			});
		}
	}

	return action;
}