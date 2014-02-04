'use strict';

function security($cookieStore) {
    var person = $cookieStore.get('person');
    if (person) {
        person.fullname = decodeURIComponent(person.fullname);
        return person;
    }
    return false;
}

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

function registration($rootScope, $cookieStore, Widgets, cb) {
    // Получаем данные пользователя
    var data = {};
    data.fullname = 'Client';
    data.device = UAParser('').device.model + ' ' + UAParser('').device.vendor;
    data.os = UAParser('').os.name;
    data.browser = UAParser('').browser.name + ' ' + UAParser('').browser.version;
    data.language = $rootScope.lang;

    // Сохраняем пользователя
    Widgets.saveUser({ uid: $cookieStore.get('uid'), user: 'new' }, function(data) {
        /** @todo Обработать ошибку */
        if (data && data.error) {
            cb(null);
        } else {
            /** @todo Отдавать с сервера только необходимое */
            delete(data.auths);
            if (data.user) {
                if (data.user.chats) {
                    delete(data.user.chats);
                }
                delete(data.user.widget);
            }
            $cookieStore.put('person', data);
            cb(data);
        }
    });
}

function autorization($scope, $cookieStore, socket, Widgets) {
    var widget_uid = $cookieStore.get('uid');
    var data = {
        person: $scope.person,
        widget: widget_uid
    };
    socket.emit('user:connected', data);
    // Создаем чат если он не найден в cookie
    if (!$scope.chat) {
        $scope.chat = Widgets.createChat({ uid: widget_uid, user: $scope.person.user.uid }, function(data) {
            // Оповещаем о создании чата
            $cookieStore.put('chat', data);
            console.log('chat:created', $scope.chat);
            socket.emit('chat:created', {
                widget: widget_uid,
                user: $scope.person,
                chat: $scope.chat
            });

            /** Постетитель меняет страницу */
            $scope.$on('$locationChangeStart', function(event) {
                console.log('$locationChangeStart', $scope.person.user);
                socket.emit('user:refreshed', {
                    uid: $scope.person.user.uid
                });
                socket.emit('chat:destroyed', {
                    widget: widget_uid,
                    uid: $scope.chat.uid
                });
            });
        });
    } else {
        socket.emit('chat:started', {
            widget: widget_uid,
            user: $scope.person,
            chat: $scope.chat
        });
    }
    //$scope.chat.messages = JSON.parse(sessionStorage.getItem('messages'));
    $scope.chat.messages = JSON.parse(sessionStorage.getItem('messages'));
    if (!$scope.chat.messages) {
        $scope.chat.messages = [];
    }
}

/**
 * @url "/widget"
 * @todo REFACTORING!!!!
 * @todo Сохранять чат в cookie
 * @todo Сохранять пользователя в cookie
 */
