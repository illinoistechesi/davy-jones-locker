// Initialize Firebase
var config = {
	apiKey: "AIzaSyA9EYUXVL5WAh6Aam1qXlWyvi3b7HLcZ1U",
	authDomain: "esigamma.firebaseapp.com",
	databaseURL: "https://esigamma.firebaseio.com",
	projectId: "esigamma",
	storageBucket: "esigamma.appspot.com",
	messagingSenderId: "734163636039"
};
var FirebaseInstance = firebase.initializeApp(config, "Davy Jones' Locker");

var db = FirebaseInstance.database();

let codeInput = document.getElementById('input-code');
let dataInput = document.getElementById('input-data');
let submitButton = document.getElementById('submit');

submitButton.addEventListener('click', (e) => {

	let code = codeInput.value;
	let dataStr = dataInput.value;

	if (code && dataStr) {

		let data = JSON.parse(dataStr);

		let dataRef = db.ref('davy-jones-locker/' + code);
		dataRef.once('value', (snapshot) => {
			if (!snapshot.exists()) {
				dataRef.set(data).then((done) => {
					window.alert("Data saved with code: " + code);
				}).catch((err) => {
					console.log(err);
				});
			} else {
				window.alert("Code already in use.");
			}
		}).catch((err) => {
			console.error(err);
		});

	}

});