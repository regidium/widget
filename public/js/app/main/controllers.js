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
var RESULT_AGENTS_ALERT = 2;
var RESULT_WIDGET_OPEN = 3;
var RESULT_WIDGET_BELL = 4;

var SENDER_TYPE_USER = 1;
var SENDER_TYPE_AGENT = 2;
var SENDER_TYPE_ROBOT = 3;

/**
 * @url "/widget"
 */
function MainCtrl($rootScope, $scope, $http, $cookieStore, socket, sound) {
    // ============================== Установка параметров ============================== //
    var soundChat = sound.init('chat');
    var soundBell = sound.init('bell');

    // Скрываем виджет
    widgetHide();

    // Получаем UID виджета
    var widget_uid = $cookieStore.get('widget_uid');

    // Резервируем в $scope переменную текста сообщения
    $scope.text = '';

    // Резервируем в $scope переменную статуса открытости чата
    $scope.opened = false;

    // Резервируем в $scope переменную статуса авторизации
    $scope.фгер = false;

    // Резервируем в $scope переменную авторизационных данных пользователя
    $scope.user = { first_name: '', email: '' };

    // ============================== Общие методы ==============================//
    /**
     * Получение данных пользователя из cookie
     */
    function getChat() {
        var chat = $cookieStore.get('chat');
        if (!chat) {
            chat = {};
        }

        if (chat.user) {
            chat.user.first_name = decodeURIComponent(chat.user.first_name);
            chat.user.last_name = decodeURIComponent(chat.user.last_name);
        } else {
            chat.user = {};
        }

        return chat;
    }

    /**
     * Получение сообщений чата из sessionStorage
     * @param sessionStorage
     *
     * @return array
     */
    function getMessages() {
        var messages = sessionStorage.getItem('messages');

        try {
            messages = JSON.parse(messages);
        } catch(e) {
            messages = [];
        }

        if (!messages) {
            messages = [];
        }

        return messages;
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

                var message = {
                    created_at: +new Date,
                    sender_type: SENDER_TYPE_ROBOT,
                    text: trigger.result_params
                }

                // @todo использовать метод
                // @todo записывать в БД
                // Добавляем сообщение в список сообщений
                $scope.chat.messages.push(message);

                // Записываем сообщения в сессию
                sessionStorage.setItem('messages', JSON.stringify($scope.chat.messages));

                // Пролистываем до последнего сообщения
                scrollToBottom();

            } else if (trigger.result == RESULT_AGENTS_ALERT) {
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
        // Создаем данные пользователя
        var user_data = {};
        user_data.first_name = 'Client';
        user_data.last_name = '';
        user_data.email = '';
        user_data.device = UAParser('').device.model + ' ' + UAParser('').device.vendor;
        user_data.os = UAParser('').os.name;
        user_data.browser = UAParser('').browser.name + ' ' + UAParser('').browser.version;
        user_data.language = $rootScope.lang;
        // Получаем IP, страну, город пользователя
        try {
            user_data.country = geoip_country_name();
            user_data.city = geoip_city();
            // Определяем IP пользователя
            $http.jsonp('http://ipinfo.io/?callback=JSON_CALLBACK').success(function(data) {
                user_data.ip = data.ip;
            });
        } catch(e) {
            console.log('Ошибка получения IP, страны, города');
        }

        $scope.chat.user = user_data;

        // Оповещаем о необходимости создать чат
        socket.emit('chat:create', {
            widget_uid: widget_uid,
            chat: $scope.chat
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
        $scope.chat.messages.push(data.message);

        // Записываем сообщения в сессию
        sessionStorage.setItem('messages', JSON.stringify($scope.chat.messages));

        // Пролистываем до последнего сообщения
        scrollToBottom();
    }

    /*
     * Обработка отправки сообщений
     */
    function chatMessageSendUser(text) {
        var message = {
            created_at: +new Date,
            sender_type: SENDER_TYPE_USER,
            text: text
        };

        // Оповещаем об отправке сообщения
        socket.emit('chat:message:send:user', {
            widget_uid: widget_uid,
            chat_uid: $scope.chat.uid,
            message: message
        });

        // Добавляем сообщение в список сообщений
        $scope.chat.messages.push(message);

        // Записываем сообщения в сессию
        sessionStorage.setItem('messages', JSON.stringify($scope.chat.messages));

        // Очищаем поле ввода сообщения
        $scope.text = '';

        // Пролистываем до посдеднего сообщения
        scrollToBottom();
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
     * @todo Проверить необходиость для NotSinglePage
     * Страница меняется
     */
    $scope.$on('$locationChangeStart', function(event) {
        console.log('AngularJS $locationChangeStart');

        socket.emit('chat:page:change', {
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

    /**
     * Проверка статуса авторизации
     */
    $scope.isAuth = function() {
        return $cookieStore.get('auth');
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

        // Обрабатываем триггер
        if (!$scope.isOpened()) {
            checkTrigger(EVENT_CHAT_OPENED);
        }

        // Запоминаем состояние чата
        $cookieStore.put('opened', true);
        $scope.opened = true;

        $('#content').slideToggle(300);

        // Разворачиваем облость ввода сообщения
        $('#message-input textarea').animate({height: '15px'});
        // Отображаем подпись поля ввода сообщения
        $scope.input_description = 'Write your message and press Enter';
    }

    // Сворачиваем виджет
    $scope.close = function() {

        // Обрабатываем триггер
        if ($scope.isOpened()) {
            checkTrigger(EVENT_CHAT_CLOSED);
        }

        // Запоминаем состояние чата
        $cookieStore.put('opened', false);
        $scope.opened = false;

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
    }

    // Авторизация
    $scope.authorization = function() {
        // Анимация формы авторизации
        $('#auth').fadeOut(300);
        $scope.chat.user.first_name = $scope.user.first_name;
        $scope.chat.user.email = $scope.user.email;

        var chat = getChat();
        chat.user.first_name = $scope.user.first_name;
        chat.user.email = $scope.user.email;

        $cookieStore.put('chat', chat);

        $scope.auth = true;
        $cookieStore.put('auth', true);

        socket.emit('chat:user:auth', {
            user: $scope.user,
            chat_uid: $scope.chat.uid,
            widget_uid: widget_uid
        });
    }

    // ================================= Socket.IO ================================== //

    /**
     * Агент подключился к чату
     * @param Object data = {
     *       Object agent
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
            $scope.agent = data.agent;
        }
    });

    /**
     * Агент прислал сообщение
     * @param Object data = {
     *       Object agent
     *       int    created_at
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
     * Пришла информация о виджете
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

    // Ищем чат в cookie и заполняем $scope переменную
    $scope.chat = getChat();

    // Получаем сообщения чата
    $scope.chat.messages = getMessages();

    // Если чат не найден в cookie - создаем чат
    if (!$scope.chat.uid) {
        createChat();

        /**
         * Ждем оповещания о создании чата
         * @param Object data = {
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
            $scope.opened = false;
            // Добавляем статус авторизации в cookie (не авторизирован)
            $cookieStore.put('auth', false);
            $scope.auth = false;
            // Сворачиваем виджет
            $('#content').hide();
        });
    } else {
        // Заполняем переменную агент
        $scope.agent = $scope.chat.agent;
        // Оповещаем о подключении чата
        socket.emit('chat:connect', {
            chat:       $scope.chat,
            widget_uid: widget_uid
        });

        $scope.auth = $scope.isAuth();

        // Если виджет был развернут до обновления страницы, тогда раскрываем его
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
            if ($(".message-input-content").has(e.target).length === 0) {
                $(".message-input-content-bg").fadeOut(300);
            }
        });

        // Выезжание формы при открытии
        $('#header').slideDown(350);
    });

}