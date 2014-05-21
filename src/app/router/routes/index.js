module.exports.index = function (req, res) {
    /** @todo Проверять доступность создания виджета (widget_uid + origin) */

    // Устанавливаем UID виджета в cookie
    if (req.params && req.params.widget_uid) {
        /** @todo Нужно ли? */
        res.cookie('uid', JSON.stringify(req.params.widget_uid), {
            path: '/' + req.params.widget_uid
        });
    }

    return res.render('main/index');
};