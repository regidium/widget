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
        domain: 'widget.regidium.com',
        class: 'regidium_widget_container'
    }, config);

    options.widget_url = [Util.proto, options.domain, '/?', 'id=', options.id].join('');
    options.widget_url += '#' + encodeURIComponent(document.location.href);

    Widget = {
        created: false,
        widgetElement: null,
        create: function() {
            if (this.created) {
                return;
            }

            this.widgetElement = document.createElement('div');
            this.widgetElement.style.display = 'none';
            this.widgetElement.style.position = 'absolute';
            this.widgetElement.style.minHeight = '186px';
            this.widgetElement.style.maxHeight = '450px';
            this.widgetElement.style.height = '100%';
            this.widgetElement.style.width = '312px';
            this.widgetElement.style.top = '0';
            this.widgetElement.style.right = '0';
            this.widgetElement.style.zIndex = '2147483646';
            this.widgetElement.setAttribute('id', options.class);
            this.widgetElement.setAttribute('class', options.class);
            this.widgetElement.innerHTML = '<iframe id="regidium_widget_iframe" src="' + options.widget_url + '" scrolling="no" width="'+options.width+'" height="'+options.height+'" frameborder="0"></iframe>';

            document.body.insertBefore(this.widgetElement, document.body.nextSibling);
            this.created = true;
            this.show();
        },
        show: function() {
            this.widgetElement.style.display = 'block';
        },
        hide: function() {
            /** @todo */
        }
    }

    Widget.create();
}

createWidget(widgetOptions);