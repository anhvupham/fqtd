﻿/*Global variables and functions*/

var FQTD = (function () {
    var myplace, directionsDisplay, map, infowindow;
    var locations = new Array();
    var limit = 0;
    var infobox;
    var NumberOfIntemShow;
    var NumberOfIntemAddmore;

    function isEmpty(str) {
        if ((!str || 0 === str.length) == true) {
            return '';
        }
        else {
            return $.trim(str);
        }
    }

    function checkImage(str) {
        if ((!str || 0 === str.length) == true) {
            return '/images/no-image.jpg';
        }
        else {
            return str;
        }
    }

    function rad(x) {
        return x * Math.PI / 180;
    }

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

    function sortbyDistance(a, b) {
        return a[8] - b[8];
    }

    function encrypt(value) {
        return $.rc4EncryptStr(value, "timdau")
    }

    function decrypt(value) {
        if (value == "0" || value == 0)
            return value;
        else
            return $.rc4DecryptStr(value, "timdau")
    }

    function encodeItemName(value) {
        //return encodeURIComponent(value.replace(".", "_").replace("/", ",").replace("\"", "*"));
        value = value.replace(/\ /g, '-').replace(/\//g, "^").replace(/\\/g, "*").replace(/\./g, ":");//.replace(/\&/g, '_');
        return (value);
    }

    function decodeItemName(value) {
        value = (value)
        return value.replace(/\-/g, ' ').replace(/\^/g, "/").replace(/\*/g, '\\').replace(/\:/g, ".");//.replace(/\_/g, "&");
    }

    function validateNumber(value) {
        return $.isNumeric(value)
    }

    function handleNoGeolocation(errorFlag) {
        var mapOptions = {
            zoom: 6,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById('googleMap'),
            mapOptions);


        if (errorFlag) {
            var content = '<p class="alert">Xin vui lòng bật chức năng định vị, như vậy chúng tôi có thể tìm những địa điểm gần bạn nhất.</p>';
        } else {
            var content = '<p class="alert">Trình duyệt của bạn không hỗ trợ chức năng định vị. Vui lòng truy cập vào <<http://caniuse.com/geolocation>> để biết thêm chi tiết.</p>';
        }

        var options = {
            map: map,
            position: new google.maps.LatLng(60, 105),
            content: content
        };

        var infowindow = new google.maps.InfoWindow(options);
        map.setCenter(options.position);
    }   

    return {
        BindPropertyData: function () {
            //Bind data to checkbox
            var urlProperty = "/result/PropertyByCategoryID";
            $.getJSON(urlProperty + "?id=-1", null, function (properties) {
                for (i in properties) {
                    $("#property").append('<div class="propertyrow"><input tabindex="' + i + '" type="checkbox" id="' + properties[i].PropertyID + '"><label for="' + properties[i].PropertyID + '">' + properties[i].PropertyName + '</label></div>');
                    $('#' + properties[i].PropertyID).iCheck({
                        checkboxClass: 'icheckbox_square',
                        increaseArea: '20%' // optional
                    });
                }
            });
        },
        markOutLocation: function (lat, long, map, contentPopup, markerIcon) {
            var place = new google.maps.LatLng(lat, long);
            var marker = new google.maps.Marker({
                position: place,
                title: 'Click to zoom',
                icon: markerIcon
            });

            google.maps.event.addListener(marker, 'click', function () {
                if (infowindow) infowindow.close();
                //infobox = new InfoBox({
                //    content: contentPopup,
                //    disableAutoPan: true,
                //    maxWidth: 0,
                //    pixelOffset: new google.maps.Size(-140, 0),
                //    zIndex: null,
                //    closeBoxMargin: "12px 4px 2px 2px",
                //    closeBoxURL: "/images/close.png",
                //    infoBoxClearance: new google.maps.Size(1, 1)
                //});
                infowindow = new google.maps.InfoWindow({
                    content: contentPopup
                });
                infowindow.open(map, marker);
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
                    }, function () {
                        alert("Xin vui lòng bật chức năng định vị để chúng tôi tìm được vị trí của bạn.");
                    }, options);
                }
                else {
                    alert("Trình duyệt của bạn không hỗ trợ chức năng định vị. Vui lòng truy cập vào <<http://caniuse.com/geolocation>> để biết thêm chi tiết.");
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
            /*panel left*/
            $("#panelPropLeft").panel({
                close: function (event, ui) {
                    setTimeout(function () {
                        $("#buttonPropLeft").removeClass("hidden");
                    }, 500);
                }
            });
            ///////////
            /*panel left*/
            $("#panelPropRight").panel({
                close: function (event, ui) {
                    setTimeout(function () {
                        $("#buttonPropRight").removeClass("hidden");
                    }, 500);
                }
            });
            ///////////
        },
        showPanel: function () {
            /*panel left*/
            $("#buttonPropLeft").bind("click", function () {
                $("#buttonPropLeft").addClass("hidden");
            })

            $("#panelcontentLeft").removeClass("hidden")
            //////////
            /*panel right*/
            $("#buttonPropRight").bind("click", function () {
                $("#buttonPropRight").addClass("hidden");
            })

            $("#panelcontentRight").removeClass("hidden")
            //////////
        },
        displayList: function () {

            $("#list").removeClass("hidden");
            $("#map").addClass("hidden");

            $("#tabList").removeClass("inactive").addClass("active");
            $("#tabMap").removeClass("active").addClass("inactive");

            $("#footer").removeClass("result");

        },
        displayMap: function () {

            $("#map").removeClass("hidden");
            $("#list").addClass("hidden");

            $("#tabMap").removeClass("inactive").addClass("active");
            $("#tabList").removeClass("active").addClass("inactive");

            $("#footer").addClass("result");

        },
        noRecord: function () {
            $("#list").html("<div class='container noResultText'><p>Xin lỗi, chúng tôi không tìm thấy địa điểm bạn cần! Hiện tại bạn có thể tìm kiếm các địa điểm thuộc lĩnh vực Ẩm thực & Giải khát như: Tiệm bánh, nhà hàng, quán ăn, quán cà phê, sinh tố, yogurt...<br/> Trong thời gian tới, chúng tôi sẽ ra mắt danh mục Trung tâm thương mại và Vui chơi. Vui lòng tìm lại sau !</p><a data-ajax='false' href='/' class='buttonGreen'>Về trang chủ</a></div>");
            $("#map").html("<div class='container noResultText'><p>Xin lỗi, chúng tôi không tìm thấy địa điểm bạn cần! Hiện tại bạn có thể tìm kiếm các địa điểm thuộc lĩnh vực Ẩm thực & Giải khát như: Tiệm bánh, nhà hàng, quán ăn, quán cà phê, sinh tố, yogurt...<br/> Trong thời gian tới, chúng tôi sẽ ra mắt danh mục Trung tâm thương mại và Vui chơi. Vui lòng tìm lại sau !</p><a data-ajax='false' href='/' class='buttonGreen'>Về trang chủ</a></div>");
            $("#menu").addClass("hidden")
            $("#buttonPropLeft").addClass("hidden")
            FQTD.displayMap();
        },
        yesRecord: function () {
            $("#map").html("<div id='googleMap' style='width: 100%; height: 100%;'></div><div class='btn_more'><div class='buttonGreen showmorebtn' id='btn_xemthemMap'>Xem thêm</div></div>");
            $("#list").html("<div id='subList' class='container'></div><div class='paging container'><div class='row'><div id='pagination' class='pagination col-xs-12'></div></div></div>");
            FQTD.displayMap();
        },
        pageselectCallback: function (page_index, jq) {
            // Get number of elements per pagionation page from form
            var items_per_page = NumberOfIntemShow
            var max_elem = Math.min((page_index + 1) * items_per_page, locations.length);
            var newcontent = '';
            // Iterate through a selection of the content and build an HTML string
            for (var i = page_index * items_per_page; i < max_elem; i++) {
                newcontent += '<div class="row object"><div class="col-sm-2 col-xs-12"><a href="/detail/' + isEmpty(locations[i][7]) + '/' + encodeItemName(isEmpty(locations[i][3])) + '" target="_blank"><img id="photo" width="150" class="img-responsive" src="' + isEmpty(checkImage(locations[i][6])) + '" /></a></div><div class="col-sm-10 col-xs-12"><h2><a href="/detail/' + isEmpty(locations[i][7]) + '/' + encodeItemName(isEmpty(locations[i][3])) + '" target="_blank">' + (isEmpty(locations[i][3])) + '</a></h2>'
                    + '<p>Địa chỉ : ' + isEmpty(locations[i][4]) + '<br/>Điện thoại : ' + isEmpty(locations[i][5]) + '</p><p><a href="/detail/' + isEmpty(locations[i][7]) + '/' + encodeItemName(isEmpty(locations[i][3])) + '" target="_blank"><strong>Xem chi tiết</strong></a>'
                    + ' | <a href="javascript:void(0);" onclick="FQTD.DisplayDirection(' + isEmpty(checkImage(locations[i][0])) + ',' + isEmpty(checkImage(locations[i][1])) + ')" class="lienket"><strong>Đường đi</strong></a></p></div></div>';
            }
            // Replace old content with new content
            $('#subList').html(newcontent);

            // Prevent click eventpropagation
            return false;
        },
        Pagination: function () {
            var opt = {
                callback: FQTD.pageselectCallback,
                items_per_page: NumberOfIntemShow,
                num_display_ENtries: 5,
                num_edge_ENtries: 2,
                prev_text: "Trước",
                next_text: "Sau"
            };
            $("#pagination").pagination(locations.length, opt);
        },
        GetJSON: function (arr) {
            //Get data result            
            var urlResult = "/result/search?";
            urlResult += "mode=" + $("#form").val();
            urlResult += "&keyword=" + decodeItemName($("#search").val()).replace('&', '_');
            urlResult += "&currentLocation=" + decodeItemName($("#address").val());
            urlResult += "&categoryid=" + $("#category").val();
            urlResult += "&brandid=" + $("#brand").val();
            urlResult += "&radious=" + $("#range").val();
            //alert(urlResult);
            if (arr) {
                if (arr.length > 0) {
                    urlResult += "&properties=";
                    for (var i = 0; i < arr.length; i++) {
                        urlResult += arr[i] + ",";
                    }
                }
            }
            urlResult += "&vn0_EN1=0";
            var result = $.getJSON(urlResult, null, function (items) {
                if ($("#form").val() == "0") {
                    for (var y = 0; y < items.length; y++) {
                        for (var i = 0; i < items[y].length; i++) {
                            var obj = items[y][i]
                            if (obj.Latitude != null && obj.Longitude != null) {
                                FQTD.AddToArray(obj, y)
                            }
                        }
                    }
                }
                else {
                    for (var i = 0; i < items.length; i++) {
                        var obj = items[i]
                        if (obj.Latitude != null && obj.Longitude != null) {
                            FQTD.AddToArray(obj, 0)
                        }
                    }
                }
            });

            result.complete(function () {
                FQTD.BindData("position")
                //set back link               
                $("#backlink").attr("href", "/#" + $("#form").val())
                $("#btn_xemthemMap").bind("click", function () {
                    if (limit < locations.length) {
                        FQTD.DisplayMore(limit, locations);
                    }
                    else {
                        $("#btn_xemthemMap").addClass("hidden")
                    }
                });
            });
        },
        AddToArray: function (obj, queue) {
            var contentmarker = '<div class="marker"><h2>' + isEmpty(obj.ItemName) + '</h2><p>' + isEmpty(obj.FullAddress) + '<br/>' + isEmpty(obj.Phone) + '</p></div>'
                                         + '<ul id="directionIcon">'
                                         + '<li id="moto" onclick=\"FQTD.calcRoute(' + obj.Latitude + ',' + obj.Longitude + ',\'car\',' + $("#form").val() + ')\"></li>'
                                         + '<li id="car" onclick=\"FQTD.calcRoute(' + obj.Latitude + ',' + obj.Longitude + ',\'car\',' + $("#form").val() + ')\"></li>'
                                         + '<li id="bus" onclick=\"FQTD.calcRoute(' + obj.Latitude + ',' + obj.Longitude + ',\'bus\',' + $("#form").val() + ')\"></li>'
                                         + '<li id="walk" onclick=\"FQTD.calcRoute(' + obj.Latitude + ',' + obj.Longitude + ',\'walk\',' + $("#form").val() + ')\"></li></ul>'
                                         + '<div id="linkview"><a href="/detail/' + isEmpty(obj.ItemID) + '/' + encodeItemName(isEmpty(obj.ItemName)) + '" target="_blank">Xem chi tiết</a></div><div id="space"></div>';
            locations.push([obj.Latitude, obj.Longitude, contentmarker, isEmpty(obj.ItemName), isEmpty(obj.FullAddress), isEmpty(obj.Phone), isEmpty(obj.Logo), isEmpty(obj.ItemID), 0, isEmpty(obj.MarkerIcon), queue]);
        },
        BindData: function (type) {
            if (locations.length > 0) {
                FQTD.yesRecord()
                if ($("#form").val() == "1") {
                    var address = decodeItemName($("#address").val());
                    var geocoder = new google.maps.Geocoder();
                    if (geocoder) {
                        geocoder.geocode({ 'address': address }, function (results, status, content) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                //set LatLng current place
                                myplace = results[0].geometry.location;

                                //add distance to array and sort array by distance
                                FQTD.SortArray(type)

                                //bind list
                                FQTD.Pagination()

                                //bind marker to map
                                FQTD.SetupMap(myplace, locations, 12, $("#form").val());

                            } else {
                                alert("Geocode không hoạt động vì lí do sau : " + status);
                            }
                        });
                    }
                    //set map display first
                    FQTD.displayMap()
                }
                else if ($("#form").val() == "0") {
                    if (navigator.geolocation) {
                        // Get current position
                        navigator.geolocation.getCurrentPosition(function (position, status) {
                            var geocoder = new google.maps.Geocoder();

                            if (geocoder) {
                                myplace = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

                                //add distance to array and sort array by distance
                                FQTD.SortArray(type)

                                //bind list
                                FQTD.Pagination()

                                //bind marker to map
                                FQTD.SetupMap(myplace, locations, 12, $("#form").val());
                            }
                            else {
                                console.log("Geocode không hoạt động vì lí do sau: " + status);
                            }
                        }, function () {
                            handleNoGeolocation(true);
                            //bind list
                            FQTD.Pagination()
                        });
                    }
                    else {
                        alert("Trình duyệt của bạn không hỗ trợ chức năng định vị. Vui lòng truy cập vào <<http://caniuse.com/geolocation>> để biết thêm chi tiết.");
                        //set default location is Hue (middle of Vietnam)
                        myplace = new google.maps.LatLng(16.46346, 107.58470);

                        //add distance to array and sort array by distance
                        FQTD.SortArray(type)

                        //bind list
                        FQTD.Pagination()

                        //bind marker to map
                        FQTD.SetupMap(myplace, locations, 6, $("#form").val());
                    };

                    //set list display first
                    FQTD.displayMap()
                }
            }
            else {
                FQTD.noRecord()
            }
        },
        SetupMap: function (myplace, listMarker, zoom, type) {
            if (type == 0) {
                //set if 1st place will not display in map view
                var compareDistance = return_Distance(myplace, new google.maps.LatLng(listMarker[0][0], listMarker[0][1]));
                if (compareDistance > 17639) {
                    myplace = new google.maps.LatLng(listMarker[0][0], listMarker[0][1]);
                }
                //set map
                var mapProp = {
                    center: myplace,
                    zoom: zoom,
                    disableDefaultUI: true,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                map = new google.maps.Map(document.getElementById("googleMap"), mapProp);
            }
            else {
                //get range value
                var range = $("#range").val();

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

                map.fitBounds(myCity.getBounds());
                FQTD.markOutLocation(myplace.lat(), myplace.lng(), map, "<p class='currentplace'>Bạn đang ở đây.</p>", '/images/home.png');
            }

            //set direction
            directionsDisplay = new google.maps.DirectionsRenderer();
            directionsDisplay.setMap(map);

            //add marker to map
            for (i = 0; i < NumberOfIntemShow; i++) {
                if (listMarker[i]) {
                    FQTD.markOutLocation(listMarker[i][0], listMarker[i][1], map, listMarker[i][2], listMarker[i][9]);
                    limit++;
                }
            }

            //check to display button more
            if (listMarker.length <= NumberOfIntemShow) $("#btn_xemthemMap").addClass("hidden")
        },
        BindSelectCategory: function () {
            //Bind data to select box Category
            var urlCategory = "/admin/categories/Categories";
            $.getJSON(urlCategory + "?vn0_EN1=0", null, function (categories) {
                for (i in categories) {
                    $("#category").append('<option value="' + categories[i].CategoryID + '">' + categories[i].CategoryName + '</option>');
                }
            });
        },
        BindSelectBrand: function () {
            //Bind data to select box Brand
            var urlBrand = "/admin/brand/BrandsByCategory";
            $.getJSON(urlBrand + "?id=-1", null, function (brands) {
                //$("#brand").append('<option value="-1">Tất cả</option>');
                for (i in brands) {
                    $("#brand").append('<option value="' + brands[i].BrandID + '">' + brands[i].BrandName + '</option>');;
                }
            });
        },
        SetupWatermarkValidationHomepage: function () {
            //watermark and validation
            $("#address").watermark("Nhập địa chỉ hiện tại của bạn hoặc sử dụng chức năng định vị bên cạnh");
            $("#search").watermark("Nhập tên hoặc địa chỉ địa điểm tìm kiếm");
            $("#range").watermark("Nhập bán kính (mét)");
            $("#input-category").watermark("Chọn lĩnh vực");
            $("#input-brand").watermark("Chọn địa điểm");
            //$("#input-category").attr("placeholder", "Chọn lĩnh vực");
            //$("#input-brand").attr("placeholder", "Chọn địa điểm");
            $("#form1").validate({
                onChange: true,
                sendFormPost: false,
                eachValidField: function () {

                    $(this).closest('div').removeClass('error').addClass('success');
                },
                eachInvalidField: function () {

                    $(this).closest('div').removeClass('success').addClass('error');
                }
            });
            $("#form2").validate({
                onChange: true,
                sendFormPost: false,
                eachValidField: function () {

                    $(this).closest('div').removeClass('error').addClass('success');
                },
                eachInvalidField: function () {

                    $(this).closest('div').removeClass('success').addClass('error');
                }
            });
        },
        BindTooltip: function () {
            //Bind tooltip
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
            //bind event to get current position
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
                                    console.log("Geocode không hoạt động vì lí do sau: " + status);
                                }
                            });
                        }
                    }, function () {
                        alert("Xin vui lòng bật chức năng định vị để chúng tôi tìm được vị trí của bạn.");
                    });
                }
                else {
                    //do not use handleNoGeolocation because not in map page
                    alert("Trình duyệt của bạn không hỗ trợ chức năng định vị. Vui lòng truy cập vào <<http://caniuse.com/geolocation>> để biết thêm chi tiết.");
                };
            });
        },
        DisplayMore: function (localLimit, listMarker) {
            var bound = (listMarker.length - localLimit) >= NumberOfIntemAddmore ? NumberOfIntemAddmore : (listMarker.length - localLimit);
            bound = (parseInt(localLimit) + parseInt(bound));
            for (i = localLimit; i <= (bound - 1) ; i++) {
                FQTD.markOutLocation(listMarker[i][0], listMarker[i][1], map, listMarker[i][2], listMarker[i][9]);
                localLimit++;
            }
            limit = localLimit;
        },
        DisplayDirection: function (lat, long) {
            FQTD.displayMap()
            FQTD.calcRoute(lat, long, 'car', $("#form").val())
        },
        SortArray: function (type) {
            for (i = 0; i < locations.length; i++) {
                var compareDistance = return_Distance(myplace, new google.maps.LatLng(locations[i][0], locations[i][1]));
                //add distance to array
                locations[i][8] = compareDistance;
            }
            if (type == "position") {
                //sort by list priority first then distance ascending
                var s = firstBy(function (v1, v2) { return v1[10] - v2[10] })
                     .thenBy(function (v1, v2) { return v1[8] - v2[8] });
                locations.sort(s)
            }
            else if (type == "name") {
                //sort by name
                var s = firstBy(function (v1, v2) { return v1[10] - v2[10] })
                    .thenBy(function (v1, v2) { return v1[3] < v2[3] ? -1 : (v1[3] > v2[3] ? 1 : 0); });
                locations.sort(s)
            }
        },
        BindKeywordAutocomplete: function () {
            //get all keyword
            //var urlResult = "result/GetKeyword4Autocomplete?stringinput=";

            /*var result = $.getJSON(urlResult, null, function (items) {
                $("#search").autocomplete({
                    source: items
                })
            });*/
            $("#search").autocomplete({
                source: function (request, response) {
                    $.ajax({
                        url: "result/GetKeyword4Autocomplete",
                        dataType: "json",
                        data: {
                            stringinput: request.term,
                        },
                        success: function (data) {
                            response($.map(data, function (item) {
                                return {
                                    label: item
                                }
                            }));
                        }
                    });
                },
                minLength: 2,
                open: function () {
                    $(this).removeClass("ui-corner-all").addClass("ui-corner-top");
                },
                close: function () {
                    $(this).removeClass("ui-corner-top").addClass("ui-corner-all");
                }
            });
        },
        HideLoading: function () {
            $("#loading").addClass("hidden");
        },
        Sticker: function () {
            var s = $("#cactienich");
            var pos = s.position();
            $(window).scroll(function () {
                var windowpos = $(window).scrollTop();
                if (windowpos > pos.top) {
                    s.removeClass("nostick");
                    s.addClass("stick");
                } else {
                    s.removeClass("stick");
                    s.addClass("nostick");
                }               
            });
        },
        GetPropertyValue: function () {
            var arr = [];

            $(".checked").each(function () {
                var checkbox = $(this).find("input:checkbox:first");
                arr.push(checkbox[0].id)
            })

            FQTD.GetJSON(arr)
        },
        ResetData: function () {
            myplace = null;
            directionsDisplay = null;
            map = null;
            locations = new Array();
            limit = 0;
            infobox = null;
        },
        SetupWatermarkValidationContactus: function () {
            //watermark
            $("#CustomerName").watermark("Nhập họ tên của bạn");
            $("#Phone").watermark("Nhập số điện thoại của bạn");
            $("#Email").watermark("Nhập email của bạn");
            $("#ContactTitle").watermark("Nhập tiêu đề liên lạc");
            $("#ContactContent").watermark("Nhập nội dung liên lạc");

            //validate
            $('#CustomerName').closest('form').validate({
                onChange: true,
                sendFormPost: true,
                eachValidField: function () {

                    $(this).closest('div').removeClass('error').addClass('success');
                },
                eachInvalidField: function () {

                    $(this).closest('div').removeClass('success').addClass('error');
                }
            });
        },
        SubmitForm: function () {
            //direct to result page
            var address = $('#address').val() != "" ? encodeItemName($('#address').val()) : "0"
            var type = $(".carousel-indicators").find('.active').attr('data-slide-to') == "1" ? "1" : "0"
            var range = $('#range').val() != "" ? $('#range').val() : "0"
            var category = $('#category').val() != "" ? $('#category').val() : "0"
            var brand = $('#brand').val() != "" ? $('#brand').val() : "0"
            var search = $('#search').val() != "" ? encodeItemName($('#search').val()) : "0"

            //tracking event
            if (type == "0") ga('send', 'event', 'home search', 'click', 'form1', search)

            if (type == "1") ga('send', 'event', 'home search', 'click', 'form2', $("input-category").val() + "_" + $("input-brand").val())
            /////////////

            if (type == "0" && search == "0") return false;

            if (type == "1" && (address == "0" || brand == "0" || range == "0" || validateNumber(range) == false)) return false;
            
            window.location.href = "result/index/" + type + "/" + category + "/" + brand + "/" + range + "/" + address + "/" + search
        },
        ShowMoreDescription: function () {
            $("#showmoreDescription").click(function () {
                $("#branddescription").removeClass("less");
                $("#showmoreDescription").addClass("hidden");
                return false;
            });
        },
        initResult: function () {
            $("#tabList").bind('click', function () {
                FQTD.displayList()
            });
            $("#tabMap").bind('click', function () {
                FQTD.displayMap()
            });
            NumberOfIntemShow = $("#NumberOfIntemShow").val()
            NumberOfIntemAddmore = $("#NumberOfIntemAddmore").val()            
            FQTD.showPanel();
            FQTD.hidePanel();
            FQTD.BindPropertyData();
            FQTD.GetJSON();
            $("#btn_filter").bind("click", function () {
                FQTD.ResetData()
                FQTD.GetPropertyValue()
            })
            //FQTD.Sticker();
            FQTD.HideLoading()
            $("#buttonArrangeName").bind("click", function () {
                //sort array by name
                FQTD.BindData("name");
                $("#buttonArrangeName").removeClass("buttonGrey").addClass("buttonGreen")
                $("#buttonArrangePosition").removeClass("buttonGreen").addClass("buttonGrey")
            })
            $("#buttonArrangePosition").bind("click", function () {
                //sort array by position
                FQTD.BindData("position");
                $("#buttonArrangePosition").removeClass("buttonGrey").addClass("buttonGreen")
                $("#buttonArrangeName").removeClass("buttonGreen").addClass("buttonGrey")
            })
        },
        initHomepage: function () {
            //event slide
            $('.carousel').carousel({
                interval: false
            })

            FQTD.BindSelectCategory()
            FQTD.BindSelectBrand()

            if (!(navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i))) {
                //set autocomplete
                $("#category").combobox({
                    select: function (event, ui) {
                        var id = ui.item.value;
                        if (id > 0) {
                            //Fill brand selectbox
                            var siteurl = "/admin/brand/BrandsByCategory";
                            var data = '?id=' + id;
                            $("#brand").empty();
                            //alert(siteurl+' '+data);               
                            var result = $.getJSON(siteurl + data, null, function (brands) {
                                $("#brand").append('<option value="-1">Tất cả</option>');
                                for (i in brands) {
                                    brand = brands[i];
                                    $("#brand").append('<option value="' + brand.BrandID + '">' + brand.BrandName + '</option>');;
                                }
                            });
                            result.complete(function () {
                                //set autocomplete           
                                $("#input-brand").val("Tất cả")
                                $("#brand").combobox();
                            });
                        }
                    }
                });
                $("#brand").combobox();
            }
            else {
                $('#category').change(function () {
                    //Fill brand selectbox
                    var siteurl = "/admin/brand/BrandsByCategory";
                    var categoryVal = $('#category').val();
                    var data = '?id=' + categoryVal;
                    $("#brand").empty();
                    var result = $.getJSON(siteurl + data, null, function (brands) {
                        $("#brand").append('<option value="-1">Tất cả</option>');
                        for (i in brands) {
                            brand = brands[i];
                            $("#brand").append('<option value="' + brand.BrandID + '">' + brand.BrandName + '</option>');;
                        }
                    });
                });
            }

            FQTD.SetupWatermarkValidationHomepage()
            FQTD.BindTooltip()
            FQTD.GetCurrentPositionAddress()

            //bind places autocomplete
            $("#address").geocomplete({
                country: 'vn'
            });

            //bind auto complete to keyword
            FQTD.BindKeywordAutocomplete()

            //check if step2
            if (window.location.hash == "#1") {
                $('.carousel').carousel(1)
            }

            //button keyword click
            $('#btn_home1').click(function (e) {
                e.preventDefault();
                e.stopPropagation();
                $('#form1').submit()
            });

            $("#form1").submit(function () {
                FQTD.SubmitForm()
            });

            //button range click
            $('#btn_home2').click(function (e) {
                e.preventDefault();
                e.stopPropagation();
                $('#form2').submit()
            });

            $("#form2").submit(function () {
                FQTD.SubmitForm()
            });

            $('#form2').keydown(function (e) {
                if (e.keyCode == 13) {
                    $('#form2').submit();
                }
            });
        },
        initDetail: function () {
            var id = $(location).attr('pathname').split('/')[2]
            var urlResult = "/result/itemdetail?";
            urlResult += "itemid=" + id;

            var result = $.getJSON(urlResult, null, function (object) {
                if (object != null) {
                    //bind data to item detail
                    if (object.ItemDetail[0] != null) {
                        //$("#brandlogo").attr('src', object.BrandLogo)
                        //$("#brandname").html(object.ItemDetail[0].ItemName)
                        //$("#branddescription").html(object.ItemDetail[0].Description)
                        //$("#tendiadiem").html("<h1>" + object.ItemDetail[0].ItemName + "</h1>")
                        //$("#txtaddress").html(object.ItemDetail[0].FullAddress)
                        //$("#txtphone").html(object.ItemDetail[0].Phone)
                        //$("#txtopentime").html(object.ItemDetail[0].OpenTime)
                        //$("#txtcategory").html(object.ItemDetail[0].CategoryName)
                        //if (isEmpty(object.ItemDetail[0].Latitude) != "" && isEmpty(object.ItemDetail[0].Longitude) != "") {
                        //    $("#staticmap").attr('src', 'http://maps.googleapis.com/maps/api/staticmap?center=' + isEmpty(object.ItemDetail[0].Latitude) + ',' + isEmpty(object.ItemDetail[0].Longitude) + '&zoom=15&size=682x300&maptype=roadmap&markers=color:blue%7Clabel:A%7C' + isEmpty(object.ItemDetail[0].Latitude) + ',' + isEmpty(object.ItemDetail[0].Longitude) + '&sensor=false')
                        //}
                        //facebook tags
                        //$('meta[property="og\\:title"]').attr('content', object.ItemDetail[0].ItemName);
                        //$('meta[name="description"]').attr('content', object.ItemDetail[0].Description);
                        //page title
                        //document.title = object.ItemDetail[0].ItemName;
                    }

                    //bind data to same brand list
                    var relatelist = "";
                    if (object.RelateList.length > 0) {
                        for (var i = 0; i < 4; i++) {
                            if (object.RelateList[i]) {
                                relatelist += "<div class='col-sm-3'><a href='/detail/" + object.RelateList[i].ItemID + "/" + encodeItemName(object.RelateList[i].ItemName) + "'><img src='" + object.RelateList[i].Logo + "' class='img-responsive'/></a><br /><strong>" + object.RelateList[i].ItemName + "</strong></div>"
                            }
                        }
                    }
                    $("#samebrand").html(relatelist)

                    //bind data to property list
                    var propertylist = "";
                    if (object.PropertyList.length > 0) {
                        for (var i = 0; i < object.PropertyList.length; i++) {
                            if (object.PropertyList[i]) {
                                var hidden = object.PropertyList[i].PropertyValue == false ? " hidden" : ""
                                propertylist += "<div class='col-sm-12 record" + hidden + "'><img src='/images/bullet_green.png' /><span>" + object.PropertyList[i].PropertyName + "</span></div>"
                            }
                        }
                    }
                    $("#tblproperty").html(propertylist)

                    //bind to image gallery
                    var imagegallery = "";
                    if (object.ItemImages.length > 0) {
                        for (var i = 0; i < object.ItemImages.length; i += 2) {
                            if (object.ItemImages[i]) {
                                var hidden = "";
                                //if (i == object.ItemImages.length - 1)
                                //    hidden = "hidden-sm";
                                if (object.ItemImages[i]) imagegallery += "<div class='col-md-6 col-xs-12 col-sm-3 " + hidden + "'><a href='" + object.ItemImages[i] + "' data-lightbox='imagegallery' title='Hình ảnh chỉ mang tính chất minh họa'><img src='" + object.ItemImages[i] + "' class='img-responsive'/></a></div>"
                                if (i != object.ItemImages.length - 1) {
                                    if (object.ItemImages[i + 1]) imagegallery += "<div class='col-md-6 col-xs-12 col-sm-3'><a href='" + object.ItemImages[i + 1] + "' data-lightbox='imagegallery' title='Hình ảnh chỉ mang tính chất minh họa'><img src='" + object.ItemImages[i + 1] + "' class='img-responsive'/></a></div>"
                                }
                            }
                        }
                    }
                    $("#tblimagegallery").html(imagegallery)

                    //bind data to same category list
                    var samecategoryList = "";
                    if (object.SameCategoryList.length > 0) {
                        for (var i = 0; i < object.SameCategoryList.length; i++) {
                            if (object.SameCategoryList[i]) {
                                var hidden = "";
                                //if (i == object.SameCategoryList.length - 1)
                                //    hidden = "hidden-sm";
                                samecategoryList += "<div class='col-sm-3 col-md-12 record " + hidden + "'><div class='col-md-5 col-sm-12 col-xs-12'><a href='/detail/" + object.SameCategoryList[i].ItemID + "/" + encodeItemName(object.SameCategoryList[i].ItemName) + "'><img class='samecategorylogo img-responsive' src='" + object.SameCategoryList[i].Logo + "' /></a></div><div class='col-md-7 col-sm-12 col-xs-12'>" + object.SameCategoryList[i].ItemName + "<br /><a href='/detail/" + object.SameCategoryList[i].ItemID + "/" + encodeItemName(object.SameCategoryList[i].ItemName) + "' class='chitiet'>Chi tiết</a><img src='/images/bullet_grey.png' /></div></div>"
                            }
                        }
                    }
                    $("#tblSameCategory").html(samecategoryList)

                    FQTD.HideLoading()
                    FQTD.ShowMoreDescription()
                }
            });
        },
        initContactUs: function () {
            FQTD.SetupWatermarkValidationContactus()
        }
    };
})();

