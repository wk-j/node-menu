var app = angular.module("MenuApp", ["ngRoute", "angularFileUpload", "ngTable"]);

app.config(function($routeProvider){

	$routeProvider.when("/", {
		templateUrl: "views/home.html",
		controller: "HomeController"
	});

	$routeProvider.when("/product", {
		templateUrl: "views/product.html",
		controller: "ProductController"
	});

	$routeProvider.when("/category", {
		templateUrl: "views/category.html",
		controller: "CategoryController"
	});

	$routeProvider.when("/image", {
		templateUrl : "views/image.html",
		controller: "ImageController"
	});

	$routeProvider.when("/video", {
		templateUrl : "views/video.html",
		controller: "VideoController"
	});

	$routeProvider.when("/user", {
		templateUrl : "views/user.html",
		controller: "UserController"
	});

	$routeProvider.when("/branch", {
		templateUrl : "views/branch.html",
		controller: "BranchController"
	});
	$routeProvider.otherwise({
		redirectTo: "/"
	});
});


//
// (123456789.12345).formatMoney(2, '.', ',');
Number.prototype.formatMoney = function(c, d, t){
	var n = this, 
	c = isNaN(c = Math.abs(c)) ? 2 : c, 
	d = d == undefined ? "." : d, 
	t = t == undefined ? "," : t, 
	s = n < 0 ? "-" : "", 
	i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
	j = (j = i.length) > 3 ? j % 3 : 0;
	return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};


// load all product's category
function initCategory($scope, CategoryService){
	var request = CategoryService.findAll();
	request.success(function(data){
		$scope.categories = data;
		$scope.categories.forEach(function(d){ d.$active = false; });
		var so = $scope.categories.sort(function(a,b) { return a.identifier - b.identifier } );
	});

	request.error(function(error){
		$scope.$emit("message", { error: true, message: error });
		console.log(error);
	});	
}

// append image object into $images property.
function appendImageUrl(product, ProductService){	
	product.$images = product.$images || [];
	product.imageIds.forEach(function(i){
		var url = ProductService.getImageUrl(i);
		var request = ProductService.getImageInfo(i);

		request.success(function(rs){
			var img = rs;
			img.$url = url;

			// console.log("==init image==");
			// console.log(img);

			product.$images.push(img);
		});

		request.error(function(err){
			$scope.$emit("message", { error: true, message: error });
			console.log("==init image failed==");
			console.log(err);
		});
		
	});
}

function reloadTable($scope, data, ngTableParams){
	
	var config1 = { page: 1,  count: 50};
	var config2 = {
		total: data.length, 
		getData: function($defer, params) {
			$defer.resolve(data.slice((params.page() - 1) * params.count(), params.page() * params.count()));
		}
	};

	 $scope.tableParams = new ngTableParams( config1 , config2);	
}

function initProduct($scope, ProductService, ngTableParams){

	var request = ProductService.findAll();

	request.success(function(data){
		$scope.products = data;
		$scope.products.forEach(function(d){ 		
			appendImageUrl(d, ProductService);
		});

		var so = $scope.products.sort(function(a,b) { return a.identifier - b.identifier } );

		// console.log("== all products ==");
		// console.log($scope.products);

		if(ngTableParams != null){
			console.log("==reload table==");
			reloadTable($scope, data, ngTableParams);
		}
	});

	request.error(function(error){
		console.log(error);
	});	
}





app.factory("CategoryService", function(ConfigurationService, $http){

	var baseUrl = ConfigurationService.endPoint + "/category";

	return {
		findAll : function() { 
			var request = $http.get(baseUrl);
			return request;
		},

		add : function(cat){
			var request = $http({
				url : baseUrl,
				method : "POST",
				data : JSON.stringify(cat),
				headers: { "Content-Type" : "multipart/form-data" }
			});
			return request;
		},

		findByExample : function(cat){
			var request = $http({
				url : baseUrl + "/query",
				method : "POST",
				data : JSON.stringify(cat),
				headers: { "Content-Type" : "multipart/form-data" }
			});
		}
	}
});
app.factory("ConfigurationService", function(){
	return {
		endPoint : "http://10.0.0.67:8877"
	}
});

