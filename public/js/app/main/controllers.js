'use strict';

/**
 * @url "/widget"
 */
function MainCtrl($rootScope, $scope, $http, $timeout, $log, $document, $routeParams, $filter, $translate, socket, sound) {
    // ============================== Установка параметров ============================== //
    // Получаем UID виджета
    $rootScope.widget_uid = $routeParams.uid;

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

    // Резервируем в $scope переменную количества агентов в сети
    $scope.agent_count = 0;

    $scope.messagePlaceholder = $translate('Write your message and press Enter');

    // ============================== Общие методы ==============================//
    /**
     * Получение данных чата из cookie
     */
    function getChat() {
        var chat = localStorage.getItem('chat.'+$rootScope.widget_uid);
        chat = JSON.parse(chat);
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
     * Получение сообщений чата из localStorage
     *
     * @return array
     */
    function getMessages() {
        var messages = localStorage.getItem('messages.'+$rootScope.widget_uid);

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
        $document[0].body.style.display = 'none';
    }

    /**
     * Отображение виджета
     */
    function widgetShow() {
        $document[0].body.style.display = 'block';
    }

    /**
     * Воспроизводим триггер
     */
    function runTrigger(trigger, cb) {
        $log.debug('Run Trigger');

        if (trigger.result == $rootScope.c.TRIGGER_RESULT_MESSAGE_SEND) {

            var message = {
                created_at: (+new Date) / 1000,
                readed: true,
                sender_type: $rootScope.c.MESSAGE_SENDER_TYPE_ROBOT_TO_USER,
                text: trigger.result_params
            };

            socket.emit('chat:message:send:robot', {
                message: message,
                chat: $scope.chat,
                widget_uid: $rootScope.widget_uid
            });

            // Открываем виджет
            // if (!$scope.isOpened()) {
            //     $scope.open();
            // } else {
            //     checkTrigger($rootScope.c.TRIGGER_EVENT_CHAT_OPENED);
            // }
        } else if (trigger.result == $rootScope.c.TRIGGER_RESULT_AGENTS_ALERT) {
            // @todo
            $log.debug('Оповещаем агентов');
        } else if (trigger.result == $rootScope.c.TRIGGER_RESULT_WIDGET_OPEN) {
            // Открываем виджет
            if (!$scope.isOpened()) {
                $scope.open();
            } else {
                checkTrigger($rootScope.c.TRIGGER_EVENT_CHAT_OPENED);
            }
        } else if (trigger.result == $rootScope.c.TRIGGER_RESULT_WIDGET_BELL) {
            // @Todo
            widgetBell();
        }

        if (cb) {
            cb();
        }
    }

    /**
     * Проверяем и воспроизводим триггер
     */
    function checkTrigger(name) {
        if ($scope.triggers && $scope.triggers[name]) {
            $log.debug('Check Trigger');

            var trigger = $scope.triggers[name];

            try {
                var activated_triggers = localStorage.getItem('triggers.'+$rootScope.widget_uid);
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
            localStorage.setItem('triggers.'+$rootScope.widget_uid, JSON.stringify(activated_triggers));

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
            $http.jsonp('http://api.sypexgeo.net/jsonp/?callback=JSON_CALLBACK').success(function(data) {
                // @todo можно определять timezone (http://sypexgeo.net/ru/api/)
                user_data.ip = data.ip;
                user_data.country = data.country.name_en;
                user_data.city = data.city.name_en;
                cb(user_data);
            });
        } catch(e) {
            $log.debug('Ошибка получения IP, страны, города');
            cb(user_data);
        }
    }

    /**
     * Создание нового чата
     */
    function createChat() {
        // Создаем данные пользователя
        getUserInfo(function(user_data) {
            user_data.first_name = $translate('User');
            user_data.last_name = '';
            user_data.email = '';

            $scope.chat.user = user_data;

            $scope.chat.current_url = $document[0].referrer;

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
        var current_url = $document[0].referrer;
        if (localStorage.getItem('url.'+$rootScope.widget_uid) != current_url) {
            // Оповещаем о смене URL
            socket.emit('chat:url:change', {
                new_url: current_url,
                chat_uid: $scope.chat.uid,
                widget_uid: $rootScope.widget_uid
            });
        }
        checkTrigger($rootScope.c.TRIGGER_EVENT_VISIT_PAGE, { current_url: current_url });
        // Сохраняем URL
        localStorage.setItem('url.'+$rootScope.widget_uid, current_url);

    }

    /**
     * Прокрутка чата вниз
     */
    function scrollToBottom() {
        //$('#dialogue').animate({'scrollTop': $('#dialogue .content').height()}, 200);
        angular.element('#dialogue').animate({'scrollTop': angular.element('#dialogue .content').height()}, 200);
    }

    /**
     * Анимация блока авторизации
     */
    function chatAuthAnimation() {
        //$('#auth')
        angular.element('#auth')
            .delay(500)
            .animate({left: "0px"}, 100)
            .animate({left: "18px"}, 100)
            .animate({left: "9px"}, 100)
    }

    /**
     * Анимиция виджета
     */
    function widgetBell() {
        //$('#container')
        angular.element('#container')
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
        //$('#dialogue .msg-content-arrow')
        angular.element('#dialogue .msg-content-arrow')
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

        // Записываем сообщения в хранилище
        localStorage.setItem('messages.'+$rootScope.widget_uid, JSON.stringify($scope.chat.messages));

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
            message: message,
            chat: $scope.chat,
            widget_uid: $rootScope.widget_uid
        });

        // Добавляем сообщение в список сообщений
        $scope.chat.messages.push(message);

        // Записываем сообщения в хранилище
        localStorage.setItem('messages.'+$rootScope.widget_uid, JSON.stringify($scope.chat.messages));

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
    $scope.$on('$locationChangeStart', function() {
        $log.debug('AngularJS $locationChangeStart');

        socket.emit('chat:page:change', {
            chat_uid: $scope.chat.uid,
            widget_uid: $rootScope.widget_uid
        });
    });

    /**
     * Проверка открытости чата
     */
    $scope.isOpened = function() {
        var opened = localStorage.getItem('opened.'+$rootScope.widget_uid);
        return opened == 'true';
    };

    /**
     * Проверка статуса авторизации
     */
    $scope.isAuth = function() {
        return localStorage.getItem('auth.'+$rootScope.widget_uid);
    };

    /**
     * Отправка сообщения
     */
    $scope.sendMessage = function() {
        // Если виджет не открыт, тогда открываем его
        if (!$scope.isOpened()) {
            $scope.open();
        }

        // Блокируем отправку пустых сообщений
        if ($scope.text.length == 0) {
            return false;
        }

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
            //$rootScope.setCookie('chat', $scope.chat);
            localStorage.setItem('chat.'+$rootScope.widget_uid, JSON.stringify($scope.chat));
        }
    };

    // Нажатие клавиш в поле ввода сообщения
    $scope.messageEdit = function(e) {
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
    };

    // Переключение режима виджета
    $scope.switching = function() {
        // Если виджет уже раскрыт, тогда сворачиваем его
        if (!$scope.isOpened()) {
            $scope.open();
        } else {
            $scope.close();
        }
    };

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
        //$rootScope.setCookie('opened', true);
        localStorage.setItem('opened.'+$rootScope.widget_uid, true);
        $scope.opened = true;

        //$('#content').slideToggle(300);
        angular.element('#content').slideToggle(300);

        window.parent.postMessage('opened', '*');

        // Разворачиваем область ввода сообщения
        //$('#message-input textarea').animate({height: '55px'});
    };

    // Сворачиваем виджет
    $scope.close = function() {
        // Обрабатываем триггер
        if ($scope.isOpened()) {
            checkTrigger($rootScope.c.TRIGGER_EVENT_CHAT_CLOSED);
        }

        // Запоминаем состояние чата
        //$rootScope.setCookie('opened', false);
        localStorage.setItem('opened.'+$rootScope.widget_uid, false);
        $scope.opened = false;

        //$('#content').slideToggle(300);
        angular.element('#content').slideToggle(300);

        // Анимация поля ввода сообщения
        //$('#message-input textarea').animate({height: '55px'});
        // Текст в поле
        //setTimeout("$('#message-input .message-input-content span').delay(1000);", 300);

        $scope.chat.opened = false;
        $scope.chat.status = $rootScope.CHAT_STATUS_ONLINE;
        localStorage.setItem('chat.'+$rootScope.widget_uid, JSON.stringify($scope.chat));
        window.parent.postMessage('closed', '*');
    };

    // Активируем поле ввода сообщения
    $scope.focus = function() {
        $scope.focused = true;
    };

    $scope.messageFocus = function() {
        $scope.focused = true;
        $scope.messagePlaceholder = '';
    };

    $scope.messageBlur = function() {
        $scope.focused = false;
    };

    // Авторизация
    $scope.authorization = function() {
        // Анимация формы авторизации
        //$('#auth').fadeOut(300);
        angular.element('#auth').fadeOut(300);
        $scope.chat.user = getUserInfo();
        getUserInfo(function(user_data) {
            $scope.chat.user = user_data;
            $scope.chat.user.first_name = $scope.user.first_name;
            $scope.chat.user.email = $scope.user.email;

            var chat = getChat();
            chat.user.first_name = $scope.user.first_name;
            chat.user.email = $scope.user.email;

            //$rootScope.setCookie('chat', chat);
            localStorage.setItem('chat.'+$rootScope.widget_uid, JSON.stringify(chat));

            $scope.auth = true;
            //$rootScope.setCookie('auth', true);
            localStorage.setItem('auth.'+$rootScope.widget_uid, true);

            socket.emit('chat:user:auth', {
                user: $scope.user,
                chat_uid: $scope.chat.uid,
                widget_uid: $rootScope.widget_uid
            });
        });
    };

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
        $log.debug('Socket chat:agent:enter');

        // Фильтруем лишнее
        if ($scope.chat.uid == data.chat.uid) {
            // Если виджет не открыт, тогда открываем его
            if (!$scope.isOpened()) {
                $scope.open();
            }

            if (data.agent.first_name) {
                data.agent.first_name = decodeURIComponent(data.agent.first_name);
            } else {
                data.agent.first_name = '';
            }

            if (data.agent.last_name) {
                data.agent.last_name = decodeURIComponent(data.agent.last_name);
            } else {
                data.agent.last_name = '';
            }

            if (data.agent.last_name) {
                data.agent.job_title = decodeURIComponent(data.agent.job_title);
            } else {
                data.agent.job_title = '';
            }

            // Заполняем переменную agent в $scope
            $scope.agent = data.agent;

            $scope.chat.agent = data.agent;
            $scope.chat.status = $rootScope.c.CHAT_STATUS_CHATTING;

            //$rootScope.setCookie('chat', $scope.chat);
            localStorage.setItem('chat.'+$rootScope.widget_uid, JSON.stringify($scope.chat));
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
        $log.debug('Socket chat:agent:leave');

        // Фильтруем лишнее
        if ($scope.chat.uid == data.chat_uid) {
            // Обнуляем переменную agent
            delete $scope.agent;

            delete $scope.chat.agent;
            //$scope.chat.status = $rootScope.c.CHAT_STATUS_ONLINE;

            localStorage.setItem('chat.'+$rootScope.widget_uid, JSON.stringify($scope.chat));

            var message = {
                created_at: (+new Date) / 1000,
                readed: true,
                sender_type: $rootScope.c.MESSAGE_SENDER_TYPE_ROBOT_TO_USER,
                text: $translate('Agent leave chat')
            };

            socket.emit('chat:message:send:robot', {
                message: message,
                chat_uid: $scope.chat.uid,
                widget_uid: $rootScope.widget_uid
            });
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
        $log.debug('Socket chat:message:send:agent');

        // Убираем лишние
        if (data.chat_uid == $scope.chat.uid) {
            chatMessageSendAgent(data);
        }
    });

    /**
     * Пришел список агентов в сети
     * @param Object data = {
     *       array agents_uid
     *       string widget_uid
     *   }
     */
    socket.on('agent:online:list', function (data) {
        $log.debug('Socket agent:online:list', data);

        $scope.agent_count = data.agents_uids.length;
    });

    /**
     * Агент подключился
     * @param Object data = {
     *       string agent_uid
     *       string widget_uid
     *   }
     */
    socket.on('agent:connected', function (data) {
        $log.debug('Socket agent:connected');

        $scope.agent_count++;
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
        $log.debug('Socket chat:message:sended:agent');

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
     * Робот прислал сообщение
     * @param Object data = {
     *       Object message
     *       string chat_uid
     *       string widget_uid
     *   }
     */
    socket.on('chat:message:sended:robot', function (data) {
        $log.debug('Socket chat:message:sended:robot');

        // Убираем лишние
        if (data.chat_uid == $scope.chat.uid) {
            // @todo использовать метод
            // Добавляем сообщение в список сообщений
            $scope.chat.messages.push(data.message);

            // Записываем сообщения в хранилище
            localStorage.setItem('messages.'+$rootScope.widget_uid, JSON.stringify($scope.chat.messages));

            // Записываем чат в хранилище
            localStorage.setItem('chat.'+$rootScope.widget_uid, JSON.stringify($scope.chat));

            // Пролистываем до последнего сообщения
            scrollToBottom();
        }
    });

    /**
     * Пришла информация о виджете
     * @param Object data
     */
    socket.on('widget:info:sended', function (data) {
        $log.debug('Socket widget:info:sended', data);

        window.parent.postMessage('started', '*');

        $scope.triggers = {};

        if (data.triggers) {
            var triggers = $filter('orderBy')(data.triggers, 'priority', false);
            _.each(triggers, function(trigger) {
                $scope.triggers[trigger.event] = trigger;
            });
        }

        $scope.settings = data.settings;
        if (data.settings && data.settings.language && data.settings.language != 'auto') {
            $rootScope.lang = data.settings.language;
            $translate.uses(data.settings.language);
        }

        if (data.settings && data.settings.explanatory_message) {
            $scope.messagePlaceholder = data.settings.explanatory_message;
        }

        // Отображаем виджет
        widgetShow();

        // Проверяем триггер
        checkTrigger($rootScope.c.TRIGGER_EVENT_TIME_ONE_PAGE);

        // Прокручиваем виджет к последнему сообщению
        scrollToBottom();
    });

    /**
     * Чат был закрыт
     * @param Object data = {
     *    string chat_uid
     *    string widget_uid
     * }
     */
    socket.on('chat:closed', function (data) {
        $log.debug('Socket chat:closed');

        // Отсеиваем чужие
        if($scope.chat.uid == data.chat_uid) {
            delete $scope.agent;
            delete $scope.chat.agent;

            $scope.chat.closed = true;
            $scope.chat.status = $rootScope.c.CHAT_STATUS_ONLINE;

            localStorage.setItem('chat.'+$rootScope.widget_uid, JSON.stringify(data.chat));

            var message = {
                created_at: (+new Date) / 1000,
                readed: true,
                sender_type: $rootScope.c.MESSAGE_SENDER_TYPE_ROBOT_TO_USER,
                text: $translate('Agent ended dialogue')
            };

            socket.emit('chat:message:send:robot', {
                message: message,
                chat_uid: $scope.chat.uid,
                widget_uid: $rootScope.widget_uid
            });
        }
    });

    /**
     * Агент вышел
     * @param Object data = {
     *    string agent_uid
     *    string widget_uid
     * }
     */
    socket.on('agent:disconnected', function (data) {
        $log.debug('Socket agent:disconnected');

        $scope.agent_count--;

        // Отсеиваем чужие
        if($scope.agent && $scope.agent.uid == data.agent_uid) {
            delete $scope.agent;
            delete $scope.chat.agent;

            var message = {
                created_at: (+new Date) / 1000,
                readed: true,
                sender_type: $rootScope.c.MESSAGE_SENDER_TYPE_ROBOT_TO_USER,
                text: $translate('Agent offline')
            };

            socket.emit('chat:message:send:robot', {
                message: message,
                chat_uid: $scope.chat.uid,
                widget_uid: $rootScope.widget_uid
            });
        }
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
            $log.debug('Socket chat:created');

            // Проверяем триггер
            checkTrigger($rootScope.c.TRIGGER_EVENT_WIDGET_CREATED);

            // Оповещаем о подключении чата
            socket.emit('chat:connected', {
                chat_uid: data.chat.uid
            });
            // Заполняем переменную чат
            $scope.chat = data.chat;
            // Добавляем чат в cookie
            //$rootScope.setCookie('chat', data.chat)
            localStorage.setItem('chat.'+$rootScope.widget_uid, JSON.stringify(data.chat));
            // Заполняем переменную сообщения чата
            $scope.chat.messages = [];
            // Запрашиваем информацию о виджете
            getWidgetInfo();
            // Добавляем статус чата в cookie (закрыт)
            //$rootScope.setCookie('opened', false);
            localStorage.setItem('opened.'+$rootScope.widget_uid, false);
            $scope.opened = false;
            // Добавляем статус авторизации в cookie (не авторизирован)
            //$rootScope.setCookie('auth', false);
            localStorage.setItem('auth.'+$rootScope.widget_uid, false);
            $scope.auth = false;
            // Сворачиваем виджет
            //$('#content').hide();
            angular.element('#content').hide();

            checkUrl();
        });
    } else {
        // Заполняем переменную агент
        $scope.agent = $scope.chat.agent;

        // Получаем текущий URL чата
        $scope.chat.current_url = $document[0].referrer;
        // Оповещаем о подключении чата
        socket.emit('chat:connect', {
            chat:       $scope.chat,
            widget_uid: $rootScope.widget_uid
        });

        // Заполняем статус авторизации
        $scope.auth = $scope.isAuth();

        // Если виджет был развернут до обновления страницы, тогда раскрываем его
        if ($scope.isOpened() != false) {
            $scope.open();
        } else {
            angular.element('#content').hide();
        }

        // Запрашиваем информацию о виджете
        getWidgetInfo();

        checkUrl();
    }

    $document.ready(function() {
        angular.element('#header').slideDown(350);

        var onmessage = function (e) {
            $log.debug('onmessage');

            try {
                var data = JSON.parse(e.data);

                if (data.referrer) {
                    // Оповещаем о referrer
                    socket.emit('chat:referrer:change', {
                        referrer: data.referrer,
                        chat_uid: $scope.chat.uid,
                        widget_uid: $rootScope.widget_uid
                    });
                }
            } catch (e) {
                $log.debug(e);
            }
        };

        if (typeof window.addEventListener != 'undefined') {
            window.addEventListener('message', onmessage, false);
        } else if (typeof window.attachEvent != 'undefined') {
            window.attachEvent('onmessage', onmessage);
        }

        // Запрашиваем список агентов в сети
        socket.emit('agent:online', {
            widget_uid: $rootScope.widget_uid
        });
    });
}