'use strict';

/**
 * Получение UID виджета из cookie
 * @param $cookieStore
 */
function getWidgetUid($cookieStore) {
    return $cookieStore.get('widget_uid');
}

/**
 * Получение данных персоны пользователя из cookie
 * @param $cookieStore
 */
function getPerson($cookieStore) {
    var person = $cookieStore.get('person');
    if (person) {
        person.fullname = decodeURIComponent(person.fullname);
        return person;
    }
    return false;
}

/**
 * Установка данных персоны пользователя в cookie
 * @param        $cookieStore
 * @param Object data
 */
function setPerson($cookieStore, data) {
    return $cookieStore.put('person', data);
}

/**
 * Получение данных чата из cookie
 * @param $cookieStore
 */
function getChat($cookieStore) {
    return $cookieStore.get('chat');
}

/**
 * Установка данных чата в cookie
 * @param $cookieStore
 * @param data
 */
function setChat($cookieStore, data) {
    return $cookieStore.put('chat', data);
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
 * Установка сообщений чата в sessionStorage
 * @param sessionStorage
 * @param messages
 */
function setMessages(sessionStorage, messages) {
    sessionStorage.setItem('messages', JSON.stringify(messages));
}

/**
 * Проверка открытости чата
 * @param $cookieStore
 */
function isOpened($cookieStore) {
    return $cookieStore.get('opened')
}

/**
 * Загрузка звука для уведомления
 */
function getSound() {
    var sound = document.createElement('audio');
    var types = {
        '/sound/chat/chat.ogg': 'audio/ogg; codecs="vorbis"',
        '/sound/chat/chat.wav': 'audio/wav; codecs="1"',
        '/sound/chat/chat.mp3': 'audio/mpeg;'
    };

    var audio_file = _.each(types, function(type, file) {
        var e = sound.canPlayType(type);
        if ('probably' === e || 'maybe' === e) {
            return file;
        }
    });

    if (audio_file) {
        sound.setAttribute('src', audio_file);
    }

    return sound;
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
 * Создание нового чата
 */
function createChat($rootScope, $http, $cookieStore, socket) {
    // Получаем UID виджета
    var widget_uid = getWidgetUid($cookieStore);
    // Создаем данные пользователя
    var user_data = {};
    user_data.fullname = 'Client';
    user_data.device = UAParser('').device.model + ' ' + UAParser('').device.vendor;
    user_data.os = UAParser('').os.name;
    user_data.browser = UAParser('').browser.name + ' ' + UAParser('').browser.version;
    user_data.language = $rootScope.lang;
    // Функция 
    user_data.country = geoip_country_name();
    user_data.city = geoip_city();
    // Определяем IP пользователя
    $http.jsonp('http://ipinfo.io/?callback=JSON_CALLBACK').success(function(data) {
        user_data.ip = data.ip;
    });

    // Оповещаем о необходимости создать чат и пользователя
    socket.emit('chat:create', {
        widget_uid: widget_uid,
        user_data: user_data
    });
}

/**
 * @url "/widget"
 */
function MainCtrl($rootScope, $scope, $http, $cookieStore, socket, sound, Widgets) {
    // Скрываем виджет
    widgetHide();
    // Получаем UID виджета
    var widget_uid = getWidgetUid($cookieStore);
    // Ищем чат в cookie
    var chat = getChat($cookieStore);
    // Заполняем переменную сообщений чата
    if (!chat) {
        chat = {};
    }

    chat.messages = getMessages(sessionStorage);
    if (!chat.messages) {
        chat.messages = [];
    }

    // Ищем персону пользователя в cookie
    var person = getPerson($cookieStore);

    // Получаем информацию о виджете
    Widgets.one({ uid: widget_uid }, function(data) {
        $scope.triggers = data.triggers;
        $scope.settings = data.settings;
    });

    // Резервируем в $scope переменную text
    $scope.text = '';

    if (!chat.uid || !person) {
        // Если чат или пользователь не найдены в cookie - создаем их
        createChat($rootScope, $http, $cookieStore, socket);

        /**
         * Ждем оповещания о создании чата
         * @param Object data = {
         *       Object personuser:disconnect
         *       Object chat
         *       string widget_uid
         *   }
         */
        socket.on('chat:created', function (data) {
            console.log('Socket chat:created');

            if ()

            // Оповещаем о подключении чата
            socket.emit('chat:connected', {
                chat_uid: data.chat.uid
            });
            // Заполняем переменную персона пользователь
            $scope.person = data.person;
            // Добавляем персону пользователя в cookie
            setPerson($cookieStore, data.person);
            // Заполняем переменную чат
            $scope.chat = data.chat;
            // Добавляем чат в cookie
            setChat($cookieStore, data.chat);
            $scope.chat.messages = [];
            // Отображаем виджет
            widgetShow();
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
        // Отображаем виджет
        widgetShow();
    }

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
            if (!isOpened($cookieStore)) {
                $scope.open();
            }

            // Заполняем переменную agent в $scope
            $scope.agent = data.person;
        }
    });

    /**
     * @todo Проверить необходиость
     * Пользователь меняет страницу
     */
    $scope.$on('$locationChangeStart', function(event) {
        console.log('AngularJS $locationChangeStart');

        // Если виджет не открыт, тогда открываем его
        if (!isOpened($cookieStore)) {
            $scope.open();
        }

        socket.emit('user:page:change', {
            person_uid: $scope.person.user.uid,
            chat_uid: $scope.chat.uid,
            widget_uid: widget_uid
        });
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
            // Воспроизводим звуковое оповещение
            sound.play();

            // Если виджет не открыт, тогда открываем его
            if (!isOpened($cookieStore)) {
                $scope.open();
            }

            // Добавляем сообщение в список сообщений
            $scope.chat.messages.push({
                date: data.date,
                person: data.person,
                text: data.text
            });

            // Записываем сообщения в сессию
            setMessages(sessionStorage, $scope.chat.messages);

            // Пролистываем до последнего сообщения
            scroll_to_bottom();
        }
    });

    // Нажатие клавиш в поле ввода сообщения
    $scope.enter = function(evt) {
        // Получаем событие нажатия
        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        // Если нажат ENTER
        if (charCode == 13) {
            // Блокируем всплытие
            event.preventDefault()
            // Если виджет не открыт, тогда открываем его
            if (!isOpened($cookieStore)) {
                $scope.open();
            }

            // Блокируем отправку пустых сообщений
            if ($scope.text.length == 0) {
                return false;
            };

            // Оповещаем об отправке сообщения
            socket.emit('chat:message:send:user', {
                widget_uid: widget_uid,
                chat_uid: $scope.chat.uid,
                person: $scope.person,
                date: new Date(),
                text: $scope.text
            });

            // Добавляем сообщение в список сообщений
            $scope.chat.messages.push({
                person: $scope.person,
                date: new Date(),
                text: $scope.text
            });

            // Записываем сообщения в сессию
            setMessages(sessionStorage, $scope.chat.messages);

            // Очищаем поле ввода сообщения
            $scope.text = '';

            // Пролистываем до посдеднего сообщения
            scroll_to_bottom();

            return false;
        }
    }

    /** @todo REFFACTORING!!! */

    // Раскрытие виджета
    $scope.switch = function() {
        // Если виджет раскрыт, тогда сворачиваем его
        if ($cookieStore.get('opened')) {
            $scope.close();
        } else {
            $scope.open();
        }

        // Копирайт
        $('#copyright .copyright-content').slideToggle(300);
    }

    // Разворачиваем виджет
    $scope.open = function() {
        $cookieStore.put('opened', true);
        $('#dialogue').slideToggle(300);
        $('#message-input').toggleClass('full');

        // Анимация поля для ввода сообщения
        $('#message-input textarea').animate({height: '55px'});
        // Текст в поле
        setTimeout("$('#message-input .message-input-content span').delay(1000).text('Напишите сообщение и нажмите Enter, чтобы его отправить');", 300);
    }

    // Сворачиваем виджет
    $scope.close = function() {
        $cookieStore.put('opened', false);
        $('#dialogue').slideToggle(300);
        $('#message-input').toggleClass('full');

        $('#message-input textarea').animate({height: '15px'});
        $('#message-input .message-input-content span').text('Напишите сообщение и нажмите Enter');
    }

    // Активируем поле ввода сообщения
    $scope.focus = function() {
        $('#message-input .message-input-content span').fadeOut(500);
        $('#message-input .message-input-content textarea').focus();
    }

    // Прокрутка чата вниз
    function scroll_to_bottom() {
        $('#dialogue').animate({'scrollTop': $('#dialogue .content').height()}, 200);
    }

    $(document).ready(function() {
        // Если виджет был развернут до обновления страницы, тогда раскрываем его
        if ($cookieStore.get('opened')) {
            $scope.open();
            // Прокручиваем виджет к последнему сообщению
            scroll_to_bottom();
        }
    })

}