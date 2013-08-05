/*Global variables and functions*/

var FQTD = (function () {
    var myplace, directionsDisplay, map;
    var locations = new Array();
    var limit = 0;
    var infobox;

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

    return {
        BindPropertyData: function () {
            //Bind data to checkbox
            var urlProperty = "/result/PropertyByCategoryID";
            $.getJSON(urlProperty + "?id=-1", null, function (properties) {
                for (i in properties) {
                    $("#property").append('<div class="propertyrow"><input tabindex="' + i + '" type="checkbox" id="' + properties[i].PropertyID + '"><label for="' + properties[i].PropertyID + '">' + properties[i].PropertyName + '</label></div>');
                    $("#property").append('<div class="clearfix"></div>')
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
                if (infobox) infobox.close();
                infobox = new InfoBox({
                    content: contentPopup,
                    disableAutoPan: true,
                    maxWidth: 0,
                    pixelOffset: new google.maps.Size(-140, 0),
                    zIndex: null,
                    closeBoxMargin: "12px 4px 2px 2px",
                    closeBoxURL: "/images/close.gif",
                    infoBoxClearance: new google.maps.Size(1, 1)
                });
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
            $("#list").html("<p style='text-align:center'>Thông tin tìm kiếm hiện chưa cập nhật. Vui lòng tìm lại sau.</p>");
            $("#map").html("<p style='text-align:center'>Thông tin tìm kiếm hiện chưa cập nhật. Vui lòng tìm lại sau.</p>");
            FQTD.displayMap();
        },
        pageselectCallback: function (page_index, jq) {
            // Get number of elements per pagionation page from form
            var items_per_page = 5
            var max_elem = Math.min((page_index + 1) * items_per_page, locations.length);
            var newcontent = '';

            // Iterate through a selection of the content and build an HTML string
            for (var i = page_index * items_per_page; i < max_elem; i++) {
                newcontent += '<div id="object"><table style="width: 100%;"><tr><td valign="top" style="width:116px;"><a href="/detail/' + isEmpty(locations[i][7]) + '" target="_blank"><img id="photo" width="150" src="' + isEmpty(checkImage(locations[i][6])) + '" /></a></td><td valign="top"><h2>' + (isEmpty(locations[i][3])) + '</h2>'
                    + '<p>Địa chỉ : ' + isEmpty(locations[i][4]) + '<br/>Điện thoại : ' + isEmpty(locations[i][5]) + '</p><p><a href="/detail/' + isEmpty(locations[i][7]) + '" target="_blank"><strong>Xem chi tiết</strong></a>'
                    + ' | <a href="javascript:void(0);" onclick="FQTD.DisplayDirection(' + isEmpty(checkImage(locations[i][0])) + ',' + isEmpty(checkImage(locations[i][1])) + ')" class="lienket"><strong>Đường đi</strong></a></p></td></tr></table></div>';
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
        GetJSON: function (arr) {
            //Get data result            
            var urlResult = "/result/search?";
            urlResult += "mode=" + $("#form").val();
            urlResult += "&keyword=" + decrypt($("#search").val());
            urlResult += "&currentLocation=" + decrypt($("#address").val());
            urlResult += "&categoryid=" + $("#category").val();
            urlResult += "&brandid=" + $("#brand").val();
            urlResult += "&radious=" + $("#range").val();
            if (arr) {
                if (arr.length > 0) {
                    urlResult += "&properties=";
                    for (var i = 0; i < arr.length; i++) {
                        urlResult += arr[i] + ",";
                    }
                }
            }
            urlResult += "&vn0_en1=0";
            console.log(urlResult)
            var result = $.getJSON(urlResult, null, function (items) {
                //alert(items);
                for (var i = 0; i < items.length; i++) {
                    if (items[i].Latitude != null && items[i].Longitude != null) {
                        var contentmarker = '<div class="marker"><h2>' + isEmpty(items[i].ItemName) + '</h2><p>' + isEmpty(items[i].FullAddress) + '<br/>' + isEmpty(items[i].Phone) + '</p></div>'
                                     + '<ul id="directionIcon">'
                                     + '<li id="moto" onclick=\"FQTD.calcRoute(' + items[i].Latitude + ',' + items[i].Longitude + ',\'car\',' + $("#form").val() + ')\"></li>'
                                     + '<li id="car" onclick=\"FQTD.calcRoute(' + items[i].Latitude + ',' + items[i].Longitude + ',\'car\',' + $("#form").val() + ')\"></li>'
                                     + '<li id="bus" onclick=\"FQTD.calcRoute(' + items[i].Latitude + ',' + items[i].Longitude + ',\'bus\',' + $("#form").val() + ')\"></li>'
                                     + '<li id="walk" onclick=\"FQTD.calcRoute(' + items[i].Latitude + ',' + items[i].Longitude + ',\'walk\',' + $("#form").val() + ')\"></li></ul>'
                                     + '<div id="linkview"><a href="/detail/' + isEmpty(items[i].ItemID) + '" target="_blank">Xem chi tiết</a></div><div id="space"></div>';
                        locations.push([items[i].Latitude, items[i].Longitude, contentmarker, isEmpty(items[i].ItemName), isEmpty(items[i].FullAddress), isEmpty(items[i].Phone), isEmpty(items[i].Logo), isEmpty(items[i].ItemID), 0, isEmpty(items[i].MarkerIcon)]);
                    }
                }
            });

            result.complete(function () {
                FQTD.BindData()
                //set back link               
                $("#backlink").attr("href", "/#" + $("#form").val())
            });
        },
        BindData: function () {

            if (locations.length > 0) {
                if ($("#form").val() == "1") {
                    var address = decrypt($("#address").val());
                    var geocoder = new google.maps.Geocoder();
                    if (geocoder) {
                        geocoder.geocode({ 'address': address }, function (results, status, content) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                //set LatLng current place
                                myplace = results[0].geometry.location;

                                //add distance to array and sort array by distance
                                FQTD.SortArray()

                                //bind marker to map
                                FQTD.SetupMap(myplace, locations, 12, 0);

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

                            //add distance to array and sort array by distance
                            FQTD.SortArray()

                            //bind marker to map
                            FQTD.SetupMap(myplace, locations, 12, 1);
                        });
                    }
                    else {
                        alert("Xin vui lòng bật chức năng định vị, như vậy chúng tôi có thể tìm những địa điểm gần bạn nhất.");
                        //set default location is Hue (middle of Vietnam)
                        myplace = new google.maps.LatLng(16.46346, 107.58470);

                        //add distance to array and sort array by distance
                        FQTD.SortArray()

                        //bind marker to map
                        FQTD.SetupMap(myplace, locations, 6, 1);
                    };
                    //set list display first
                    FQTD.displayMap()
                }
                FQTD.Pagination()
                FQTD.MoveFooter()
            }
            else {
                FQTD.noRecord()
            }
        },
        SetupMap: function (myplace, listMarker, zoom, type) {
            if (type == 1) {
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
            for (i = 0; i <= 4; i++) {
                if (listMarker[i]) {
                    FQTD.markOutLocation(listMarker[i][0], listMarker[i][1], map, listMarker[i][2], listMarker[i][9]);
                    limit++;
                }
            }

            //check to display button more
            if (listMarker.length <= 4) $("#btn_xemthemMap").addClass("hidden")
        },
        BindSelectCategory: function () {
            //Bind data to select box Category
            var urlCategory = "/admin/categories/Categories";
            $.getJSON(urlCategory + "?vn0_en1=0", null, function (categories) {
                for (i in categories) {
                    $("#category").append('<option value="' + categories[i].CategoryID + '">' + categories[i].CategoryName + '</option>');
                }
            });
        },
        BindSelectBrand: function () {
            //Bind data to select box Brand
            var urlBrand = "/admin/brand/BrandsByCategory";
            $.getJSON(urlBrand + "?id=-1", null, function (brands) {
                $("#brand").append('<option value="-1">Tất cả</option>');
                for (i in brands) {
                    $("#brand").append('<option value="' + brands[i].BrandID + '">' + brands[i].BrandName + '</option>');;
                }
            });
        },
        SetupWatermarkValidationHomepage: function () {
            //watermark and validation
            $("#address").watermark("Nhập địa chỉ hiện tại của bạn");
            $("#search").watermark("Nhập tên hoặc địa chỉ quán bạn muốn tìm");
            $("#range").watermark("Bán kính");
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
                FQTD.markOutLocation(listMarker[i][0], listMarker[i][1], map, listMarker[i][2], listMarker[i][9]);
                localLimit++;
            }
            limit = localLimit;
        },
        DisplayDirection: function (lat, long) {
            FQTD.displayMap()
            FQTD.calcRoute(lat, long, 'car', $("#form").val())
        },
        SortArray: function () {
            for (i = 0; i < locations.length; i++) {
                var compareDistance = return_Distance(myplace, new google.maps.LatLng(locations[i][0], locations[i][1]));
                //add distance to array
                locations[i][8] = compareDistance;
            }
            //sort by distance ascending
            locations.sort(sortbyDistance)
        },
        BindKeywordAutocomplete: function () {
            //get all keyword
            var urlResult = "result/GetKeyword4Autocomplete?stringinput=";

            var result = $.getJSON(urlResult, null, function (items) {
                $("#search").autocomplete({
                    source: items
                })
            });
        },
        HideLoading: function () {
            $("#loading").addClass("hidden");
        },
        MoveFooter: function () {
            $("#bottom").attr("class", "bottom")
        },
        Sticker: function () {
            var s = $("#cactienich");
            var pos = s.position();
            $(window).scroll(function () {
                var windowpos = $(window).scrollTop();
                if (windowpos >= pos.top) {
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
            //$("#CustomerName").watermark("Nhập họ tên của bạn");
            $("#Phone").watermark("Nhập số điện thoại của bạn");
            $("#Email").watermark("Nhập email của bạn");
            $("#ContactTitle").watermark("Nhập tiêu đề liên lạc");
            $("#ContactContent").watermark("Nhập nội dung liên lạc");
            //validate
            $('#CustomerName').closest('form').validate({
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
        SubmitForm: function () {
            //direct to result page
            var address = $('#address').val() != "" ? encrypt($('#address').val()) : "0"
            var type = window.location.hash == "#1" ? "1" : "0"
            var range = $('#range').val() != "" ? $('#range').val() : "0"
            var category = $('#category').val() != "" ? $('#category').val() : "0"
            var brand = $('#brand').val() != "" ? $('#brand').val() : "0"
            var search = $('#search').val() != "" ? encrypt($('#search').val()) : "0"

            if (type == "0" && search == "0") return false;

            if (type == "1" && (address == "0" || (category == "0" || brand == "0") || range == "0")) return false;
           
            window.location.href = "result/index/" + type + "/" + category + "/" + brand + "/" + range + "/" + address + "/" + search
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
            $("#btn_filter").bind("click", function () {
                FQTD.ResetData()
                FQTD.GetPropertyValue()
            })
            FQTD.Sticker();
            //footer
            FQTD.HideLoading()
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
                    $("#brand").append('<option value="-1">Tất cả</option>');
                    for (i in brands) {
                        brand = brands[i];
                        $("#brand").append('<option value="' + brand.BrandID + '">' + brand.BrandName + '</option>');;
                    }
                });
            }

            //Cascade select box Category
            $('#category').change(GetBrandByCategory);

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
                $('.next').click();
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
        },
        initDetail: function () {
            var id = $(location).attr('pathname').split('/')[2]
            var urlResult = "/result/itemdetail?";
            urlResult += "itemid=" + id;

            var result = $.getJSON(urlResult, null, function (object) {
                if (object != null) {
                    //bind data to item detail
                    if (object.ItemDetail[0] != null) {
                        console.log(object.BrandLogo)
                        $("#brandlogo").attr('src', object.BrandLogo)
                        $("#brandname").html(object.ItemDetail[0].BrandName)
                        $("#branddescription").html(object.ItemDetail[0].Description)
                        $("#tendiadiem").html("<h1>" + object.ItemDetail[0].ItemName + "</h1>")
                        $("#txtaddress").html(object.ItemDetail[0].FullAddress)
                        $("#txtphone").html(object.ItemDetail[0].Phone)
                        $("#txtwebsite").html(object.ItemDetail[0].Website)
                        $("#txtopentime").html(object.ItemDetail[0].OpenTime)
                        if (isEmpty(object.ItemDetail[0].Latitude) != "" && isEmpty(object.ItemDetail[0].Longitude) != "") {
                            $("#staticmap").attr('src', 'http://maps.googleapis.com/maps/api/staticmap?center=' + isEmpty(object.ItemDetail[0].Latitude) + ',' + isEmpty(object.ItemDetail[0].Longitude) + '&zoom=15&size=682x300&maptype=roadmap&markers=color:blue%7Clabel:A%7C' + isEmpty(object.ItemDetail[0].Latitude) + ',' + isEmpty(object.ItemDetail[0].Longitude) + '&sensor=false')
                        }
                        //facebook tags
                        $('meta[name=og\\:title]').attr('content', object.ItemDetail[0].ItemName);
                        //page title
                        document.title = object.ItemDetail[0].ItemName;
                    }
                    //bind data to same brand list
                    var relatelist = "";
                    if (object.RelateList.length > 0) {
                        for (var i = 0; i < 4; i++) {
                            if (object.RelateList[i]) {
                                relatelist += "<td><a href='/detail/" + object.RelateList[i].ItemID + "'><img src='" + object.RelateList[i].Logo + "'/></a><br /><strong>" + object.RelateList[i].ItemName + "</strong></td>"
                            }
                        }
                    }
                    $("#samebrand").html(relatelist)
                    //bind data to property list
                    var propertylist = "";
                    if (object.PropertyList.length > 0) {
                        for (var i = 0; i < object.PropertyList.length; i++) {
                            if (object.PropertyList[i]) {
                                var hidden = object.PropertyList[i].PropertyValue == false ? " class='hidden'" : ""
                                propertylist += "<tr " + hidden + "><td class='row1'><img src='/images/bullet_green.png' /></td><td>" + object.PropertyList[i].PropertyName + "</td></tr>"
                            }
                        }
                    }
                    $("#tblproperty").html(propertylist)
                    //bind data to same category list
                    var samecategoryList = "";
                    if (object.SameCategoryList.length > 0) {
                        for (var i = 0; i < object.SameCategoryList.length; i++) {
                            if (object.SameCategoryList[i]) {
                                samecategoryList += "<tr><td class='row1'><a href='/detail/" + object.SameCategoryList[i].ItemID + "'><img class='samecategorylogo' src='" + object.SameCategoryList[i].Logo + "'></a></td><td class='row2'>" + object.SameCategoryList[i].ItemName + "<br /><a href='/detail/" + object.SameCategoryList[i].ItemID + "' class='chitiet'>Chi tiết</a><img src='/images/bullet_grey.png' /></td></tr>"
                            }
                        }
                    }
                    $("#tblSameCategory").html(samecategoryList)
                    //bind to image gallery
                    var imagegallery = "";
                    if (object.ItemImages.length > 0) {
                        for (var i = 0; i < object.ItemImages.length; i += 2) {
                            if (object.ItemImages[i]) {
                                imagegallery += "<tr>"
                                if (object.ItemImages[i]) imagegallery += "<td class='row1'><a href='" + object.ItemImages[i] + "' data-lightbox='imagegallery'><img src='" + object.ItemImages[i] + "'></a></td>"
                                if (object.ItemImages[i + 1]) imagegallery += "<td class='row1'><a href='" + object.ItemImages[i + 1] + "' data-lightbox='imagegallery'><img src='" + object.ItemImages[i + 1] + "'></a></td>"
                                imagegallery += "</tr>"
                            }
                        }
                    }
                    $("#tblimagegallery").html(imagegallery)

                    FQTD.HideLoading()
                    FQTD.MoveFooter()
                }
            });
        },
        initContactUs: function () {
            FQTD.SetupWatermarkValidationContactus()
        }
    };
})();