app.factory("NavigateService", function($location) {
	return function($xscope) {
		$xscope.$emit("navigate", $location.path() );
	};
});
app.factory("ProductService", function(ConfigurationService, $http){

	var baseUrl = ConfigurationService.endPoint + "/product";
	var uploadImageUrl = ConfigurationService.endPoint + "/image/upload";

	return {
		getBaseUrl : function() { return baseUrl; },
		getUploadImageUrl : function() { return uploadImageUrl; },
		getImageUrl : function(id) {
			return ConfigurationService.endPoint + "/image/url/" + id;
		},

		getImageInfo: function(id){
			var url = ConfigurationService.endPoint + "/image/" + id;
			var request = $http.get(url);
			return request;
		},

		addImage : function(image){
			var request = $http({
				url : ConfigurationService.endPoint + "/image",
				method : "POST",
				data : JSON.stringify(image),
				headers : { "Content-Type" : "multipart/form-data" }
			});
			return request;
		},

		add : function(product){
			var request = $http({
				url : baseUrl,
				method : "POST",
				data : JSON.stringify(product),
				headers: { "Content-Type" : "multipart/form-data" }
			});
			return request;
		},

		findAll : function() {
			var request = $http({
				url: baseUrl,
				method: "GET",
				data: {}
			});

			return request;
		}
	}
});
app.controller("BranchController", function($scope, NavigateService){
	$scope.category = true;
	NavigateService($scope);
});
app.controller("CategoryController", function($scope, NavigateService, CategoryService){

	////////////////////////////////////////////////
	// INITIALIZE VARIABLE
	////////////////////////////////////////////////
	NavigateService($scope);

	$scope.categories = [];
	$scope.currentCategory = {
		parentId : null
	};

	//////////////////////////////////////////////////
	// GET ALL CATEGORY VIA WEB SERVICE
	///////////////////////////////////////////////////
	var request = CategoryService.findAll();

	request.success(function(data){
		$scope.categories = data;
		$scope.categories.forEach(function(d){ d.$active = false; });
		var so = $scope.categories.sort(function(a,b) { return a.identifier - b.identifier } );
		console.log(so);

		console.log(data);
	});

	request.error(function(error){
		console.log(error);
	});

	////////////////////////////////////////////////////////
	// UPDATE DATA
	////////////////////////////////////////////////////////
	$scope.save = function(cat){
		var request = CategoryService.add(cat);
		request.success(function(data){
			var message = {
				message : new Date() + " -- Update success: " + data.data.title,
				error : false
			}
			if(typeof($scope.currentCategory.identifier) === 'undefined') {
				console.log(data.data);
				$scope.categories.push(data.data);				
			}

			$scope.$emit("message", message);
			$scope.currentCategory = { parentId : null };
		});

		request.error(function(err){
			var msg = {
				message :  err,
				error : true
			}
			$scope.$emit("message", msg);
		});
	}

	//////////////////////////////////////////////////////////
	// UPDATE UI
	///////////////////////////////////////////////////////////
	$scope.setEditCategory = function(cat){
		cat.$active = !cat.$active;
		$scope.currentCategory = cat;
	};

	$scope.setParent = function(parent){
		console.log("current: " + $scope.currentCategory.parentId);
		console.log("click: " + parent.identifier);

		if($scope.currentCategory.parentId == parent.identifier) {
			$scope.currentCategory.parentId = null;
		}else {
			console.log("update...");
			$scope.currentCategory.parentId = parent.identifier;
		}
	};

	$scope.cancel = function(){
		$scope.currentCategory = { parentId: null };
	}
});
app.controller("HomeController", function($scope, NavigateService, CategoryService, ProductService){
	NavigateService($scope);

	initCategory($scope, CategoryService);
	initProduct($scope, ProductService);

	$scope.currentProduct = {};
	$scope.productFilter = "";

	$scope.complexProductFilter = function(p){
		var selectedCategories = 0;
		$scope.categories.forEach(function(cat){
			if(cat.$selected){
				selectedCategories ++;
			}
		});

		var catFilter = false;
		if(selectedCategories == 0) {
			catFilter = true;
		} else {
			$scope.categories.forEach(function(cat){
				if(cat.$selected){
					if(p.categoryIds.indexOf(cat.identifier) != -1) {
						catFilter = true;
						return;
					}
				}
			});
		}

		var product = true;

		try {
			var filter = $scope.productFilter.toUpperCase();
			var name = p.name.toUpperCase();
			var desc = p.description.toUpperCase();
			product =  name.indexOf(filter) != -1 || desc.indexOf(filter) != -1;

		}catch(err){
			console.log(p.name);
			console.log(p.description);
			product = false;
		}

		return catFilter && product;
	};

	$scope.selectCategory = function(cat){
		if(typeof(cat.$selected) == 'undefined') {
			cat.$selected = true;
		}else {
			cat.$selected = !cat.$selected;
		}

		console.log("==select category==");
		console.log(cat.title);
		console.log(cat.$selected);
	}


	////////////////////////////////////////////
	// CALCULATE CATEGORY INFO
	/////////////////////////////////////////////
	$scope.refreshCatetoryInfo = function(cat){
		cat.$products = [];

		$scope.products.forEach(function(p){
			
			if(p.categoryIds.indexOf(cat.identifier) != -1){
				cat.$products.push(p);
			}
		});
	};

	$scope.refreshAllCategoryInfo = function(){
		if(!$scope.categories) { return; }
		if(!$scope.products) { return;}

		console.log("==refresh category info==");
		$scope.categories.forEach(function(cat){
			$scope.refreshCatetoryInfo(cat);
		});
	};

	$scope.init = function() {
		var thumb = $('.ko-thumbnail');
		thumb.popup({
			on: 'hover'
		});

		$scope.refreshAllCategoryInfo();
	}

	$scope.selectProduct = function(p){
		$scope.currentProduct = p;
	};
});
app.controller("ImageController", function($scope, NavigateService){
	NavigateService($scope);
});
app.controller("NavigateController", function($scope){
	$scope.location = "/";

	$scope.$on("navigate", function(event, url){
		$scope.location = url;
		console.log("url:" + url);
	});

	$scope.$on("message", function(event, data){
		$scope.error = data.error;
		$scope.message = data.message;
		$scope.show = true;

		setTimeout(function(){
			$scope.show = false;
			$scope.$apply('show');
			console.log("==hide message==");
		}, 5000);
	});

	$scope.hide = function(){
		$scope.show = false;
	}
});



