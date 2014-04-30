module.exports.index = function (req, res) {
    /** @todo Проверять доступность создания виджета (widget_uid + origin) */
    // Устанавливаем UID виджета в cookie
    if (req.params && req.params.widget_uid) {
        // Очищаем данные от других виджетов
        if (typeof res.cookie.widget_uid != 'undefined'){
            if (res.cookie.widget_uid != req.params.widget_uid) {
                res.cookie.chat = JSON.stringify({});
                res.cookie.url = JSON.stringify('');
                res.cookie.opened = JSON.stringify(false);
                res.cookie.auth = JSON.stringify(false);
            }
        }
        res.cookie('widget_uid', JSON.stringify(req.params.widget_uid));
    }

    return res.render('main/index');
};