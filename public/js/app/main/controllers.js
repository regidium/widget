'use strict';

/**
 * @url "/widget"
 * @todo REFACTORING!!!!
 */
function MainCtrl($scope, socket) {
    $scope.visitor = {};
    $scope.text = '';
    $scope.chat = {};
    /** @todo */
    $scope.chat.uid = socket.id;
    $scope.chat.messages = [];

    var sound = document.createElement('audio');
    sound.setAttribute('src', '/sound/chat/chat.mp3');

    socket.on('visitor:connected', function (visitor) {
        console.log('visitor:connected', visitor)
        $scope.visitor = visitor;
        $scope.chat.uid = visitor.uid;
        socket.emit('chat:created', {
            user: $scope.visitor,
            chat: $scope.chat
        });
    });

    /** Постетитель меняет страницу */
    $scope.$on('$locationChangeStart', function(event) {
        console.log('$locationChangeStart', $scope.visitor);
        socket.emit('visitor:refreshed', {
            uid: $scope.visitor.uid
        });
        socket.emit('chat:destroyed', {
            uid: $scope.chat.uid
        });
    });

    socket.on('chat:agent:enter', function (data) {
        console.log('chat:agent:enter', data);
        $scope.agent = data.agent;
    });

    socket.on('chat:agent:message:send', function (data) {
        sound.play();

        scroll_to_bottom(200);

        $scope.chat.messages.push({
            date: data.date,
            sender: data.sender,
            text: data.text
        });
    });

    function sendMessage() {
        if ($scope.text.length == 0) {
            return false;
        };

        var text = $scope.text;

        socket.emit('chat:visitor:message:send', {
            date: new Date(),
            chat: $scope.chat.uid,
            sender: $scope.visitor,
            text: text
        });

        $scope.chat.messages.push({
            date: new Date(),
            sender: $scope.visitor,
            text: text
        });

        // clear message box
        $scope.text = '';
    };

    $scope.enter = function(evt) {
        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if (charCode == 13) {
            evt.returnValue = false;
            if ($('#message-input').attr('class') != 'full'){
                chatSlide();
            }
            sendMessage();
            $('#message-input textarea').val('');
            scroll_to_bottom(200);
            //chatAuthAnimation();
        }
        return false;
    }

    function scroll_to_bottom(speed) {
        var height= $("#dialogue .content").height();
        $("#dialogue").animate({"scrollTop":height},speed);
    }

// Разворачивание формы
    function chatSlide(){
        $('#dialogue').slideToggle(300);
        $('#message-input').toggleClass('full');
        if ($('#message-input').attr('class') != 'full'){
            $('#message-input textarea').animate({height: '15px'});
            $('#message-input .message-input-content span').text('Напишите сообщение и нажмите Enter');
        }
        else {
            // Высота поля для ввода
            $('#message-input textarea').animate({height: '55px'});
            // Текст в поле
            setTimeout("$('#message-input .message-input-content span').delay(1000).text('Напишите сообщение и нажмите Enter, чтобы его отправить');", 300);
        }
        // Копирайт
        $('#copyright .copyright-content').slideToggle(300);
    }

// Авторизация
    function chatAuthAnimation(){
        $('#auth')
            .delay(500)
            .animate({left: "0px"}, 100)
            .animate({left: "18px"}, 100)
            .animate({left: "9px"}, 100)
    }
    function chatAuthReg(){
        $('#auth').fadeOut(300);
    }

    $(document).ready(function() {
        $('#header .status').click(function(){
            chatSlide();
        })
        $('#message-input .message-input-content span').click(function(){
            $(this).fadeOut(500);
            $('#message-input .message-input-content textarea').focus();
        })
    })
}