(function(document) {
    /* REGIDIUM */
    REGIDIUM_ONLINE = true;

    var t = 0;

    function createWidget(config) {
        var Util = {
            extendObject: function (a, b) {
                for (prop in b) {
                    a[prop] = b[prop];
                }
                return a;
            },
            proto: 'https:' == document.location.protocol ? 'https://' : 'http://'
        };

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
                var self = this;
                if (self.created) {
                    return cb(self.widgetElement);
                }

                // Создаем элемент блока виджета
                self.widgetElement = document.createElement('div');
                self.widgetElement.style.display = 'none';
                // Стилизуем блок виджета
                self.widgetElement.style.position = 'fixed';
                self.widgetElement.style.bottom = options.bottom;
                self.widgetElement.style.right = options.right;
                self.widgetElement.style.minHeight = '35px';
                self.widgetElement.style.maxHeight = '404px';
                self.widgetElement.style.width = '318px';
                self.widgetElement.style.overflow = 'hidden';
                self.widgetElement.style.zIndex = '2147483646';
                self.widgetElement.setAttribute('id', options.widget_class);
                self.widgetElement.setAttribute('class', options.widget_class);
                self.widgetElement.setAttribute('allowtransparency', true);

                t = (new Date()).getTime();

                // Создаем элемент iframe виджета
                self.iframeElement = document.createElement('iframe');
                self.iframeElement.setAttribute('id', 'regidium_widget_iframe_' + t);
                self.iframeElement.setAttribute('src', 'about:blank');
                self.iframeElement.setAttribute('scrolling', 'no');
                self.iframeElement.setAttribute('frameborder', '0');
                self.iframeElement.setAttribute('allowTransparency', 'true');
                self.iframeElement.style.backgroundColor = 'transparent';
                self.iframeElement.style.width = options.width;
                self.iframeElement.style.height = options.height;
                self.iframeElement.style.bottom = 0;
                self.iframeElement.style.position = 'absolute';

                // Подключаем iframe к блоку виджета
                self.widgetElement.appendChild(self.iframeElement);

                // Подключаем блок виджета к странице
                document.body.insertBefore(self.widgetElement, document.body.nextSibling);

                window.onload = function () {
                    // Подключаем iframe к блоку виджета
                    this.iframeElement = document.getElementById('regidium_widget_iframe_' + t);
                    this.iframeElement.setAttribute('src', options.widget_url);
                    this.iframeElement.setAttribute('referrer', parent.document.referrer);
                };
            },
            show: function () {
                this.created = true;
                this.widgetElement.style.display = 'block';
            }
        };

        Widget.create();
    }

    // Создаем виджет
    createWidget(widgetOptions);

    var onmessage = function (e) {
        var data = e.data;
        var origin = e.origin;

        if (data == 'started') {
            Widget.show();
            var widget = document.getElementById('regidium_widget_iframe_' + t);
            widget.contentWindow.postMessage(JSON.stringify({referrer: widget.getAttribute('referrer')}), '*');
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