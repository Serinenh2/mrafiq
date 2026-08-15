"""Champ de texte chiffré au repos (§26).

Utilise Fernet (AES-128-CBC + HMAC). La clé provient de FIELD_ENCRYPTION_KEY
(voir settings.py) ; en développement elle est dérivée de SECRET_KEY si non
définie. Tolère la lecture de données pré-existantes en clair (bascule
progressive, sans migration de données à effectuer sur les valeurs existantes).
"""
import base64
import hashlib
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.db import models


def _fernet():
    key = getattr(settings, 'FIELD_ENCRYPTION_KEY', None)
    if not key:
        key = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode()).digest())
    return Fernet(key)


class EncryptedTextField(models.TextField):
    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        if not value:
            return value
        return _fernet().encrypt(value.encode()).decode()

    def from_db_value(self, value, expression, connection):
        if not value:
            return value
        try:
            return _fernet().decrypt(value.encode()).decode()
        except (InvalidToken, ValueError):
            return value  # donnée pré-existante non chiffrée
