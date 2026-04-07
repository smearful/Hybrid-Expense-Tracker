class DatabaseRouter:
    NOSQL_MODELS = {
        'object',
        'note',
        'screenshot'
    }

    def db_for_read(self, model, **hints):
        if model._meta.model_name in self.NOSQL_MODELS:
            return 'mongodb'
        return 'default'

    def db_for_write(self, model, **hints):
        if model._meta.model_name in self.NOSQL_MODELS:
            return 'mongodb'
        return 'default'
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if model_name in self.NOSQL_MODELS:
            return db == 'mongodb'
        return db == 'default'