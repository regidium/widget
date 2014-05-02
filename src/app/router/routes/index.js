module.exports.index = function (req, res) {
    /** @todo Проверять доступность создания виджета (widget_uid + origin) */

    // Устанавливаем UID виджета в cookie
    if (req.params && req.params.widget_uid) {
        // if (!res.cookie.chat) {
        //     res.cookie('chat', JSON.stringify({}), {
        //         path: '/' + req.params.widget_uid
        //     });
        // }
        // if (!res.cookie.url) {
        //     res.cookie('url', JSON.stringify(''), {
        //         path: '/' + req.params.widget_uid
        //     });
        // }
        // if (res.cookie.opened) {
        //     res.cookie('opened', JSON.stringify(false), {
        //         path: '/' + req.params.widget_uid
        //     });
        // }
        // if (res.cookie.auth) {
        //     res.cookie('auth', JSON.stringify(false), {
        //         path: '/' + req.params.widget_uid
        //     });
        // }

        res.cookie('widget_uid', JSON.stringify(req.params.widget_uid), {
            path: '/' + req.params.widget_uid
        });
    }

    return res.render('main/index');
};