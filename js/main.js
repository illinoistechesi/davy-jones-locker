!function e(t,n,a){function r(o,s){if(!n[o]){if(!t[o]){var c="function"==typeof require&&require;if(!s&&c)return c(o,!0);if(i)return i(o,!0);var u=new Error("Cannot find module '"+o+"'");throw u.code="MODULE_NOT_FOUND",u}var d=n[o]={exports:{}};t[o][0].call(d.exports,function(e){var n=t[o][1][e];return r(n||e)},d,d.exports,e,t,n,a)}return n[o].exports}for(var i="function"==typeof require&&require,o=0;o<a.length;o++)r(a[o]);return r}({1:[function(e,t,n){"use strict";var a={apiKey:"AIzaSyA9EYUXVL5WAh6Aam1qXlWyvi3b7HLcZ1U",authDomain:"esigamma.firebaseapp.com",databaseURL:"https://esigamma.firebaseio.com",projectId:"esigamma",storageBucket:"esigamma.appspot.com",messagingSenderId:"734163636039"},r=firebase.initializeApp(a,"Davy Jones' Locker").database(),i=function(){var e,t={CameraYOffset:8,OceanYOffset:0,OceanPadding:10,ShipYOffset:0,SinkDistance:5,BulletArc:2,WaitTimePerTileMoved:300,WaitTimeBetweenAction:100},n={},a=[],r=[],i={},o={init:function(){n={ships:input.init.ships,turns:input.turns,ocean:input.init.map},o.preprocess(n);var e=document.getElementById("scene"),t=document.createElement("a-curve");t.setAttribute("id","track"),t.setAttribute("type","Line"),e.appendChild(t),o.render(a),setTimeout(function(){o.simulate()},1e4)},preprocess:function(n){var i=function(e){var n=e;return n.hasOwnProperty("atX")&&n.hasOwnProperty("atY")&&(n.atX=4*e.atX,n.atZ=4*e.atY,n.atY=t.ShipYOffset),n.x=4*e.x,n.z=4*e.y,n.y=t.ShipYOffset,n},o=[],s=0;for(e={x:4*Math.floor(n.ocean.x/2)-2,y:t.OceanYOffset,z:4*Math.floor(n.ocean.y/2),width:200,depth:200,density:120},console.log(n),n.ships.forEach(function(e){a.push(i(e))});s<n.turns.length;){for(var c=!0;c&&s!==n.turns.length;)0===o.length?(o.push(i(n.turns[s])),s++):o[0].id===n.turns[s].id&&o[0].type===n.turns[s].type?"MOVE"===o[0].type?(o.push(i(n.turns[s])),s++):"FIRE"===o[0].type&&o[0].atX===4*n.turns[s].atX&&o[0].atY===4*n.turns[s].atY?(o.push(i(n.turns[s])),s++):"SINK"===o[0].type?(o.push(i(n.turns[s])),s++):c=!1:c=!1;r.push({type:o[0].type,actions:o}),o=[]}console.log(r)},render:function(n){var a=document.getElementById("scene"),r=document.getElementById("camera");r.setAttribute("position",e.x+" "+e.y+" "+(e.z+1.5*e.x)),r.setAttribute("camera","userHeight: "+t.CameraYOffset),r.setAttribute("rotation",-Math.atan(t.CameraYOffset/(e.z+e.x)));var o=document.createElement("a-ocean");o.setAttribute("position",e.x+" "+e.y+" "+e.z),o.setAttribute("width",String(e.width)),o.setAttribute("depth",String(e.depth)),o.setAttribute("density",String(e.density)),a.appendChild(o),n.forEach(function(e){var t=document.createElement("a-entity");t.dataset.id=e.id,t.dataset.name=e.name,t.dataset.owner=e.owner,t.dataset.x=e.x,t.dataset.y=e.y,t.dataset.z=e.z,t.dataset.health=e.hull,t.dataset.hull=e.hull,t.dataset.firepower=e.firepower,t.dataset.speed=e.speed,t.dataset.range=e.range;for(var n="",r=0;r<parseInt(e.hull);r++)n+=" •";t.setAttribute("position",e.x+" "+e.y+" "+e.z),t.setAttribute("template","src: #boat-template"),t.setAttribute("data-ship_color","color: "+e.color+"; metalness: 0.4;"),t.setAttribute("data-ship_name","value: "+e.name+"; font: #play;"),t.setAttribute("data-ship_health","value: "+n+";");var o=a.appendChild(t);i[e.id]=o})},sinkShip:function(e){return new Promise(function(n,a){var r=document.getElementById("scene"),o=document.getElementById("track"),s=i[e[0].id],c=document.createElement("a-draw-curve");c.setAttribute("curveref","#track"),c.setAttribute("material","shader: line; color: black;"),r.appendChild(c);var u=document.createElement("a-curve-point"),d=document.createElement("a-curve-point");u.setAttribute("position",e[0].x+" "+e[0].y+" "+e[0].z),d.setAttribute("position",e[0].x+" "+(e[0].y-t.SinkDistance)+" "+e[0].z),o.appendChild(u),o.appendChild(d),s.setAttribute("alongpath","curve: #track; rotate: true; constraint: 0 1 0; delay: "+t.WaitTimeBetweenAction+"; dur: 3000;"),s.addEventListener("movingended",function(e){for(s.removeAttribute("alongpath"),c.parentNode&&r.removeChild(c);o.hasChildNodes();)o.removeChild(o.childNodes[0]);s.parentNode&&r.removeChild(s),n(e)})})},fireShip:function(e){return new Promise(function(n,a){var r=document.getElementById("scene"),i=document.getElementById("track"),o=document.createElement("a-sphere"),s=document.createElement("a-curve-point"),c=document.createElement("a-curve-point"),u=document.createElement("a-curve-point");o.setAttribute("color","gray"),o.setAttribute("radius","0.1"),o.setAttribute("position",e[0].x+" "+e[0].y+" "+e[0].z),s.setAttribute("position",e[0].x+" "+e[0].y+" "+e[0].z),u.setAttribute("position",e[0].atX+" "+e[0].atY+" "+e[0].atZ),c.setAttribute("position",(e[0].atX+e[0].x)/2+" "+((e[0].atY+e[0].y)/2+t.BulletArc)+" "+(e[0].atZ+e[0].z)/2),i.appendChild(s),i.appendChild(c),i.appendChild(u);var d=document.createElement("a-draw-curve");d.setAttribute("curveref","#track"),d.setAttribute("material","shader: line; color: red;"),r.appendChild(d);var l=r.appendChild(o);l.setAttribute("alongpath","curve: #track; rotate: true; constant: 0 0 1; delay: 200; dur: 500"),l.addEventListener("movingended",function(e){for(l.removeAttribute("alongpath"),d.parentNode&&r.removeChild(d);i.hasChildNodes();)i.removeChild(i.childNodes[0]);l.parentNode&&r.removeChild(l),n(e)})})},aimShip:function(e){return new Promise(function(t,n){setTimeout(function(){var n=i[e[0].id];console.log("aim: ",n),t()},3e3)})},hitShip:function(e){return new Promise(function(t,n){for(var a=i[e[0].id],r="",o=0;o<e[0].health;o++)r+=" •";for(o=0;o<a.childNodes.length;o++)if("ship-health"==a.childNodes[o].className){a.childNodes[o].setAttribute("text-geometry","value: "+r+";");break}t()})},moveShip:function(e){return new Promise(function(n,a){var r=i[e[0].id],o=document.getElementById("scene"),s=document.getElementById("track"),c=document.createElement("a-draw-curve");c.setAttribute("curveref","#track"),c.setAttribute("material","shader: line; color: blue;"),o.appendChild(c);var u=document.createElement("a-curve-point");u.setAttribute("position",String(r.dataset.x+" "+r.dataset.y+" "+r.dataset.z)),s.appendChild(u);var d={x:r.dataset.x,z:r.dataset.z},l=0,p=0;console.log("Moving: ",e);for(var h=0;h<e.length;h++)(u=document.createElement("a-curve-point")).setAttribute("position",e[h].x+" "+e[h].y+" "+e[h].z),l+=Math.abs(e[h].x-d.x),p+=Math.abs(e[h].z-d.z),h+1<e.length&&e[h].x===e[h+1].x&&e[h].z===e[h+1].z&&h++,s.appendChild(u),d={x:e[h].x,z:e[h].z};var m=(l+p)*t.WaitTimePerTileMoved;r.setAttribute("alongpath","curve: #track; rotate: true; constraint: 0 0 1; delay: "+t.WaitTimeBetweenAction+"; dur: "+m+";"),r.addEventListener("movingended",function(t){for(c.parentNode&&o.removeChild(c);s.hasChildNodes();)s.removeChild(s.childNodes[0]);r.removeAttribute("alongpath"),r.dataset.x=e[e.length-1].x,r.dataset.z=e[e.length-1].z,r.dataset.y=e[e.length-1].y,n(t)})})},simulate:function(){console.log("chain: ",r);var e=!0;0==r.length&&(e=!1);var t=r.shift();if(t&&e)switch(console.log("current: ",t),t.type){case"MOVE":o.moveShip(t.actions).then(function(e){o.simulate()}).catch(function(e){console.error(e)});break;case"FIRE":o.fireShip(t.actions).then(function(e){o.simulate()}).catch(function(e){console.error("error: ",e)});break;case"HIT":o.hitShip(t.actions).then(function(e){o.simulate()}).catch(function(e){console.log(e)});break;case"SINK":o.sinkShip(t.actions).then(function(e){o.simulate()}).catch(function(e){console.error(e)});break;default:console.log("Unknown Action Type "+t.type+" in simulate function"),o.simulate()}else setTimeout(function(){vex.dialog.alert("Simulation Completed.")},1e4)},getStrCoord:function(t,n){return 4*(e.x-t.x)+" "+n+" "+4*(e.y-t.y)},getShips:function(){return a},getOcean:function(){return e}};return o}(),o=function(e){e=e.split("+").join(" ");for(var t,n={},a=/[?&]?([^=]+)=([^&]*)/g;t=a.exec(e);)n[decodeURIComponent(t[1])]=decodeURIComponent(t[2]);return n}(document.location.search),s=function(e){r.ref("davy-jones-locker/"+e).once("value",function(t){var n=t.val();n?(input=n,i.init()):c("No data for code "+e+". Enter another code:")}).catch(function(e){c("There was an error. Enter another code:")})},c=function e(t){vex.dialog.prompt({message:t,callback:function(t){t?s(t):e("No code entered. Enter your code:")}})};o.code?s(o.code):c("Enter Your Code")},{}]},{},[1]);
//# sourceMappingURL=maps/main.js.map
