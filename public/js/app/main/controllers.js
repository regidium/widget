'use strict';

/**
 * @url "/widget"
 */
function MainCtrl($rootScope, $scope, $http, $cookieStore, $timeout, socket, sound) {
    // ============================== Установка параметров ============================== //
    var soundChat = sound.init('chat');
    var soundBell = sound.init('bell');

    // Скрываем виджет
    widgetHide();

    // Резервируем переменную начала ввода сообщения
    var message_started = false;

    // Резервируем в $scope переменную текста сообщения
    $scope.text = '';

    // Резервируем в $scope переменную статуса открытости чата
    $scope.opened = false;

    // Резервируем в $scope переменную статуса авторизации
    $scope.auth = false;

    // Резервируем в $scope переменную авторизационных данных пользователя
    $scope.user = { first_name: '', email: '' };

    $scope.messagePlaceholder = 'Write your message and press Enter';

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

        if (chat.agent) {
            chat.agent.first_name = decodeURIComponent(chat.agent.first_name);
            chat.agent.last_name = decodeURIComponent(chat.agent.last_name);
            chat.agent.job_title = decodeURIComponent(chat.agent.job_title);
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
            if (!messages) {
                messages = [];
            }
        } catch(e) {
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
     * Воспроизводим триггер
     */
    function runTrigger(trigger, cb) {
        console.log('Run Trigger');

        if (trigger.result == $rootScope.c.TRIGGER_RESULT_MESSAGE_SEND) {

            var message = {
                created_at: (+new Date) / 1000,
                sender_type: $rootScope.c.MESSAGE_SENDER_TYPE_ROBOT,
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

            // Открываем виджет
            // if (!$scope.isOpened()) {
            //     $scope.open();
            // } else {
            //     checkTrigger($rootScope.c.TRIGGER_EVENT_CHAT_OPENED);
            // }
        } else if (trigger.result == $rootScope.c.TRIGGER_RESULT_AGENTS_ALERT) {
            // @todo
            console.log('Оповещаем агентов');
        } else if (trigger.result == $rootScope.c.TRIGGER_RESULT_WIDGET_OPEN) {
            // Открываем виджет
            if (!$scope.isOpened()) {
                $scope.open();
            // } else {
            //     checkTrigger($rootScope.c.TRIGGER_EVENT_CHAT_OPENED);
            }
        } else if (trigger.result == $rootScope.c.TRIGGER_RESULT_WIDGET_BELL) {
            // @Todo
            widgetBell();
        }

        //if (trigger.event == $rootScope.c.TRIGGER_EVENT_TIME_ONE_PAGE) {
            if (cb) {
                cb();
            }
        //}
    }

    /**
     * Проверяем и воспроизводим триггер
     */
    function checkTrigger(name) {
        if ($scope.triggers && $scope.triggers[name]) {
            console.log('Check Trigger');

            var trigger = $scope.triggers[name];

            try {
                var activated_triggers = sessionStorage.getItem('triggers');
                activated_triggers = JSON.parse(activated_triggers);
                if (!activated_triggers) {
                    activated_triggers = {};
                }
            } catch(e) {
                activated_triggers = {};
            }

            // Не повторяем триггер если он уже был воспроизведен
            if (activated_triggers[trigger.uid]) {
                return;
            }

            // Запоминаем воспроизведенный триггер
            activated_triggers[trigger.uid] = true;
            sessionStorage.setItem('triggers', JSON.stringify(activated_triggers));

            if (trigger.event == $rootScope.c.TRIGGER_EVENT_TIME_ONE_PAGE) {
                var triggerPromise = $timeout(function() { runTrigger(trigger, function(){ $timeout.cancel(triggerPromise); }) }, parseInt(trigger.event_params)*1000);
            } else {
                runTrigger(trigger);
            }
        }
    }

    /**
     * Получение данных пользователя
     */
    function getUserInfo(cb) {
        var user_data = {};
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
                cb(user_data);
            });
        } catch(e) {
            console.log('Ошибка получения IP, страны, города');
            cb(user_data);
        }
    }

    /**
     * Создание нового чата
     */
    function createChat() {
        // Создаем данные пользователя
        getUserInfo(function(user_data) {
            user_data.first_name = 'Client';
            user_data.last_name = '';
            user_data.email = '';

            $scope.chat.user = user_data;
            /** @todo Не готово */
            //$scope.chat.referrer = document.referrer;
            $scope.chat.current_url = document.location.href;

            // Оповещаем о необходимости создать чат
            socket.emit('chat:create', {
                widget_uid: $rootScope.widget_uid,
                chat: $scope.chat
            });
        });
    }

    /**
     * Проверка текущего URL
     */
    function checkUrl() {
        // Получаем текущий URL
        var current_url = document.referrer;
        if ($cookieStore.get('url') != current_url) {
            // Оповещаем о смене URL
            socket.emit('chat:url:change', {
                new_url: current_url,
                chat_uid: $scope.chat.uid,
                widget_uid: $rootScope.widget_uid
            });
        }
        // Сохраняем URL
        $cookieStore.put('url', current_url);
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
            sender_type: $rootScope.c.MESSAGE_SENDER_TYPE_USER,
            text: text
        };

        // Оповещаем об отправке сообщения
        socket.emit('chat:message:send:user', {
            widget_uid: $rootScope.widget_uid,
            chat: $scope.chat,
            message: message
        });

        // Добавляем сообщение в список сообщений
        $scope.chat.messages.push(message);

        // Записываем сообщения в сессию
        sessionStorage.setItem('messages', JSON.stringify($scope.chat.messages));

        // Очищаем поле ввода сообщения
        $scope.text = '';

        $scope.chat.status = $rootScope.c.CHAT_STATUS_CHATTING;
        $scope.chat.old_status = $rootScope.c.CHAT_STATUS_CHATTING;

        // Пролистываем до посдеднего сообщения
        scrollToBottom();
    }

    /**
     * Запрашиваем информацию о виджете
     */
     function getWidgetInfo() {
         socket.emit('widget:info:get', {
             widget_uid: $rootScope.widget_uid,
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
            widget_uid: $rootScope.widget_uid
        });
    });

    /**
     * Проверка открытости чата
     */
    $scope.isOpened = function() {
        var opened = $cookieStore.get('opened');
        if (!opened) {
            return false;
        }
        return opened;
    }

    /**
     * Проверка статуса авторизации
     */
    $scope.isAuth = function() {
        return $cookieStore.get('auth');
    }

    /**
     * Отправка сообщения
     */
    $scope.sendMessage = function() {
        console.log($scope.text);
        // Если виджет не открыт, тогда открываем его
        if (!$scope.isOpened()) {
            $scope.open();
        }

        // Блокируем отправку пустых сообщений
        if ($scope.text.length == 0) {
            return false;
        };

        // Обрботка триггера
        checkTrigger($rootScope.c.TRIGGER_EVENT_WORD_SEND);
        // Обрботка триггера
        checkTrigger($rootScope.c.TRIGGER_EVENT_MESSAGE_SEND);

        // Отправка сообщения
        chatMessageSendUser($scope.text);

        // Анимируем блок авторизации
        chatAuthAnimation();

        // Меняем статус чата на "В чате"
        if ($scope.chat.status != $rootScope.c.CHAT_STATUS_CHATTING) {
            $scope.chat.status = $rootScope.c.CHAT_STATUS_CHATTING;
            $cookieStore.put('chat', $scope.chat);
        }
    }

    // Нажатие клавиш в поле ввода сообщения
    $scope.messageEdit = function(e) {
        console.log(e);
        // Получаем событие нажатия
        e = (e) ? e : window.event;
        var charCode = (e.which) ? e.which : e.keyCode;
        if (!message_started && !(charCode == 13 && !e.shiftKey)) {
            // Обрботка триггера
            checkTrigger($rootScope.c.TRIGGER_EVENT_MESSAGE_START, { message: $scope.text });
        }

        if (charCode == 13 && !e.shiftKey) {
            $scope.sendMessage();
        }
        // Если нажат ENTER
        // if (charCode == 13) {
        //     // Если виджет не открыт, тогда открываем его
        //     if (!$scope.isOpened()) {
        //         $scope.open();
        //     }

        //     // Блокируем отправку пустых сообщений
        //     if ($scope.text.length == 0) {
        //         return false;
        //     };

        //     // Обрботка триггера
        //     checkTrigger($rootScope.c.TRIGGER_EVENT_WORD_SEND);
        //     // Обрботка триггера
        //     checkTrigger($rootScope.c.TRIGGER_EVENT_MESSAGE_SEND);

        //     // Отправка сообщения
        //     chatMessageSendUser($scope.text);

        //     // Анимируем блок авторизации
        //     chatAuthAnimation();

        //     $scope.chat.status = $rootScope.c.CHAT_STATUS_CHATTING;
        //     $cookieStore.put('chat', $scope.chat);

        //     return false;
        // }
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
            widget_uid: $rootScope.widget_uid
        });

        // Обрабатываем триггер
        if (!$scope.isOpened()) {
            checkTrigger($rootScope.c.TRIGGER_EVENT_CHAT_OPENED);
        }

        // Запоминаем состояние чата
        $cookieStore.put('opened', true);
        $scope.opened = true;

        $('#content').slideToggle(300);

        // Разворачиваем область ввода сообщения
        //$('#message-input textarea').animate({height: '55px'});
    }

    // Сворачиваем виджет
    $scope.close = function() {

        // Обрабатываем триггер
        if ($scope.isOpened()) {
            checkTrigger($rootScope.c.TRIGGER_EVENT_CHAT_CLOSED);
        }

        // Запоминаем состояние чата
        $cookieStore.put('opened', false);
        $scope.opened = false;

        $('#content').slideToggle(300);

        // Анимация поля ввода сообщения
        //$('#message-input textarea').animate({height: '55px'});
        // Текст в поле
        //setTimeout("$('#message-input .message-input-content span').delay(1000);", 300);
    }

    // Активируем поле ввода сообщения
    $scope.focus = function() {
        $scope.focused = true;
        //$('#message-input .message-input-content span').fadeOut(100);
        //$('.message-input-content-bg').fadeIn(300);
        //$('#message-input .message-input-content textarea').focus();
    }

    $scope.messageFocus = function() {
        $scope.focused = true;
        $scope.messagePlaceholder = '';
    }

    $scope.messageBlur = function() {
        $scope.focused = false;
        //$scope.messagePlaceholder = 'Write your message and press Enter';
    }

    // Авторизация
    $scope.authorization = function() {
        // Анимация формы авторизации
        $('#auth').fadeOut(300);
        $scope.chat.user = getUserInfo();
        getUserInfo(function(user_data) {
            $scope.chat.user = user_data;
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
                widget_uid: $rootScope.widget_uid
            });
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
        if ($scope.chat.uid == data.chat.uid) {
            // Если виджет не открыт, тогда открываем его
            if (!$scope.isOpened()) {
                $scope.open();
            }

            data.agent.first_name = decodeURIComponent(data.agent.first_name);
            data.agent.last_name = decodeURIComponent(data.agent.last_name);
            data.agent.job_title = decodeURIComponent(data.agent.job_title);

            // Заполняем переменную agent в $scope
            $scope.agent = data.agent;

            $scope.chat.agent = data.agent;
            $scope.chat.status = $rootScope.c.CHAT_STATUS_CHATTING;

            $cookieStore.put('chat', $scope.chat);
        }
    });

    /**
     * Агент отключился от чата
     * @param Object data = {
     *       Object agent
     *       string chat_uid
     *       string widget_uid
     *   }
     */
    socket.on('chat:agent:leave', function (data) {
        console.log('Socket chat:agent:leave');

        // Фильтруем лишнее
        if ($scope.chat.uid == data.chat_uid) {
            // Обнуляем переменную agent
            delete $scope.agent;

            delete $scope.chat.agent;
            //$scope.chat.status = $rootScope.c.CHAT_STATUS_ONLINE;

            $cookieStore.put('chat', $scope.chat);
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
     * Агент прислал сообщение
     * @param Object data = {
     *       Object message
     *       string chat_uid
     *       string widget_uid
     *   }
     */
    socket.on('chat:message:sended:agent', function (data) {
        console.log('Socket chat:message:sended:agent');

        // Убираем лишние
        if (data.chat_uid == $scope.chat.uid) {
            // Оповещаем слушаталей о прочтении сообщения пользователем
            socket.emit('chat:message:read:user', {
                event_send: true,
                message_uid: data.message.uid,
                chat_uid: data.chat_uid,
                widget_uid: $rootScope.widget_uid
            });
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

        // Проверяем триггер
        checkTrigger($rootScope.c.TRIGGER_EVENT_TIME_ONE_PAGE);
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

            // Проверяем триггер
            checkTrigger($rootScope.c.TRIGGER_EVENT_WIDGET_CREATED);

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
            widget_uid: $rootScope.widget_uid
        });

        // Заполняем статус авторизации
        $scope.auth = $scope.isAuth();

        // Если виджет был развернут до обновления страницы, тогда раскрываем его
        if ($scope.isOpened()) {
            $scope.open();
        } else {
            $('#content').hide();
        }

        // Запрашиваем информацию о виджете
        getWidgetInfo();

        checkUrl();
    }

    $(document).ready(function() {
        // Прокручиваем виджет к последнему сообщению
        scrollToBottom();
        // Скрытие рамки поля для ввода
//        $(document).mouseup(function (e) {
//            // Если нажатие было вне блока ввода сообщения
//            if ($(".message-input-content").has(e.target).length === 0) {
//                $(".message-input-content-bg").fadeOut(300);
//            }
//        });

        // Выезжание формы при открытии
        $('#header').slideDown(350);
    });

}