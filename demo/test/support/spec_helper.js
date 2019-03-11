exports.dropSync = function (models) {
    if (!Array.isArray(models)) {
        models = [models];
    }

    models.forEach(function (item) {
        item.dropSync();
        item.syncSync();
    });
};