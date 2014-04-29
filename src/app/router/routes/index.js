module.exports.index = function (req, res) {
    /** @todo Проверять доступность создания виджета (widget_uid + origin) */
    // Устанавливаем UID виджета в cookie
    if (typeof res.cookie.widget_uid === 'undefined' && req.params.widget_uid) {
        res.cookie('widget_uid', JSON.stringify(req.params.widget_uid));
    }

    return res.render('main/index');
};