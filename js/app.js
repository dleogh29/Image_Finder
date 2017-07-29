(function(global, ImageFinder) {
    'use strict';

    // 의존성 체크
    if(!ImageFinder) {
        throw 'imageFinder.js 모듈을 먼저 로드해야 합니다.';
    }
    
    // ——————————————————————————————————————
    // API 주소 및 key 세팅
    // ——————————————————————————————————————
    var api_info = {
        type: 'GET',
        url : 'https://api.gettyimages.com/v3/search/images',
        api_key : '32a6uu5rmr37aqrzyeq335wv'
    }

    // ——————————————————————————————————————
    // 검색 필터 기본 세팅
    // ——————————————————————————————————————
    var default_option = {
        fields : "detail_set",
        sort_order : "best_match",
        // page : 0,
        page_size: 15
        // orientations : "Vertical",
        // number_of_people : "one,two,group",
    }

    // ——————————————————————————————————————
    // 변수 선언
    // ——————————————————————————————————————
    var current_option = {};
    var document = global.document;
    var content_wrap, search_form, text_field, card_list_wrap, modal_wrap, modal_close, content_wrap;
    var select_wrap, condition_list, form_paragraph, message_box;

    // ——————————————————————————————————————
    // 사용자 메시지 안내
    // ——————————————————————————————————————
    var showMessage = function(msg, is_error) {
        message_box.innerHTML = msg;
        message_box.classList.add('is-active');
        global.setTimeout(function() {
            message_box.classList.remove('is-active');
            message_box.innerHTML = '';
        }, 2000);
        if(is_error) {
            throw msg;
        }
    }

    // ——————————————————————————————————————
    // 검색어 validation 체크(공백 체크)
    // ——————————————————————————————————————
    var inputValidation = function(input) {
        if(input.trim() === '') {
            showMessage('검색어를 입력해주세요', true);   
        }
    }

    // ——————————————————————————————————————————————————————————
    // Vertical, Horizontal 방향 이미지별 이미지 박스에 맞추는 작업
    // ——————————————————————————————————————————————————————————
    var fitImage = function(image, orientations) {
        var img_class = '';
        var figure_class = '';
        var width = image.max_dimensions.width;
        var height = image.max_dimensions.height;

        // Vertical
        if(orientations && orientations[0].indexOf('Vertical') !== -1) {
            figure_class = 'vertical';
            if((width * 6 / 5) < height) {
                img_class = "fit-width";
            } else {
                img_class = "fit-height";
            }
        }
        // Horizontal
        else {
            // 썸네일 이미지를 담는 박스 크기 width:height = 16:9
            // 이미지 원본의 width 값을 16:9 비율로 계산했을 때 height 값을 계산
            // 기대되는 height 값보다 이미지 원본의 height 값이 작을 경우 height기준으로 박스에 담는다
            if((width * 9 / 16) > height) {
                img_class = "fit-height";
            } else {
                img_class = "fit-width";
            }
        }
        var fit_info = {
            img_class : img_class,
            figure_class : figure_class
        }
        return fit_info;
    }

    // ——————————————————————————————————————
    // 이미지 리스트 render
    // ——————————————————————————————————————
    var renderImageList = function(images, orientations) {
        var template = '<ul class="card-list is-clearfix">';
        images.forEach(function(image) {
            var fit_info = fitImage(image, orientations);
            
            template +=
                '<li>' +
                    '<a href="">' +
                        '<figure class="image is-2by1 ' + fit_info.figure_class + '">' +
                            '<img class="' + fit_info.img_class + '" data-id="' + image.id + '" src="'
                             + image.display_sizes[2].uri + '" alt="' + image.title + '">' +
                        '</figure>' +
                    '</a>' +
                '</li>';
        });
        template += '</ul>'
            + '<button class="button is-small btn-more">more</button>';
        card_list_wrap.innerHTML = template;
        card_list_wrap.classList.add('card');
    }

    // ——————————————————————————————————————
    // 검색 옵션 객체화
    // ——————————————————————————————————————
    var getSearchOption = function() {
        var checked_box = select_wrap.querySelectorAll('input[type="checkbox"]:checked');
        var obj = {};
        ImageFinder.each(checked_box, function(checkbox) {
            var arr = obj[checkbox.name];
            if(arr === undefined) {
                obj[checkbox.name] = [checkbox.value];
            }else {
                arr.push(arr.pop() + ',' + checkbox.value);
            }
        });

        return obj;
    }

    // ——————————————————————————————————————
    // 이미지 검색
    // ——————————————————————————————————————
    var searchImages = function(e) {
        e.preventDefault();

        var phrase = text_field.value;
        inputValidation(phrase);
        
        text_field.value = '';
        select_wrap.classList.remove('is-active');

        current_option = {
            phrase : phrase,
            page : 1
        };
        var add_option = getSearchOption();
        ImageFinder.mixin(current_option, default_option, add_option);

        form_paragraph.classList.add('is-loading');
        ImageFinder(current_option).getImageData(function(images, result_count) {
            form_paragraph.classList.remove('is-loading');
            showMessage(result_count + '건이 검색되었습니다.');
            // console.log('images:', images);
            // ImageFinder(images).renderImageList();
            renderImageList(images, current_option.orientations);
        });
    }

    // ——————————————————————————————————————
    // 이미지 리스트 render(추가 검색시)
    // ——————————————————————————————————————
    var renderMoreImageList = function(images, orientations) {
        var template = '';
        images.forEach(function(image) {
            var fit_info = fitImage(image, orientations);

            template +=
                '<li>' +
                    '<a href="">' +
                        '<figure class="image is-2by1 ' + fit_info.figure_class + '">' +
                            '<img class="' + fit_info.img_class + '" data-id="' + image.id + '" src="'
                             + image.display_sizes[2].uri + '" alt="' + image.title + '">' +
                        '</figure>' +
                    '</a>' +
                '</li>';
        });

        var card_list = card_list_wrap.querySelector('.card-list');
        var temp = document.createElement('div');
        card_list.appendChild(temp);
        card_list.lastChild.outerHTML = template;
    }

    // ——————————————————————————————————————
    // 이미지 추가 검색(more 버튼 클릭시)
    // ——————————————————————————————————————
    var searchMoreImages = function(button) {
        current_option.page++;
        button.classList.add('is-loading');
        ImageFinder(current_option).getImageData(function(images, result_count) {
            button.classList.remove('is-loading');
            showMessage(result_count + '건이 검색되었습니다.');
            // console.log('images:', images);
            renderMoreImageList(images, current_option.orientations);
        }, true);
    };

    // ——————————————————————————————————————
    // 모달 팝업 이미지 render
    // ——————————————————————————————————————
    var renderMainImage = function(e) {
        e.preventDefault();
        e.stopPropagation();
        var target = e.target;
        var nodeName = target.nodeName.toLowerCase();
        if(nodeName === 'img') {
            var main_image = modal_wrap.querySelector('img');
            var image = ImageFinder(target.dataset.id);
            main_image.src = image.display_sizes[0].uri;
            modal_wrap.classList.add('is-active');
        }
        if(nodeName === 'button') {
            searchMoreImages(e.target);
        }
    }

    // ——————————————————————————————————————
    // 모달닫기
    // ——————————————————————————————————————
    var closeModal = function() {
        modal_wrap.classList.remove('is-active');
    }

    // ——————————————————————————————————————
    // 필터 옵션 접기/펼치기
    // ——————————————————————————————————————
    var filterFold = function(e) {
        var target = e.target;
        target.classList.contains('button') &&
            select_wrap.classList.toggle('is-active');
    }
    
    // ——————————————————————————————————————
    // 리스너 설정
    // ——————————————————————————————————————
    var setListener = function() {
        search_form.querySelector('button');
        search_form.addEventListener('submit', searchImages);
        card_list_wrap.addEventListener('click', renderMainImage);
        modal_close.addEventListener('click', closeModal);
        select_wrap.addEventListener('click', filterFold)
    }

    // ——————————————————————————————————————
    // 변수 초기화 및 API 정보 세팅
    // ——————————————————————————————————————
    var init = function() {
        content_wrap = document.querySelector('.content-wrap');
        search_form = content_wrap.querySelector('.search-form');
        text_field = search_form.querySelector('#searchName');
        card_list_wrap = content_wrap.querySelector('.card-list-wrap');
        modal_wrap = content_wrap.querySelector('.modal');
        modal_close = modal_wrap.querySelector('button');
        select_wrap = content_wrap.querySelector('.select-wrap');
        condition_list = select_wrap.querySelector('.condition-list');
        form_paragraph = search_form.querySelector('p.control');
        message_box = search_form.querySelector('.message-box');

        ImageFinder('init', api_info);

        setListener();
    }
    init();
})(window, window.ImageFinder);