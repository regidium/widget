'use strict';

var EVENT_WIDGET_CREATED = 1;
var EVENT_WORD_SEND = 2;
var EVENT_TIME_ONE_PAGE = 3;
var EVENT_VISIT_PAGE = 4;
var EVENT_VISIT_FROM_URL = 5;
var EVENT_VISIT_FROM_KEY_WORD = 6;
var EVENT_CHAT_OPENED = 7;
var EVENT_CHAT_CLOSED = 8;
var EVENT_MESSAGE_START = 9;
var EVENT_MESSAGE_SEND = 10;

var RESULT_MESSAGE_SEND = 1;
var RESULT_OPERATORS_ALERT = 2;
var RESULT_WIDGET_OPEN = 3;
var RESULT_WIDGET_BELL = 4;

/**
 * @url "/widget"
 */
function MainCtrl($rootScope, $scope, $http, $cookieStore, socket, sound, Widgets) {
    // ============================== Установка параметров ============================== //
    var soundChat = sound.init('chat');
    var soundBell = sound.init('bell');

    // Скрываем виджет
    widgetHide();

    // Получаем UID виджета
    var widget_uid = $cookieStore.get('widget_uid');

    // Резервируем в $scope переменную text
    $scope.text = '';

    // ============================== Общие методы ==============================//
    /**
     * Получение данных персоны пользователя из cookie
     * @param $cookieStore
     */
    function getPerson() {
        var person = $cookieStore.get('person');
        if (person) {
            person.fullname = decodeURIComponent(person.fullname);
            return person;
        }
        return false;
    }

    /**
     * Получение сообщений чата из sessionStorage
     * @param sessionStorage
     *
     * @return array
     */
    function getMessages(sessionStorage) {
        var messages = sessionStorage.getItem('messages');

        try {
            return JSON.parse(messages);
        } catch(e) {
            return [];
        }
    }

    /**
     * Скрытие виджета
     */
    function widgetHide() {
        document.body.style.display = 'none';
    }

    /**
     * Отображение виджета
     */
    function widgetShow() {
        document.body.style.display = 'block';
    }

    /**
     * Проверяем и воспроизводим триггер
     */
    function checkTrigger(name) {

        if ($scope.triggers && $scope.triggers[name]) {
            console.log('Enabled Trigger');

            var trigger = $scope.triggers[name];
            if (trigger.result == RESULT_MESSAGE_SEND) {

                // @todo использовать метод
                // @todo присваивать отправителя
                // Добавляем сообщение в список сообщений
                $scope.chat.messages.push({
                    date: new Date(),
                    person: {agent: {}},
                    text: trigger.result_params
                });

                // Записываем сообщения в сессию
                //sessionStorage.setItem('messages', JSON.stringify($scope.chat.messages));

                // Пролистываем до последнего сообщения
                //scrollToBottom();

            } else if (trigger.result == RESULT_OPERATORS_ALERT) {
                // @todo
                console.log('Оповещаем агентов');
            } else if (trigger.result == RESULT_WIDGET_OPEN) {
                // @Todo
                if (!$scope.isOpened()) {
                    self.open();
                }
            } else if (trigger.result == RESULT_WIDGET_BELL) {
                // @Todo
                widgetBell();
            }
        }
    }

    /**
     * Создание нового чата
     */
    function createChat() {
        var widget_uid = $cookieStore.get('widget_uid');
        // Создаем данные пользователя
        var user_data = {};
        user_data.fullname = 'Client';
        user_data.device = UAParser('').device.model + ' ' + UAParser('').device.vendor;
        user_data.os = UAParser('').os.name;
        user_data.browser = UAParser('').browser.name + ' ' + UAParser('').browser.version;
        user_data.language = $rootScope.lang;
        // Функция
        try {
            user_data.country = geoip_country_name();
            user_data.city = geoip_city();
            // Определяем IP пользователя
            $http.jsonp('http://ipinfo.io/?callback=JSON_CALLBACK').success(function(data) {
                user_data.ip = data.ip;
            });
        } catch(e) {
            console.log('Ошибка получения страны и IP');
        }

        // Оповещаем о необходимости создать чат и пользователя
        socket.emit('chat:create', {
            widget_uid: widget_uid,
            user_data: user_data
        });
    }

    /**
     * Прокрутка чата вниз
     */
    function scrollToBottom() {
        $('#dialogue').animate({'scrollTop': $('#dialogue .content').height()}, 200);
    }

    /**
     * Анимация блока авторизации
     */
    function chatAuthAnimation() {
        $('#auth')
            .delay(500)
            .animate({left: "0px"}, 100)
            .animate({left: "18px"}, 100)
            .animate({left: "9px"}, 100)
    }

    /**
     * Анимиция виджета
     */
    function widgetBell() {
        $('#container')
            .delay(500)
            .animate({marginLeft: "-5px"}, 80)
            .animate({marginLeft: "5px"}, 80)
            .animate({marginLeft: "-5px"}, 80)
            .animate({marginLeft: "5px"}, 80)
            .animate({marginLeft: "-5px"}, 80)
            .animate({marginLeft: "0px"}, 80)
    }

    /**
     * Анимируем сообщения виджета
     */
    function widgetMessageBell() {
        $('#dialogue .msg-content-arrow')
            .delay(500)
            .animate({marginRight: "-5px"}, 80)
            .animate({marginRight: "5px"}, 80)
            .animate({marginRight: "-5px"}, 80)
            .animate({marginRight: "5px"}, 80)
            .animate({marginRight: "-5px"}, 80)
            .animate({marginRight: "0px"}, 80)
    }

    /*
     * Обработка приема сообщений
     */
    function chatMessageSendAgent(data) {
        // Воспроизводим звуковое оповещение
        soundChat.play();

        // Если виджет не открыт, тогда открываем его
        if (!$scope.isOpened()) {
            $scope.open();
        }

        // Добавляем сообщение в список сообщений
        $scope.chat.messages.push({
            date: data.date,
            person: data.person,
            text: data.text
        });

        // Записываем сообщения в сессию
        sessionStorage.setItem('messages', JSON.stringify($scope.chat.messages));

        // Пролистываем до последнего сообщения
        scrollToBottom();
    }

    /*
     * Обработка отправки сообщений
     */
    function chatMessageSendUser(text) {
        var date = new Date();

        // Оповещаем об отправке сообщения
        socket.emit('chat:message:send:user', {
            widget_uid: widget_uid,
            chat_uid: $scope.chat.uid,
            person: $scope.person,
            date: date,
            text: text
        });

        // Добавляем сообщение в список сообщений
        $scope.chat.messages.push({
            person: $scope.person,
            date: date,
            text: text
        });

        // Записываем сообщения в сессию
        sessionStorage.setItem('messages', JSON.stringify($scope.chat.messages));
    }

    /**
     * Запрашиваем информацию о виджете
     */
     function getWidgetInfo() {
         socket.emit('widget:info:get', {
             widget_uid: widget_uid,
             chat_uid: $scope.chat.uid
         });
     }

    // ============================== Angular ==============================//

    /**
     * @todo Проверить необходиость
     * Пользователь меняет страницу
     */
    $scope.$on('$locationChangeStart', function(event) {
        console.log('AngularJS $locationChangeStart');

        // Если виджет не открыт, тогда открываем его
        if (!$scope.isOpened()) {
            $scope.open();
        }

        socket.emit('user:page:change', {
            person_uid: $scope.person.user.uid,
            chat_uid: $scope.chat.uid,
            widget_uid: widget_uid
        });
    });

    /**
     * Проверка открытости чата
     */
    $scope.isOpened = function() {
        return $cookieStore.get('opened');
    }

    // Нажатие клавиш в поле ввода сообщения
    $scope.enter = function(evt) {
        // Получаем событие нажатия
        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        // Обрботка триггера
        checkTrigger(EVENT_MESSAGE_START, { message: $scope.text });
        // Если нажат ENTER
        if (charCode == 13) {
            // Блокируем всплытие
            event.preventDefault()
            // Если виджет не открыт, тогда открываем его

            if (!$scope.isOpened()) {
                $scope.open();
            }

            // Блокируем отправку пустых сообщений
            if ($scope.text.length == 0) {
                return false;
            };

            // Обрботка триггера
            checkTrigger(EVENT_WORD_SEND);
            // Обрботка триггера
            checkTrigger(EVENT_MESSAGE_SEND);

            // Отправка сообщения
            chatMessageSendUser($scope.text);

            // Очищаем поле ввода сообщения
            $scope.text = '';

            // Пролистываем до посдеднего сообщения
            scrollToBottom();

            // Анимируем блок авторизации
            chatAuthAnimation();

            return false;
        }
    }

    // Переключение режима виджета
    $scope.switch = function() {
        // Если виджет уже раскрыт, тогда сворачиваем его
        if (!$scope.isOpened()) {
            $scope.open();
        } else {
            $scope.close();
        }
    }

    // Разворачиваем виджет
    $scope.open = function() {

        // Оповещаем сервер об открытии чата
        socket.emit('chat:open', {
            chat_uid: $scope.chat.uid,
            widget_uid: widget_uid
        });

        if (!$scope.isOpened()) {
            checkTrigger(EVENT_CHAT_OPENED);
        }

        $cookieStore.put('opened', true);

        $('#content').slideToggle(300);

        $('#message-input textarea').animate({height: '15px'});
        // Отображаем подпись поля ввода сообщения
        $scope.input_description = 'Напишите сообщение и нажмите Enter';
    }

    // Сворачиваем виджет
    $scope.close = function() {

        if ($scope.isOpened()) {
            checkTrigger(EVENT_CHAT_CLOSED);
        }

        $cookieStore.put('opened', false);

        $('#content').slideToggle(300);

        // Анимация поля ввода сообщения
        $('#message-input textarea').animate({height: '55px'});
        // Текст в поле
        setTimeout("$('#message-input .message-input-content span').delay(1000);", 300);
    }

    // Активируем поле ввода сообщения
    $scope.focus = function() {
        $('#message-input .message-input-content span').fadeOut(100);
        $('.message-input-content-bg').fadeIn(300);
        $('#message-input .message-input-content textarea').focus();

        if ($('.message-input-content-bg').css('display') !== 'block') {
            $('.message-input-content-bg').fadeIn(300);
        }
    }

    // Авторизация
    $scope.auth = function() {
        // Анимация формы авторизации
        $('#auth').fadeOut(300);
        $scope.person.fullname = $scope.auth.fullname;
        $scope.person.email = $scope.auth.email;

        socket.emit('user:auth:enter', {
            person: $scope.person,
            widget_uid: widget_uid
        });
    }

    // ================================= Socket.IO ================================== //

    /**
     * Агент подключился к чату
     * @param Object data = {
     *       Object person
     *       string chat_uid
     *       string widget_uid
     *   }
     */
    socket.on('chat:agent:enter', function (data) {
        console.log('Socket chat:agent:enter');

        // Фильтруем лишнее
        if ($scope.chat.uid == data.chat_uid) {
            // Если виджет не открыт, тогда открываем его
            if (!$scope.isOpened()) {
                $scope.open();
            }

            // Заполняем переменную agent в $scope
            $scope.agent = data.person;
        }
    });

    /**
     * Агент прислал сообщение
     * @param Object data = {
     *       Object person
     *       int    date
     *       string text
     *   }
     */
    socket.on('chat:message:send:agent', function (data) {
        console.log('Socket chat:message:send:agent');

        // Убираем лишние
        if (data.chat_uid == $scope.chat.uid) {
            chatMessageSendAgent(data);
        }
    });

    /**
     * Получаем информацию о виджете
     * @param Object data
     */
    socket.on('widget:info:sended', function (data) {
        console.log('Socket widget:info:sended');

        $scope.triggers = {};

        if (data.triggers) {
            _.each(data.triggers, function(trigger) {
                $scope.triggers[trigger.event] = trigger;
            });
        }

        $scope.settings = data.settings;

        // Отображаем виджет
        widgetShow();
    });

    // ============================================================================= //

    // Ищем чат в cookie
    var chat = $cookieStore.get('chat');
    // Заполняем переменную сообщений чата
    if (!chat) {
        chat = {};
    }

    chat.messages = getMessages(sessionStorage);
    if (!chat.messages) {
        chat.messages = [];
    }

    // Ищем персону пользователя в cookie
    var person = getPerson();

    // Получаем информацию о виджете
//    Widgets.one({ uid: widget_uid }, function(data) {
//        $scope.triggers = {};
//
//        if (data.triggers) {
//            _.each(data.triggers, function(trigger) {
//                $scope.triggers[trigger.event] = trigger;
//            });
//        }
//        $scope.settings = data.settings;
//
//        // Отображаем виджет
//        widgetShow();
//    });

    if (!chat.uid || !person) {
        // Если чат или пользователь не найдены в cookie - создаем их
        createChat();

        /**
         * Ждем оповещания о создании чата
         * @param Object data = {
         *       Object person
         *       Object chat
         *       string widget_uid
         *   }
         */
        socket.on('chat:created', function (data) {
            console.log('Socket chat:created');

            checkTrigger(EVENT_WIDGET_CREATED);

            // Оповещаем о подключении чата
            socket.emit('chat:connected', {
                chat_uid: data.chat.uid
            });
            // Заполняем переменную персона пользователь
            $scope.person = data.person;
            // Добавляем персону пользователя в cookie
            $cookieStore.put('person', data.person);
            // Заполняем переменную чат
            $scope.chat = data.chat;
            // Добавляем чат в cookie
            $cookieStore.put('chat', data.chat)
            // Заполняем переменную сообщения чата
            $scope.chat.messages = [];
            // Запрашиваем информацию о виджете
            getWidgetInfo();
            // Добавляем статус чата в cookie (закрыт)
            $cookieStore.put('opened', false);
            // Сворачиваем виджет
            $('#content').hide();
        });
    } else {
        if (!chat.messages) {
            chat.messages = [];
        }
        // Заполняем переменную персона пользователь
        $scope.person = person;
        // Заполняем переменную чат
        $scope.chat = chat;
        // Заполняем переменную агент
        $scope.agent = chat.agent;
        // Оповещаем о подключении чата
        socket.emit('chat:connect', {
            person: person,
            chat: chat,
            widget_uid: widget_uid
        });

        // Если виджет был развернут до обновления страницы, тогда раскрываем его
        console.log($scope.isOpened());
        if (!$scope.isOpened()) {
            $scope.close();
        } else {
            $scope.open();
        }

        // Запрашиваем информацию о виджете
        getWidgetInfo();
    }

    $(document).ready(function() {
        // Прокручиваем виджет к последнему сообщению
        scrollToBottom();
        // Скрытие рамки поля для ввода
        $(document).mouseup(function (e) {
            var container = $(".message-input-content");
            if (container.has(e.target).length === 0){
                $(".message-input-content-bg").fadeOut(300);
            }
        });

        // Выезжание формы при открытии
        $('#header').slideDown(350);
    });

}