function MainCtrl($rootScope, $scope, $cookieStore, socket, Widgets) {
    // Ищем пользователя в cookie
    var widget_uid = $cookieStore.get('uid');
    $scope.person = security($cookieStore);
    // Ищем чат в cookie
    $scope.chat = $cookieStore.get('chat');
    if ($scope.chat) {
        $scope.chat.messages = [];
    }

    // Получаем статус открытости виджета
    var opened = $cookieStore.get('opened');

    // Подключаем аудио файл для звукового оповещания
    var sound = getSound();

    // Очищаем поле ввода сообщения
    $scope.text = '';

    // Создаем пользователя если он не найден в cookie
    if (!$scope.person) {
        registration($rootScope, $cookieStore, Widgets, function(person) {
            $scope.person = person;

            // Авторизируем пользователя
            autorization($scope, $cookieStore, socket, Widgets);
/*            var data = {
                person: $scope.person,
                widget: widget_uid
            };
            socket.emit('user:connected', data);

            // Создаем чат если он не найден в cookie
            $scope.chat = Widgets.createChat({ uid: widget_uid, user: $scope.person.user.uid }, function(data) {
                *//** @todo Отдевать с сервера только нужное *//*
                var chat_data = {
                    uid: data.uid,
                    user_status: data.user_status,
                    operator_status: data.operator_status
                };
                // Сохраняем данные чата в cookie
                $cookieStore.put('chat', chat_data);
                // Оповещаем о создании чата
                socket.emit('chat:created', {
                    widget: widget_uid,
                    user: $scope.person.user,
                    chat: $scope.chat
                });

                *//** Постетитель меняет страницу *//*
                $scope.$on('$locationChangeStart', function(event) {
                    console.log('$locationChangeStart', $scope.person.user);
                    socket.emit('user:refreshed', {
                        uid: $scope.person.user.uid
                    });
                    socket.emit('chat:destroyed', {
                        widget: widget_uid,
                        chat: $scope.chat.uid
                    });
                });
            });

            $scope.chat.messages = JSON.parse(sessionStorage.getItem('messages'));
            if (!$scope.chat.messages) {
                $scope.chat.messages = [];
            }*/
        });
    } else {
        // Авторизируем пользователя
        autorization($scope, $cookieStore, socket, Widgets);
    }

    socket.on('chat:agent:enter', function (data) {
        console.log('chat:agent:enter', data);
        $scope.agent = data.agent;
    });

    // Агент прислал сообщение
    socket.on('chat:agent:message:send', function (data) {
        console.log('chat:agent:message:send', data);
        // Воспроизводим звуковое оповещение
        sound.play();

        // Добавляем сообщение в список сообщений
        $scope.chat.messages.push({
            date: data.date,
            sender: data.sender,
            text: data.text
        });

        // Пролистываем до последнего сообщения
        scroll_to_bottom();
    });

    // нажатие клавиш в поле ввода сообщения
    $scope.enter = function(evt) {
        // Получаем событие нажатия
        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        // Если был нажат ENTER
        if (charCode == 13) {
            //evt.returnValue = false;
            // Если виджет не открыт, тогда открываем его
            if (!opened) {
                $cookieStore.put('opened', true);
                $scope.open();
            }
            // Не отправляем пустое сообщение
            if ($scope.text.length == 0) {
                return false;
            };

            var message_data = {
                date: new Date(),
                sender: $scope.person.user,
                text: $scope.text
            };

            var message_data_emit = message_data;
            message_data_emit.widget = widget_uid;
            message_data_emit.chat = $scope.chat.uid;

            // Сохраняем сообщение в БД
            Widgets.createChatMessage({}, { uid: widget_uid, chat: $scope.chat.uid, sender: $scope.person.uid, text: $scope.text }, function(data) {
                // Оповещаем об отпраке сообщения
                socket.emit('chat:user:message:send', message_data_emit);
            });

            // Добавляем сообщение в список сообщений
            $scope.chat.messages.push(message_data);

            // Записываем сообщения в сессию
            sessionStorage.setItem('messages', JSON.stringify($scope.chat.messages));

            // Очищаем поле ввода сообщения
            $scope.text = '';
            // Пролистываем до посдеднего сообщения
            scroll_to_bottom();
        }
    }

    // Раскрытие виджета
    $scope.switch = function() {
        // Если виджет раскрыт, тогда сворачиваем его
        if (opened) {
            $scope.close();
        } else {
            $scope.open();
        }

        // Копирайт
        $('#copyright .copyright-content').slideToggle(300);
    }

    // Разворачиваем видежт
    $scope.open = function() {
        $('#dialogue').slideToggle(300);
        $('#message-input').toggleClass('full');

        // Анимация поля для ввода сообщения
        $('#message-input textarea').animate({height: '55px'});
        // Текст в поле
        setTimeout("$('#message-input .message-input-content span').delay(1000).text('Напишите сообщение и нажмите Enter, чтобы его отправить');", 300);

        $cookieStore.put('opened', true);
    }

    // Сворачиваем видежт
    $scope.close = function() {
        $('#dialogue').slideToggle(300);
        $('#message-input').toggleClass('full');

        $('#message-input textarea').animate({height: '15px'});
        $('#message-input .message-input-content span').text('Напишите сообщение и нажмите Enter');

        $cookieStore.put('opened', false);
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
        if (opened) {
            $scope.open();
            // Прокручиваем виджет к последнему сообщению
            scroll_to_bottom();
        }
    })
}