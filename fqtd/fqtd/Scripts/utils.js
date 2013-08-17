/*Global variables and functions*/

var FQTD = (function () {
    var myplace, directionsDisplay, map;
    var locations = new Array();
    var limit = 0;

    function isEmpty(str) {
        if ((!str || 0 === str.length) == true) {
            return '';
        }
        else {
            return str;
        }
    }

    function checkImage(str) {
        if ((!str || 0 === str.length) == true) {
            return '../images/no-image.jpg';
        }
        else {
            return str;
        }
    }

    function rad(x) { return x * Math.PI / 180; }

    function return_Distance(latLng1, latLng2) {
        var R = 6371; // km
        var dLat = rad(latLng2.lat() - latLng1.lat());
        var dLon = rad(latLng2.lng() - latLng1.lng());
        var lat1 = rad(latLng1.lat());
        var lat2 = rad(latLng2.lat());

        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d * 1000;
    }

    return {
        BindPropertyData: function () {
            //Bind data to checkbox
            var urlProperty = "/result/PropertyByCategoryID";
            $.getJSON(urlProperty + "?id=-1", null, function (properties) {
                for (i in properties) {
                    $("#property").append('<input tabindex="' + i + '" type="checkbox" id="' + properties[i].PropertyID + '"><label for="' + properties[i].PropertyID + '">' + properties[i].PropertyName + '</label><br />');
                    $('#' + properties[i].PropertyID).iCheck({
                        checkboxClass: 'icheckbox_square',
                        increaseArea: '20%' // optional
                    });
                }
            });
        },
        markOutLocation: function (lat, long, map, contentPopup, isHome) {
            var place = new google.maps.LatLng(lat, long);
            var marker = new google.maps.Marker({
                position: place,
                title: 'Click to zoom',
                icon: (isHome === true ? '/images/home.png' : '/images/MarkerIcon/Brand/schools_maps.png')
            });
            var infobox = new InfoBox({
                content: contentPopup,
                disableAutoPan: true,
                maxWidth: 0,
                pixelOffset: new google.maps.Size(-140, 0),
                zIndex: null,
                closeBoxMargin: "12px 4px 2px 2px",
                closeBoxURL: "/images/close.gif",
                infoBoxClearance: new google.maps.Size(1, 1)
            });
            google.maps.event.addListener(marker, 'click', function () {
                infobox.open(map, marker);
            });
            marker.setMap(map);
        },
        calcRoute: function (latitude, longitude, type, form) {
            var directionsService = new google.maps.DirectionsService();
            var start;
            var options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            };

            if (form == "1") {
                start = myplace;
                FQTD.directionWay(start, latitude, longitude, type, directionsService);
            }
            else {
                if (navigator.geolocation) {
                    // Get current position
                    navigator.geolocation.getCurrentPosition(function (position, status) {
                        start = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                        FQTD.directionWay(start, latitude, longitude, type, directionsService);
                    }, function (err) {
                        console.warn('ERROR(' + err.code + '): ' + err.message);
                    }, options);
                }
                else {
                    alert("Xin vui lòng bật chức năng định vị, như vậy chúng tôi có thể tìm những địa điểm gần bạn nhất.");
                }
            }
        },
        directionWay: function (start, latitude, longitude, type, directionsService) {
            var end = new google.maps.LatLng(latitude, longitude);
            var travelMode;

            switch (type) {
                case 'car':
                    travelMode = google.maps.DirectionsTravelMode.DRIVING;
                    break;
                case 'bike':
                    travelMode = google.maps.DirectionsTravelMode.BICYCLING;
                    break;
                case 'walk':
                    travelMode = google.maps.DirectionsTravelMode.WALKING;
                    break;
                case 'bus':
                    travelMode = google.maps.DirectionsTravelMode.TRANSIT;
                    break;
            };
            if (start != null && end != null) {
                var request = {
                    origin: start,
                    destination: end,
                    travelMode: travelMode
                };
                directionsService.route(request, function (response, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        directionsDisplay.setDirections(response);
                    }
                });
            }
        },
        hidePanel: function () {
            $("#hrfClose").bind('click', function () {
                var options = {};
                $("#hrfClose").hide("fade", options, 500);
                $("#tbtable").toggle("slide", options, 500, function () {
                    var options = {};
                    $("#hrfOpen").removeClass("hidden");
                    $("#hrfOpen").show("fade", options, 500);
                });
            })
        },
        showPanel: function () {
            $("#hrfOpen").bind('click', function () {
                var options = {};
                $("#hrfOpen").addClass("hidden");
                $("#tbtable").toggle("slide", options, 500, function () {
                    var options = {};
                    $("#hrfClose").show("fade", options, 500);
                });
            })
        },
        displayList: function () {

            $("#list").removeClass("hidden");
            $("#map").addClass("hidden");

            $("#tabList").removeClass("inactive").addClass("active");
            $("#tabMap").removeClass("active").addClass("inactive");

        },
        displayMap: function () {

            $("#map").removeClass("hidden");
            $("#list").addClass("hidden");

            $("#tabMap").removeClass("inactive").addClass("active");
            $("#tabList").removeClass("active").addClass("inactive");

        },
        noRecord: function () {
            $("#list").html("<p style='text-align:center'>No record found.</p>");
            $("#map").html("<p style='text-align:center'>No record found.</p>");
            FQTD.displayMap();
        },
        pageselectCallback: function (page_index, jq) {
            // Get number of elements per pagionation page from form
            var items_per_page = 5
            var max_elem = Math.min((page_index + 1) * items_per_page, locations.length);
            var newcontent = '';

            // Iterate through a selection of the content and build an HTML string
            for (var i = page_index * items_per_page; i < max_elem; i++) {
                newcontent += '<div id="object"><table style="width: 100%;"><tr><td valign="top" style="width:116px;"><img id="photo" width="150" height="150" src="' + isEmpty(checkImage(locations[i][6])) + '" /></td><td valign="top"><h2>' + isEmpty(locations[i][3]) + '</h2>'
                    + '<p>' + isEmpty(locations[i][4]) + '<br/>' + isEmpty(locations[i][5]) + '</p><p><a href="#" class="lienket"><strong>Xem chi tiết</strong></a>'
                    + '| <a href="#" class="lienket"><strong>Đường đi</strong></a></p></td></tr></table></div>';
            }
            
            // Replace old content with new content
            $('#subList').html(newcontent);

            // Prevent click eventpropagation
            return false;
        },
        Pagination: function () {
            var opt = {
                callback: FQTD.pageselectCallback,
                items_per_page: 5,
                num_display_entries: 5,
                num_edge_entries: 2,
                prev_text: "Trước",
                next_text: "Sau"
            };
            $("#pagination").pagination(locations.length, opt);
        },
        GetJSON: function () {
            //Get data result
            var urlResult = "/Result/search?";
            urlResult += "mode=" + $("#form").val();
            urlResult += "&keyword=" + $("#search").val();
            urlResult += "&currentLocation=" + $("#address").val();
            urlResult += "&categoryid=" + $("#category").val();
            urlResult += "&brandid=" + $("#brand").val();
            urlResult += "&radious=" + $("#range").val();
            urlResult += "&vn0_en1=0";
            
            var result = $.getJSON(urlResult, null, function (items) {
                for (var i = 0; i < items.length; i++) {
                    if (items[i].Latitude != null && items[i].Longitude != null) {
                        var contentmarker = '<div class="marker"><h2>' + isEmpty(items[i].ItemName) + '</h2><p>' + isEmpty(items[i].FullAddress) + '<br/>' + isEmpty(items[i].Phone) + '</p></div>'
                                     + '<ul id="directionIcon">'
                                     + '<li id="car" onclick=\"FQTD.calcRoute(' + items[i].Latitude + ',' + items[i].Longitude + ',\'car\',' + $("#form").val() + ')\"></li>'
                                     + '<li id="bus" onclick=\"FQTD.calcRoute(' + items[i].Latitude + ',' + items[i].Longitude + ',\'bus\',' + $("#form").val() + ')\"></li>'
                                     + '<li id="walk" onclick=\"FQTD.calcRoute(' + items[i].Latitude + ',' + items[i].Longitude + ',\'walk\',' + $("#form").val() + ')\"></li></ul><div id="space"></div>';
                        locations.push([items[i].Latitude, items[i].Longitude, contentmarker, isEmpty(items[i].ItemName), isEmpty(items[i].FullAddress), isEmpty(items[i].Phone), isEmpty(items[i].Logo), isEmpty(items[i].ItemID)]);
                    }
                }
            });
            console.log(urlResult);
            result.complete(function () { FQTD.BindData() });
        },
        BindData: function () {
            var range = $("#range").val();
            if (locations.length > 0) {
                if ($("#form").val() == "1") {
                    var address = $("#address").val();
                    var geocoder = new google.maps.Geocoder();
                    if (geocoder) {
                        geocoder.geocode({ 'address': address }, function (results, status, content) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                //set LatLng current place
                                myplace = results[0].geometry.location;

                                //set map
                                var mapProp = {
                                    center: myplace,
                                    disableDefaultUI: true,
                                    mapTypeId: google.maps.MapTypeId.ROADMAP
                                };
                                map = new google.maps.Map(document.getElementById("googleMap"), mapProp);

                                //set my city
                                var myCity = new google.maps.Circle({
                                    center: myplace,
                                    radius: parseInt(range),
                                    strokeWeight: 0,
                                    fillColor: "#0000FF",
                                    fillOpacity: 0.1
                                });
                                myCity.setMap(map);

                                //set direction
                                directionsDisplay = new google.maps.DirectionsRenderer();
                                directionsDisplay.setMap(map);

                                map.fitBounds(myCity.getBounds());
                                FQTD.markOutLocation(myplace.lat(), myplace.lng(), map, "<p class='currentplace'>Bạn đang ở đây.</p>", true);

                                for (i = 0; i < locations.length; i++) {
                                    var compareDistance = return_Distance(myplace, new google.maps.LatLng(locations[i][0], locations[i][1]));
                                    if (range >= compareDistance) {
                                        FQTD.markOutLocation(locations[i][0], locations[i][1], map, locations[i][2], false);
                                    }
                                }

                            } else {
                                alert("Geocode không hoạt động vì lí do sau : " + status);
                            }
                        });
                    }
                    //set map display first
                    FQTD.displayMap()
                }
                else {
                    if (navigator.geolocation) {
                        // Get current position
                        navigator.geolocation.getCurrentPosition(function (position, status) {
                            var geocoder = new google.maps.Geocoder();
                            myplace = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                            FQTD.SetupMap(myplace, locations, 12);
                        });
                    }
                    else {
                        alert("Xin vui lòng bật chức năng định vị, như vậy chúng tôi có thể tìm những địa điểm gần bạn nhất.");
                        //set default location is Hue (middle of Vietnam)
                        myplace = new google.maps.LatLng(16.46346, 107.58470);
                        FQTD.SetupMap(myplace, locations, 6);
                    };
                    //set list display first
                    FQTD.displayList()
                }
                FQTD.Pagination();
            }
            else {
                FQTD.noRecord()
            }
        },
        SetupMap: function (myplace, listMarker, zoom) {
            //set map
            var mapProp = {
                center: myplace,
                zoom: zoom,
                disableDefaultUI: true,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            map = new google.maps.Map(document.getElementById("googleMap"), mapProp);

            //set direction
            directionsDisplay = new google.maps.DirectionsRenderer();
            directionsDisplay.setMap(map);

            for (i = 0; i <= 4; i++) {
                FQTD.markOutLocation(listMarker[i][0], listMarker[i][1], map, listMarker[i][2], false);
                limit++;
            }
        },
        BindSelectCategory: function () {
            //Bind data to select box Category
            var urlCategory = "/admin/categories/Categories";
            $.getJSON(urlCategory + "?vn0_en1=0", null, function (categories) {
                for (i in categories) {
                    $("#category").append('<option value="' + categories[i].CategoryID + '">' + categories[i].CategoryName + '</option>');;
                }
            });
        },
        BindSelectBrand: function () {
            //Bind data to select box Brand
            var urlBrand = "/admin/brand/BrandsByCategory";
            $.getJSON(urlBrand + "?id=-1", null, function (brands) {
                for (i in brands) {
                    $("#brand").append('<option value="' + brands[i].BrandID + '">' + brands[i].BrandName + '</option>');;
                }
            });
        },
        SetupWatermarkValidation: function () {
            //watermark and validation
            $("#address").watermark("Nhập địa chỉ hiện tại của bạn");
            $("#search").watermark("Nhập tên hoặc địa chỉ quán bạn muốn tìm");
            $("#range").watermark("Bán kính");
            $("#form1").validate({
                onChange: true,
                eachValidField: function () {

                    $(this).closest('div').removeClass('error').addClass('success');
                },
                eachInvalidField: function () {

                    $(this).closest('div').removeClass('success').addClass('error');
                }
            });
            $("#form2").validate({
                onChange: true,
                eachValidField: function () {

                    $(this).closest('div').removeClass('error').addClass('success');
                },
                eachInvalidField: function () {

                    $(this).closest('div').removeClass('success').addClass('error');
                }
            });
        },
        BindTooltip: function () {
            ///Bind tooltip
            $("#tryit").tooltip({
                show: null,
                position: {
                    my: "left top",
                    at: "left bottom"
                },
                open: function (event, ui) {
                    ui.tooltip.animate({ top: ui.tooltip.position().top + 10 }, "fast");
                }
            });
        },
        GetCurrentPositionAddress: function () {
            ///bind event to get current position
            $("#getCurrentPosition").click(function () {
                if (navigator.geolocation) {
                    // Get current position
                    navigator.geolocation.getCurrentPosition(function (position, status) {
                        var geocoder = new google.maps.Geocoder();
                        //myplace = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

                        if (geocoder) {
                            geocoder.geocode({ 'latLng': new google.maps.LatLng(position.coords.latitude, position.coords.longitude) }, function (results, status) {
                                if (status == google.maps.GeocoderStatus.OK) {
                                    $("#address").val(results[0].formatted_address);
                                }
                                else {
                                    console.log("Geocoding failed: " + status);
                                }
                            });
                        }
                    });
                }
                else {
                    alert("Xin vui lòng bật chức năng định vị, như vậy chúng tôi có thể định vị bạn đang ở đâu.");
                };
            });
        },
        DisplayMore: function (localLimit, listMarker) {
            var bound = (listMarker.length - localLimit) >= 5 ? 5 : (listMarker.length - localLimit);
            bound = (parseInt(localLimit) + parseInt(bound));
            for (i = localLimit; i <= (bound - 1) ; i++) {
                FQTD.markOutLocation(listMarker[i][0], listMarker[i][1], map, listMarker[i][2], false);
                localLimit++;
            }
            limit = localLimit;
        },
        initResult: function () {
            $("#tabList").bind('click', function () {
                $("#list").removeClass("hidden");
                $("#map").addClass("hidden");

                $("#tabList").removeClass("inactive").addClass("active");
                $("#tabMap").removeClass("active").addClass("inactive");
            });
            $("#tabMap").bind('click', function () {
                $("#map").removeClass("hidden");
                $("#list").addClass("hidden");

                $("#tabMap").removeClass("inactive").addClass("active");
                $("#tabList").removeClass("active").addClass("inactive");
            });
            FQTD.showPanel();
            FQTD.hidePanel();
            FQTD.BindPropertyData();
            FQTD.GetJSON();
            $("#btn_xemthemMap").bind("click", function () {
                if (limit < locations.length) {
                    FQTD.DisplayMore(limit, locations);
                }
            });
        },
        initHomepage: function () {
            ///event slide
            var chartsBlock = $('#content');
            chartsBlock.smSlideChart({
                btnNext: $('.next'),
                btnPrev: $('.pre'),
                thumbs: $('#index'),
                callback: function (t, f) { }
            });

            FQTD.BindSelectCategory()
            FQTD.BindSelectBrand()

            function GetBrandByCategory() {
                var siteurl = "/admin/brand/BrandsByCategory";
                var categoryVal = $('#category').val();
                var data = '?id=' + categoryVal;
                $("#brand").empty();
                //alert(siteurl+' '+data);               
                $.getJSON(siteurl + data, null, function (brands) {
                    for (i in brands) {
                        brand = brands[i];
                        $("#brand").append('<option value="' + brand.BrandID + '">' + brand.BrandName + '</option>');;
                    }
                });
            }

            //Cascade select box Category
            $('#category').change(GetBrandByCategory);

            FQTD.SetupWatermarkValidation()
            FQTD.BindTooltip()
            FQTD.GetCurrentPositionAddress()

            //bind places autocomplete
            $("#address").geocomplete();
        },
        initDetail: function () {
            var urlResult = "/result/itemdetail?";
            urlResult += "itemid=6270";
           
            
            var result = $.getJSON(urlResult, null, function (object) {
                console.log(object.PropertyList[0].PropertyName)
                if (object != null) {
                    //bind data to item detail
                    if (object.ItemDetail[0] != null) {
                        $("#brandname").html(object.ItemDetail[0].BrandName)
                        $("#branddescription").html(object.ItemDetail[0].Description)
                        $("#tendiadiem").html("<h2>" + object.ItemDetail[0].ItemName + "</h2>")
                        $("#txtaddress").html(object.ItemDetail[0].FullAddress)
                        $("#txtphone").html(object.ItemDetail[0].Phone)
                        $("#txtwebsite").html(object.ItemDetail[0].Website)
                        $("#txtopentime").html(object.ItemDetail[0].OpenTime)                        
                    }
                    //bind data to same brand list
                    var relatelist = "";
                    if (object.RelateList.length > 0) {
                        for (var i = 0; i < 4; i++) {
                            relatelist += "<td><a href='/detail/" + object.RelateList[i].ItemID + "'><img src='" + object.RelateList[i].Logo + "'/></a><br /><strong>" + object.RelateList[i].ItemName + "</strong></td>"
                        }
                    }
                    $("#samebrand").html(relatelist)
                    //bind data to property list
                    var propertylist = "";
                    if (object.PropertyList.length > 0) {
                        for (var i = 0; i < object.PropertyList.length; i++) {
                            propertylist += "<tr><td class='row1'><img src='../images/bullet_green.png' /></td><td>" + object.PropertyList[i].PropertyName + "</td></tr>"
                        }
                    }                    
                    $("#tblproperty").html(propertylist)
                    //bind data to same category list
                    var samecategoryList = "";
                    if (object.SameCategoryList.length > 0) {
                        for (var i = 0; i < object.SameCategoryList.length; i++) {
                            samecategoryList += "<tr><td class='row1'><a href='/detail/" + object.SameCategoryList[i].ItemID + "'><img class='samecategorylogo' src='" + object.SameCategoryList[i].Logo + "'></a></td><td class='row2'>" + object.SameCategoryList[i].ItemName + "<br /><a href='/detail/" + object.SameCategoryList[i].ItemID + "' class='chitiet'>Chi tiết</a><img src='../images/bullet_grey.png' /></td></tr>"
                        }
                    }
                    $("#tblSameCategory").html(samecategoryList)
                }
            });
        }
    };
})();

