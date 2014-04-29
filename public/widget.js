(function(document) {
    /* REGIDIUM */
    REGIDIUM_ONLINE = true;

    function createWidget(config) {
        var Util = {
            extendObject: function(a, b) {
                for(prop in b){
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
        //options.widget_url += '#' + encodeURIComponent(document.location.href);

        Widget = {
            created: false,
            widgetElement: null,
            create: function(cb) {
                if (this.created) {
                    return cb(this.widgetElement);
                }

                // Создаем элемент блока виджета
                this.widgetElement = document.createElement('div');
                // Скрываем блок виджета
                this.widgetElement.style.display = 'none';
                // Стилизуем блок виджета
                this.widgetElement.style.position = 'fixed';
                this.widgetElement.style.minHeight = '35px';
                this.widgetElement.style.maxHeight = '404px';
                this.widgetElement.style.height = '100%';
                this.widgetElement.style.width = '318px';
                this.widgetElement.style.bottom = options.bottom;
                this.widgetElement.style.right = options.right;
                this.widgetElement.style.overflow = 'hidden';
                this.widgetElement.style.zIndex = '2147483646';
                this.widgetElement.setAttribute('id', options.widget_class);
                this.widgetElement.setAttribute('class', options.widget_class);

                // Создаем элемент iframe виджета
                var iframeElement = document.createElement('iframe');
                iframeElement.setAttribute('id', 'regidium_widget_iframe');
                iframeElement.setAttribute('src', 'about:blank');
                iframeElement.setAttribute('scrolling', 'no');
                iframeElement.style.width = options.width;
                iframeElement.style.height = options.height;
                iframeElement.setAttribute('frameborder', '0');
                // Подключаем iframe к блоку виджета
                this.widgetElement.appendChild(iframeElement);

                // Подключаем блок виджета к странице
                document.body.insertBefore(this.widgetElement, document.body.nextSibling);

                // Подключаем iframe к блоку виджета
                iframeElement = document.getElementById('regidium_widget_iframe');
                iframeElement.setAttribute('src', options.widget_url);

                this.created = true;

                // Показываем блок виджета
                Widget.show();
            },
            show: function() {
                this.widgetElement.style.display = 'block';
            }
        }

        Widget.create();
    }

    // Создаем виджет
    createWidget(widgetOptions);
})(document);
