class CensusRouter:
    """Route all census app queries to the dedicated census database."""

    def db_for_read(self, model, **hints):
        if model._meta.app_label == 'census':
            return 'census'
        return None

    def db_for_write(self, model, **hints):
        # Census DB is read-only
        return None

    def allow_relation(self, obj1, obj2, **hints):
        return None

    def allow_migrate(self, db, app_label, **hints):
        if app_label == 'census':
            return False
        return None
