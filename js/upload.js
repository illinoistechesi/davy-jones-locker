!function e(a,r,t){function o(i,s){if(!r[i]){if(!a[i]){var c="function"==typeof require&&require;if(!s&&c)return c(i,!0);if(n)return n(i,!0);var u=new Error("Cannot find module '"+i+"'");throw u.code="MODULE_NOT_FOUND",u}var f=r[i]={exports:{}};a[i][0].call(f.exports,function(e){var r=a[i][1][e];return o(r||e)},f,f.exports,e,a,r,t)}return r[i].exports}for(var n="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}({1:[function(e,a,r){"use strict";var t={apiKey:"AIzaSyA9EYUXVL5WAh6Aam1qXlWyvi3b7HLcZ1U",authDomain:"esigamma.firebaseapp.com",databaseURL:"https://esigamma.firebaseio.com",projectId:"esigamma",storageBucket:"esigamma.appspot.com",messagingSenderId:"734163636039"},o=firebase.initializeApp(t,"Davy Jones' Locker").database(),n=document.getElementById("input-data");n.addEventListener("keypress",function(e){if("13"==(e.keyCode||e.which)){var a=n.value;vex.dialog.prompt({message:"Choose a Code",callback:function(e){if(e&&a){var r=JSON.parse(a),t=o.ref("davy-jones-locker/"+e);t.once("value",function(a){a.exists()?vex.dialog.alert("Code already in use."):t.set(r).then(function(a){vex.dialog.alert("Data saved with code: "+e)}).catch(function(e){console.log(e)})}).catch(function(e){console.error(e)})}}})}})},{}]},{},[1]);
//# sourceMappingURL=maps/upload.js.map
