angular.module("Stego", ["ui.router","webcam"])
    .config(function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state("login", {
                url: "/login",
                templateUrl: "views/login.html",
                controller: "StegoController"
            })
            .state("signup", {
                url: "/signUp",
                templateUrl: "views/signup1.html",
                controller: "StegoController"
            })
            .state("signup2", {
                url: "/signUp2",
                templateUrl: "views/signup2.html",
                controller: "StegoController",
                params: {
                	userdata: null
                }
            })
            .state("home", {
                url: "/home",
                templateUrl: "views/homepage.html",
                controller: "StegoController",
                params: {
                	signedIn: false
                }
            })
            .state("welcome", {
                url: "/welcome",
                templateUrl: "views/welcome.html",
                controller: "StegoController"
            });
            $urlRouterProvider.otherwise("/welcome");
    })
    .controller("StegoController", function($scope, $state, $stateParams, $http, $timeout){
        "use strict";
        $stateParams.counter =1;
        $scope.faceimgLogin = 0;
        $scope.availability= false;
        $scope.signedIn = false;
        $scope.show = false;
        $scope.regimg = [];

        if($state.current.name == 'home' && $stateParams.signedIn == false){
        	alert('Please sign in again');
        	$state.go('login');
        }
        $scope.decode = function () {
            var file = document.getElementById("image-input").files[0];
            if(file){
                var read = new FileReader();
                read.onloadend = function(e){
                    //get the url result
                    var result = read.result;
                    // put that url in an img element
                    var imageElement = document.createElement("img");
                    imageElement.setAttribute("src", result);

                    // put that image into a canvas
                    var canvas = document.createElement('canvas');
                    canvas.setAttribute("width", imageElement.naturalWidth);
                    canvas.setAttribute("height", imageElement.naturalHeight);
                    var context = canvas.getContext('2d');
                    context.drawImage(imageElement, 0, 0);
                    var rawData = context.getImageData(0, 0, canvas.width, canvas.height);
                    // getting a reference to the data to speed up references
                    var data = rawData.data;
                    var manipulator = new Manipulator(data.buffer, canvas.width, canvas.height);
                    var output = manipulator.decode();
                    rawData.data.set(manipulator.buf8);
                    context.putImageData(rawData, 0, 0);
                    document.getElementById("output-text").innerHTML = output;
                    $scope.loading = false;
                };
                $scope.loading = true;
                read.readAsDataURL(file);
            }
        };

        $scope.goHome = function() {
            $state.go('welcome');
        };

        $scope.goToLogin = function() {
            $state.go('login');
        };

        $scope.goToSignUp = function() {
            $state.go('signup');
        };
        $scope.goToSignUp2 = function(){
        	if($scope.user == null || $scope.user == undefined || $scope.user == '' || 
        		$scope.dob == null || $scope.dob == undefined || $scope.dob == '' || 
        		$scope.pass == null || $scope.pass == undefined || $scope.pass == '' || 
        		$scope.name == null || $scope.name == undefined || $scope.name == ''){
        		alert('Please fill all the details before proceeding forward.');
        		return;
        	}
        	$scope.checkUsername();
        	if($scope.availability == false){
        		alert('Please choose a different username');
        		return;
        	}
        	var modifiedDOB = $scope.dob.toISOString().substring(0, 10);
        	console.log($scope.name);
        	var userdata = $scope.user + '@@' + $scope.pass + '@@' + modifiedDOB + '@@' + $scope.name ; 
        	console.log(userdata);
			$state.go('signup2', { userdata: userdata});
		}
		var _video = null,
        patData = null;

		$scope.patOpts = {x: 0, y: 0, w: 25, h: 25};

		// Setup a channel to receive a video property
		// with a reference to the video element
		// See the HTML binding in main.html
		$scope.channel = {};

		$scope.webcamError = false;
		$scope.onError = function (err) {
			$scope.$apply(
				function() {
					$scope.webcamError = err;
				}
			);
		};

		$scope.onSuccess = function () {
			// The video element contains the captured camera data
			_video = $scope.channel.video;
			$scope.$apply(function() {
				$scope.patOpts.w = _video.width;
				$scope.patOpts.h = _video.height;
				//$scope.showDemos = true;
			});
		};

		$scope.onStream = function (stream) {

		};
		$scope.makeSnapshot = function() {
			if (_video) {
				var patCanvas = document.querySelector('#faceimg');
				if (!patCanvas) return;

				patCanvas.width = _video.width;
				patCanvas.height = _video.height;
				var ctxPat = patCanvas.getContext('2d');

				var idata = getVideoData($scope.patOpts.x, $scope.patOpts.y, $scope.patOpts.w, $scope.patOpts.h);
				ctxPat.putImageData(idata, 0, 0);
				patData = idata;
				var dataView = new DataView(idata.data.buffer);
				var manipulator = new Manipulator(idata.data.buffer, _video.width, _video.height);
				var username = document.getElementById("username").value;
				var password = document.getElementById("password").value;
				$scope.username = username;
				$scope.password = password;
				var encoded_text = username + '|' + password;
				manipulator.encode(encoded_text);
				idata.data.set(manipulator.buf8);
				ctxPat.putImageData(idata, 0, 0);
				$scope.imgdata = patCanvas.toDataURL().toString();
				document.getElementById("faceimg").setAttribute("src", patCanvas.toDataURL().toString());
			}
		};

		$scope.faceimgLoginInc = function(){
			$scope.faceimgLogin = 1;
		}

		$scope.checkUsername = function(){
			$scope.show = true;
			$scope.checkUsernameCall();
		}

		$scope.login = function() {
			var url = 'http://127.0.0.1:8081/FaceSteg/login';
			if($scope.faceimgLogin == 0){
				alert('Face image not given. Please click your image and try again.');
				return;
			}
			else if(document.getElementById("password") == "" || document.getElementById("username") == ""){
				alert('Credentials field cannot be left blank');
				return;	
			}
			$http({
            method: 'POST',
            url: url,
            headers: {'Content-Type': 'text/plain'},
            data: $scope.imgdata
	        })
	        .success(function (response) {
	            if(response == "valid"){
	            	alert("Successfully signed in");
	            	$state.go('home' , { signedIn : true});
	            }
	            else
	            	alert("Invalid credentials");
	        })
	        .error(function (response) {
	            console.log(response);
	        });
		}

		$scope.checkUsernameCall = function() {
			if($scope.user == "" || $scope.user == null || $scope.user == undefined ){
				alert('Please enter usename before checking');
				$scope.show = false;
				return;
			}
			var url = 'http://127.0.0.1:8081/FaceSteg/checkUsername';
			$http({
            method: 'POST',
            url: url,
            headers: {'Content-Type': 'text/plain'},
            data: $scope.user
	        })
	        .success(function (response) {
	            if(response == "yes"){
	            	$scope.availability = true;
	            	return true;
	            }
	            else{
	            	$scope.availability = false;
	            	return false;
	            }
	        })
	        .error(function (response) {
	            console.log(response);
	        });
		}

		$scope.logout = function() {
			$state.go('welcome');
		}

		$scope.signup = function() {

			if($scope.regimage0 == undefined || $scope.regimage1 == undefined || $scope.regimage2 == undefined || $scope.regimage3 == undefined){
				alert('Please click all the images!')
				//return;
			}
			$scope.encodeData();
			var data = $scope.regimage0 + '@@' + $scope.regimage1 + '@@' + $scope.regimage2 + '@@' + $scope.regimage3;
			var url = 'http://127.0.0.1:8081/FaceSteg/signup';
			$http({
            method: 'POST',
            url: url,
            headers: {'Content-Type': 'text/plain'},
            data: data
	        })
	        .success(function (response) {
	            alert('Successfully Registered. Please Login with your username and password now.')
	            $state.go('login');
	        })
	        .error(function (response) {
	            console.log(response);
	        });
		}

		$scope.encodeData = function() {
			var canvas = document.getElementById('snapshot1');
			var context = canvas.getContext('2d');
			var idata = context.getImageData(0, 0, canvas.width, canvas.height);
			var manipulator = new Manipulator(idata.data.buffer, _video.width, _video.height);
			if($stateParams.userdata == undefined || $stateParams.userdata == null || $stateParams.userdata == ''){
				alert('Please enter user data');
				$state.go('signup');
			}
			manipulator.encode($stateParams.userdata);
			idata.data.set(manipulator.buf8);
			context.putImageData(idata, 0, 0);
			$scope.regimage0 = canvas.toDataURL().toString();
			//document.getElementById("snapshot1").setAttribute("src", patCanvas.toDataURL().toString());
		}



		$scope.takeSnapshot = function() {
			var name = "#snapshot"+$stateParams.counter;
			var index = $stateParams.counter-1;
			$stateParams.counter++;
			if($stateParams.counter==5)
				$stateParams.counter=1;
			var patCanvas = document.querySelector(name);
			//if (!patCanvas) return;

			var patCanvas2 = document.getElementById("tempImage");
			var blank = document.createElement('canvas');
			blank.width = patCanvas2.width;
			blank.height = patCanvas2.height;

			if(patCanvas2.toDataURL() == blank.toDataURL()){
				alert('Please click image before selecting');
				$stateParams.counter = index+1;
				return;
			}

			//if (!patCanvas2) return;
			var ctxPat2 = patCanvas2.getContext('2d');
			var idata = ctxPat2.getImageData(0, 0, patCanvas2.width, patCanvas2.height);
			patCanvas.width = patCanvas2.width;
			patCanvas.height = patCanvas2.height;
			var ctxPat = patCanvas.getContext('2d');
			//var idata = getVideoData($scope.patOpts.x, $scope.patOpts.y, $scope.patOpts.w, $scope.patOpts.h);
			ctxPat.putImageData(idata, 0, 0);
			$scope.regimg[index] = patCanvas.toDataURL.toString();
			switch(index){
				case 0: $scope.regimage0 = patCanvas.toDataURL().toString();
						break;
				case 1: $scope.regimage1 = patCanvas.toDataURL().toString();
						break;
				case 2: $scope.regimage2 = patCanvas.toDataURL().toString();
						break;
				case 3: $scope.regimage3 = patCanvas.toDataURL().toString();
						break;
			}
			var img = ctxPat2.createImageData(patCanvas.width, patCanvas.height);
			for (var i = img.data.length; --i >= 0; )
			  img.data[i] = 0;
			ctxPat2.putImageData(img, 0, 0);
		};

		$scope.clearAll = function() {
			for(var j=1; j<=4; ++j) {
				var patCanvas = document.getElementById("snapshot" + j);
				var ctxPat = patCanvas.getContext('2d');
				var img = ctxPat.createImageData(patCanvas.width, patCanvas.height);
				for (var i = img.data.length; --i >= 0; )
				  img.data[i] = 0;
				ctxPat.putImageData(img, 0, 0);
			}
			$stateParams.counter = 1;
			$scope.regimage0 = undefined;
			$scope.regimage1 = undefined;
			$scope.regimage2 = undefined;
			$scope.regimage3 = undefined;
		};

		$scope.clickImage = function() {
			if (_video) {
				var patCanvas = document.querySelector("#tempImage");
				if (!patCanvas) return;

				patCanvas.width = _video.width;
				patCanvas.height = _video.height;
				var ctxPat = patCanvas.getContext('2d');

				var idata = getVideoData($scope.patOpts.x, $scope.patOpts.y, $scope.patOpts.w, $scope.patOpts.h);
				ctxPat.putImageData(idata, 0, 0);
			}
		};
		
		/**
		 * Redirect the browser to the URL given.
		 * Used to download the image by passing a dataURL string
		 */
		$scope.downloadSnapshot = function downloadSnapshot(dataURL) {
			window.location.href = dataURL;
		};
		
		var getVideoData = function getVideoData(x, y, w, h) {
			var hiddenCanvas = document.createElement('canvas');
			hiddenCanvas.width = _video.width;
			hiddenCanvas.height = _video.height;
			var ctx = hiddenCanvas.getContext('2d');
			ctx.drawImage(_video, 0, 0, _video.width, _video.height);
			return ctx.getImageData(x, y, w, h);
		};

		/**
		 * This function could be used to send the image data
		 * to a backend server that expects base64 encoded images.
		 *
		 * In this example, we simply store it in the scope for display.
		 */
		var sendSnapshotToServer = function sendSnapshotToServer(imgBase64) {
			$scope.snapshotData = imgBase64;
		};
    });