app.controller("ProductController", function($scope, $location, CategoryService, ProductService, $upload, ngTableParams){

	// active menu
	$scope.$emit("navigate", $location.path() );	

	// current selected tab	
	$scope.selectedTab = "product";

	// // all pictures
	// $scope.pictures = [];

	// all products
	$scope.products = [];

	// all categories;
	$scope.categories = [];

	// current selected picture
	$scope.currentPicture = {};

	// current selected product
	$scope.currentProduct = { primaryPrice: null, memberPrice: null, $images :[], $imageIds :[] };

	// inline editing
	$scope.inlineEditing = false;

	// show archive or not;
	$scope.showArchive = false;


	///////////////////////////////////////////////
	// Init
	//////////////////////////////////////////////
	initCategory($scope, CategoryService);
	initProduct($scope, ProductService, ngTableParams);


	//////////////////////////////
	// FILTER
	/////////////////////////////////

	$scope.getActiveProducts = function(){
		var actives = [];
		$scope.products.forEach(function(p){
			if(!p.archive) {
				actives.push(p);
			}
		});
		return actives;
	};


	$scope.showArchiveChange = function() {
		$scope.showArchive = !$scope.showArchive;

		console.log("showArchive: " + $scope.showArchive);
	}

	function getNumberOfSelectedCategory(){
		var count = 0;
		$scope.categories.forEach(function(cat){
			if(cat.$selectedFilter){
				count++;
			}
		});
		return count;
	}

	$scope.productComplexFilter = function(p){

		if($scope.selectedTab != "allProducts") {
			return;
		}

		// match selected categoryies?

		var matchCategory = false;
		if(getNumberOfSelectedCategory() == 0){
			matchCategory = true;
		}else {
			$scope.categories.forEach(function(cat){
				if(cat.$selectedFilter){
					if(p.categoryIds.indexOf(cat.identifier) != -1){
						matchCategory = true;
						return;
					}
				}
			});
		}

		// match product name or description?
		var matchSearch = true;
		if($scope.productFilter){
			var filter = $scope.productFilter.toUpperCase();
			try { 
				var name = p.name.toUpperCase();
				var desc = p.description.toUpperCase();
				matchSearch = name.indexOf(filter) != -1 || desc.indexOf(filter) != -1;
			}catch (err){
				matchSearch = false;
			}
		}

		// match archive status or not?
		var matchArchive = p.archive && $scope.showArchive || !p.archive && !$scope.showArchive

		// console.log("matchCategory: " + matchCategory);
		// console.log("productFilter: " + productFilter);
		// console.log("matchArchive: " + matchArchive);
		// console.log("showArchive: " + $scope.showArchive);

		var match = matchCategory && matchSearch && matchArchive;
		console.log(">> match: " + match);

		return match;
	};


	////////////////////////////////////////////
	// CALCULATE CATEGORY INFO
	/////////////////////////////////////////////
	$scope.refreshCatetoryInfo = function(cat){
		cat.$products = [];

		$scope.products.forEach(function(p){
			
			if(p.categoryIds.indexOf(cat.identifier) != -1){
				cat.$products.push(p);
			}
			console.log("==category info==");
			console.log(p.categoryIds);
			console.log(p.identifier);
		});
	};

	$scope.refreshAllCategoryInfo = function(){
		console.log("==refresh category info==");
		$scope.categories.forEach(function(cat){
			$scope.refreshCatetoryInfo(cat);
		});
	};

	/////////////////////////////////////////////////////
	// UI
	/////////////////////////////////////////////////////
	$scope.showImageModal = function(){
		$('.ko-image').modal('show');
		// $('.ko-image').modal('hide');
	};

	$scope.hideImageModal = function(){
		// $('.ko-image').modal('hide all');

	};

	$scope.setInlineEditing = function(edit){
		$scope.inlineEditing = edit;
		console.log("==inline editing==");
		console.log("inline: " + $scope.inlineEditing);
	}


	$scope.saveImage = function(pic){
		var request = ProductService.addImage(pic);
		request.success(function(data){
			$scope.$emit("message", { error: false, message: "Update Success." });
			// $scope.currentPicture = {};
		});

		request.error(function(error){
			$scope.$emit("message", { error: true, message : error} );
		});
	};

	$scope.saveAllImage = function(){
		$scope.currentProduct.$images.forEach(function(img){
			$scope.saveImage(img);
		});
	}


	$scope.openPicture = function(p){
		$scope.currentPicture = p;
	};

	$scope.loadInclude = function(){
		console.log("loading...");
	};

	$scope.getSelectedCategories = function(){
		var cats = []
		$scope.categories.forEach(function(cat){
			if(cat.$selected) {
				cats.push(cat);
			}
		});

		return cats;
	};

	$scope.valid = function(){
		var r = $scope.currentProduct;
		var p = r.primaryPrice && r.promotionPrice && r.memberPrice;
		var cats = $scope.getSelectedCategories();
		var valid = r.name && r.description && r.productId && cats.length != 0 && p;

		// console.log("validate: " + valid);
		return valid;
	};

	/////////////////////////////////////////////////////
	// CATEGORY
	/////////////////////////////////////////////////////
	$scope.selectCategory = function(cat){

		if(typeof(cat.$selected) == 'undefined') {
			cat.$selected = true;
		}else {
			cat.$selected = !cat.$selected;
		}
	}

	$scope.selectProductCategory = function(cat){
		if(typeof(cat.$selectedFilter) == 'undefined'){
			cat.$selectedFilter = true;
		}else {
			cat.$selectedFilter = !cat.$selectedFilter;
		}


	}

	////////////////////////////////////////////////////
	// UPDATE
	///////////////////////////////////////////////////
	$scope.save = function(product){
		console.log("save...");
		product.imageIds = [];
		product.categoryIds = [];

		product.$images.forEach(function(pic){
			product.imageIds.push(pic.identifier);
		});

		$scope.getSelectedCategories().forEach(function(cat){
			product.categoryIds.push(cat.identifier);
		});

		var request = ProductService.add(product);
		request.success(function(rs){
			// append url
			var p = rs.data;
			appendImageUrl(p, ProductService);

			$scope.products.push(p);
			$scope.currentProduct = {};
			$scope.currentProduct.$images = [];

			// reload table
			console.log("==reload table==");
			//reloadTable($scope, $scope.products, ngTableParams);

			$scope.tableParams.reload();

			$scope.$emit("message", { error : false, message : "Save complete"});
		});

		request.error(function(err){
			console.log(err);
		});
	}

	$scope.inlineUpdate = function(product){
		var request = ProductService.add(product);
		request.success(function(rs){
			var p = rs.data;
			$scope.$emit("message", { error : false, message : "Save complete"});

			$scope.setInlineEditing(false);
		});

		request.error(function(err){
			console.log(err);
		});
	};


	$scope.selectProduct = function(product){
		console.log("==select product==");
		console.log(product);

		var ubutton = $("#uploadFileButton");
		console.log(ubutton.click());

		$scope.currentProduct = product;
		$scope.currentProduct.$images.forEach(function(x){
			$scope.currentPicture = x;
		});

		$scope.categories.forEach(function(cat){
			var match = product.categoryIds.indexOf(cat.identifier);
			if(match != -1){
				cat.$selected = true;
			}else {
				cat.$selected = false;
			}
		});

		var thumb = $('.ko-thumbnail');
		thumb.popup({
			on: 'hover'
		});
	}

	/////////////////////////////////////////////////
	// TEST
	/////////////////////////////////////////////////
	$scope.setActiveTab = function(tab){
		$scope.selectedTab = tab;
		console.log("selectedTab:" + $scope.selectedTab);

		if(!$scope.$$phases) {
			// $scope.$digest("selectedTab");
		}

		$scope.refreshAllCategoryInfo();
	};

	///////////////////////////////////////////////
	// UPLOAD
	///////////////////////////////////////////////
	$scope.onFileSelect = function($files){
		for(var i = 0; i< $files.length; i++){
			var file = $files[i]

			console.log("Upload: " + ProductService.getUploadImageUrl());
			console.log("File:");
			console.log(file);

			var upload = $upload.upload({
				url: ProductService.getUploadImageUrl(),
				method: "POST",
				data : { data : {}}, 
				headers : { "Content-Type" : "multipart/form-data" },
				file: file
			});

			upload.progress(function(evt){
				console.log("percent: " + parseInt(100.0 * evt.loaded / evt.total));
			});

			upload.success(function(rs, status, headers, config){
				console.log(rs);

				var pic = rs.data;
				pic.$url = ProductService.getImageUrl(pic.identifier);

				$scope.currentProduct.$images = $scope.currentProduct.$images || [];
				$scope.currentProduct.$images.push(pic);
				$scope.currentPicture = pic;
			});

			upload.error(function(err){
				console.log(err);
			});
		}
	};
});
app.controller("UserController", function($scope, NavigateService){
	NavigateService($scope);
});
app.controller("VideoController", function($scope, NavigateService){
	NavigateService($scope);
});
