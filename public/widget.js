(function(document) {
    /* REGIDIUM */
    REGIDIUM_ONLINE = true;

    function createWidget(config) {
        var Util = {
            extendObject: function (a, b) {
                for (prop in b) {
                    a[prop] = b[prop];
                }
                return a;
            },
            proto: 'https:' == document.location.protocol ? 'https://' : 'http://'
        }

        var options = Util.extendObject({
            uid: 0,
            height: '100%',
            width: '100%',
            bottom: '0',
            right: '30px',
            domain: 'widget.regidium.com',
            widget_class: 'regidium_widget_container'
        }, config);
        // Заполняем параметры
        options.widget_url = [Util.proto, options.domain, '/', options.uid].join('');

        Widget = {
            created: false,
            widgetElement: null,
            create: function (cb) {
                if (this.created) {
                    return cb(this.widgetElement);
                }

                // Создаем элемент блока виджета
                this.widgetElement = document.createElement('div');
                this.widgetElement.style.display = 'none';
                // Стилизуем блок виджета
                this.widgetElement.style.position = 'fixed';
                this.widgetElement.style.bottom = options.bottom;
                this.widgetElement.style.right = options.right;
                this.widgetElement.style.minHeight = '35px';
                this.widgetElement.style.maxHeight = '404px';
                this.widgetElement.style.width = '318px';
                this.widgetElement.style.overflow = 'hidden';
                this.widgetElement.style.zIndex = '2147483646';
                this.widgetElement.setAttribute('id', options.widget_class);
                this.widgetElement.setAttribute('class', options.widget_class);
                this.widgetElement.setAttribute('allowtransparency', true);

                var t = (new Date()).getTime();

                // Создаем элемент iframe виджета
                this.iframeElement = document.createElement('iframe');
                this.iframeElement.setAttribute('id', 'regidium_widget_iframe_' + t);
                this.iframeElement.setAttribute('src', 'about:blank');
                this.iframeElement.setAttribute('scrolling', 'no');
                this.iframeElement.setAttribute('frameborder', '0');
                this.iframeElement.setAttribute('allowTransparency', 'true');
                this.iframeElement.style.backgroundColor = 'transparent';
                this.iframeElement.style.width = options.width;
                this.iframeElement.style.height = options.height;
                this.iframeElement.style.bottom = 0;
                this.iframeElement.style.position = 'absolute';

                // Подключаем iframe к блоку виджета
                this.widgetElement.appendChild(this.iframeElement);

                // Подключаем блок виджета к странице
                document.body.insertBefore(this.widgetElement, document.body.nextSibling);

                window.onload = function () {
                    // Подключаем iframe к блоку виджета
                    this.iframeElement = document.getElementById('regidium_widget_iframe_' + t);
                    this.iframeElement.setAttribute('src', options.widget_url);
                    this.iframeElement.onload = function () {
                        //Widget.show();
                    };
                };
            },
            show: function () {
                this.created = true;
                this.widgetElement.style.display = 'block';
            }
        }

        Widget.create();
    }

    // Создаем виджет
    createWidget(widgetOptions);

    var onmessage = function (e) {
        var data = e.data;
        var origin = e.origin;

// @todo security
//        if (origin !== 'http://my.regidium.com') {
//            return;
//        }


        if (data == 'started') {
            Widget.show();
        } else if (data == 'opened') {
            Widget.widgetElement.style.height = '100%';
        } else if (data == 'closed') {
            setTimeout(function() {
                Widget.widgetElement.style.removeProperty('height');
            }, 300)
        }
    };

    if (typeof window.addEventListener != 'undefined') {
        window.addEventListener('message', onmessage, false);
    } else if (typeof window.attachEvent != 'undefined') {
        window.attachEvent('onmessage', onmessage);
    }

})(document);