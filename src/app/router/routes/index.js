module.exports.index = function (req, res) {
    /** @todo Проверять доступность создания виджета (uid + url) */
    // Устанавливаем UID виджета в cookie
    if (typeof res.cookie.uid === 'undefined' && req.params.uid) {
        res.cookie('uid', JSON.stringify(req.params.uid));
    }

    return res.render('main/index');
};