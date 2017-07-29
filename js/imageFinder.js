
var ImageFinder = (function(global, $) {
    'use strict';

    // ——————————————————————————————————————
    // 변수 선언
    // ——————————————————————————————————————
    var xhr;
    var toString = Object.prototype.toString;
    var slice = Array.prototype.slice;
    var request_settings = {
        type : null,
        url : null,
        headers : {
            'Api-Key' : null
        },
        data : null
        // var url = 'https://api.gettyimages.com/v3/search/images';
        // var api_key = '32a6uu5rmr37aqrzyeq335wv';
        // data : {
        //     phrase : 'run',
        //     fields : 'detail_set',
        //     number_of_people : ['two'],
        //     page : 1,
        //     page_size: 5
        // }
    };
    var images = [];
    var is_initialized = false;

    // ——————————————————————————————————————
    // 유틸 함수
    // ——————————————————————————————————————
    var type = function(data) {
        return toString.call(data).slice(8, -1).toLowerCase();
    };
    var validate = function(data, compare_data_type, throw_message) {
        if( type(data) === compare_data_type ) {
            return true;
        } else {
            throw throw_message;
        }
    };
    var isType = function(data, data_type) {
        validate(data_type, 'string', 'data_type 전달 인자는 문자열이 전달되어야 합니다');
        return type(data) === data_type;
    };
    var makeArray = function(o) {
        return slice.call(o);
    };
    var mixin = function() {
        var args = makeArray(arguments);
        for (var i=0, l=args.length; i<l; i++) {
            if ( !isType(args[i], 'object') && !isType(args[i], 'function') ) {
                throw '전달인자로 객체만 허용합니다.';
            }
        }
        var mixin_obj = args.shift();
        var next = args.shift();
        do {
            for ( var prop in next ) {
                if ( next.hasOwnProperty(prop) ) {
                    mixin_obj[prop] = next[prop];
                }
            }
            next = args.shift();
        } while ( next );

        return mixin_obj;
    };
    var each = function(o, callback) {
        validate(callback, 'function');
        if ( !isType(o, 'object') && o.length ) {
            o = makeArray(o);
        }
        isType(o, 'array') && o.forEach(callback);
        if ( isType(o, 'object') ) {
            for ( var prop in o ) {
                o.hasOwnProperty(prop) && callback(prop, o[prop], o);
            }
        }
        if ( o.nodeType === 1 ) {
            for ( var prop in o ) {
                callback(prop, o[prop], o);
            }
        }
    };

    // ——————————————————————————————————————————————————————————————
    // 초기화 (API 통신관련 초기 세팅 및 Ajax 데이터 수신시 처리 핸들러)
    // ——————————————————————————————————————————————————————————————
    var init = function(info) {
        if(info.type && info.url && info.api_key) {
            request_settings.type = info.type;
            request_settings.url = info.url;
            request_settings.headers['Api-Key'] = info.api_key;
            is_initialized = true;
            xhr = new XMLHttpRequest();
            xhr.done = function(callback) {
                xhr.onreadystatechange = function(e) {
                    if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                        // 받은 결과를 바로 객체화해서 콜백함수의 인자로 넣어 실행해준다.
                        callback(JSON.parse(xhr.response));
                    }
                };
            };
        } else {
            throw 'api 초기화 정보가 올바르지 않습니다.';
        }
    };

    // ——————————————————————————————————————
    // 검색 필터 옵션 세팅
    // ——————————————————————————————————————
    var setOption = function(option) {
        request_settings.data = option;
    };

    // ——————————————————————————————————————
    // Ajax 관련 메소드
    // ——————————————————————————————————————
    var getQueryString = function(data) {
        var queryString = '';

        // Query String : param1=value&param2=value
        each(data, function(key, value) {
            queryString += key + '=' + value + '&';
        });
        queryString = global.encodeURI(queryString.slice(0, -1));

        return queryString;
    };
    var ajax = function(settings) {
        var queryString = getQueryString(settings.data);

        // URL : domain?param1=value&param2=value
        var url = settings.url + '?' + queryString;
        xhr.open(settings.type, url);
        xhr.setRequestHeader('Api-Key', settings.headers['Api-Key']);
        xhr.send(null);
       
        return xhr;
    };

    // ——————————————————————————————————————
    // 이미지 받아오기
    // ——————————————————————————————————————
    var getImageData = function(callback, is_more) {
        // console.log('request_settings:', request_settings);
        ajax(request_settings).done(function(data) {
            var image_array = data.images;
            images = is_more ? images.concat(image_array) : image_array;
            // console.log('images:', images);
            callback(image_array, data.result_count);
        });
    };

    // ——————————————————————————————————————
    // 검색된 이미지 중 특정 ID를 가진 이미지 찾기
    // ——————————————————————————————————————
    var id = function(id) {
        var selected_item;
        images.forEach(function(item) {
            (id === item.id) && (selected_item = item);
        });
        return selected_item;
    }

    // ——————————————————————————————————————
    // 생성자 함수
    // ——————————————————————————————————————
    function ImageFinder(arg1, arg2) {
        if(!(this instanceof ImageFinder)) {
            return new ImageFinder(arg1, arg2);
        }

        if(arg1 === 'init' && isType(arg2, 'object')) {
            init(arg2);
            return this;
        }

        if(is_initialized) {
            if(isType(arg1, 'string')) {
                return id(arg1);
            }

            if(isType(arg1, 'object')) {
                setOption(arg1);
                return this;
            }
        } else {
            throw '초기화를 반드시 해야합니다.';
        }

    };

    // ——————————————————————————————————————
    // 프로토타입 객체 선언
    // ——————————————————————————————————————
    ImageFinder.prototype = {
        constructor : ImageFinder,
        getImageData : getImageData,
    };

    // ——————————————————————————————————————
    // 외부에서 static 메소드 추가 가능
    // ——————————————————————————————————————
    ImageFinder.include = function(obj) {
        mixin(ImageFinder, obj);
    };

    // ——————————————————————————————————————
    // static 메소드 선언
    // ——————————————————————————————————————
    ImageFinder.include({
        mixin : mixin,
        each : each
    });

    return ImageFinder;

})(window);