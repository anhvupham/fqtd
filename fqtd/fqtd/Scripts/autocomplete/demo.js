/*jslint  browser: true, white: true, plusplus: true */
/*global $: true */

$(function () {

    //alert('strict');
    'use strict';

    // Load countries then initialize plugin:
    $.ajax({
        url: '../../scripts/autocomplete/content/countries.txt',
        dataType: 'json'
    }).done(function (source) {

        var countriesArray = $.map(source, function (value, key) { return { value: value, data: key }; }),
            countries = $.map(source, function (value) { return value; });

        // Setup jQuery ajax mock:
        $.mockjax({
            url: '*',
            responseTime: 2000,
            response: function (settings) {
                var query = settings.data.query,
                    queryLowerCase = query.toLowerCase(),
                    re = new RegExp('\\b' + $.Autocomplete.utils.escapeRegExChars(queryLowerCase), 'gi'),
                    suggestions = $.grep(countriesArray, function (country) {
                         // return country.value.toLowerCase().indexOf(queryLowerCase) === 0;
                        return re.test(country.value);
                    }),
                    response = {
                        query: query,
                        suggestions: suggestions
                    };

                this.responseText = JSON.stringify(response);
            }
        });

        // Initialize ajax autocomplete:
        $('#Street').autocomplete({
            // serviceUrl: '/autosuggest/service/url',
            lookup: countriesArray,
            lookupFilter: function(suggestion, originalQuery, queryLowerCase) {
                var re = new RegExp('\\b' + $.Autocomplete.utils.escapeRegExChars(queryLowerCase), 'gi');
                return re.test(suggestion.value);
            },
        });

    });

});