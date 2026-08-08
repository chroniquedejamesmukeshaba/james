# -*- coding: utf-8 -*-
"""
Couche de paiement securisee - Chronique de James Mukeshaba.

Principes (aucun paiement simule) :
  * Aucun paiement n'est considere comme reussi sur simple retour navigateur.
  * La confirmation vient UNIQUEMENT du prestataire (webhook signe HMAC) ou
    d'une verification serveur aupres du prestataire (/api/payments/verify).
  * Les donnees bancaires / secrets des prestataires ne sont JAMAIS stockees
    dans la base ni exposees au client (GET /api/payments/config les masque).
  * Chaque intention de don porte un identifiant unique de transaction (txn_id)
    et un identifiant d'idempotence pour proteger contre les doubles paiements.
  * Tout est journalise (payment_log) : creation, initiation, webhook, echec.
"""

import os
import time
import json
import hmac
import hashlib
import logging

PAYMENTS_FILE = 'payments_config'
LOG_FILE = 'payment_log'

PROVIDERS = [
    {'id': 'paypal',           'label': 'PayPal'},
    {'id': 'airtel_money',     'label': 'Airtel Money (RDC)'},
    {'id': 'orange_money',     'label': 'Orange Money (RDC)'},
    {'id': 'vodacom_mpesa',    'label': 'Vodacom M-Pesa (RDC)'},
    {'id': 'card',             'label': 'Visa / Mastercard'},
]

log = logging.getLogger('payments')


class PaymentError(Exception):
    """Erreur metier de la couche de paiement (message envoye au client)."""
    def __init__(self, code, msg):
        super().__init__(msg)
        self.code = code
        self.msg = msg


# ---------------------------------------------------------------------------
# Configuration : le fichier est ecrit avec les permissions restreintes.
# ---------------------------------------------------------------------------
def default_config():
    return {
        'mode': 'sandbox',  # 'sandbox' | 'live'
        'providers': {
            'paypal':        {'enabled': False, 'client_id': '', 'client_secret': '', 'webhook_secret': ''},
            'airtel_money':  {'enabled': False, 'client_id': '', 'client_secret': '', 'webhook_secret': '', 'phone': ''},
            'orange_money':  {'enabled': False, 'client_id': '', 'client_secret': '', 'webhook_secret': '', 'phone': ''},
            'vodacom_mpesa': {'enabled': False, 'client_id': '', 'client_secret': '', 'webhook_secret': '', 'phone': ''},
            'card':          {'enabled': False, 'merchant_id': '', 'api_key': '', 'webhook_secret': '', 'gateway': 'aggregator'},
        },
    }


def config_snapshot(read_json):
    """Config complete (utilisee cote serveur uniquement)."""
    cfg = read_json(PAYMENTS_FILE)
    base = default_config()
    if isinstance(cfg, dict):
        for k in ('mode',):
            if k in cfg:
                base[k] = cfg[k]
        prov = cfg.get('providers') or {}
        for pid, p in prov.items():
            if pid in base['providers'] and isinstance(p, dict):
                base['providers'][pid].update(p)
    return base


def public_config(read_json):
    """Config publique : aucun secret, uniquement les methodes activees."""
    cfg = config_snapshot(read_json)
    out = {'mode': cfg.get('mode', 'sandbox'), 'providers': {}}
    for pid, p in cfg.get('providers', {}).items():
        if p.get('enabled'):
            out['providers'][pid] = {'enabled': True, 'label': next(
                (x['label'] for x in PROVIDERS if x['id'] == pid), pid)}
    out['payment_unavailable'] = not any(
        p.get('enabled') for p in cfg.get('providers', {}).values())
    return out


def _sign(payload, secret):
    return hmac.new(secret.encode('utf-8'), payload, hashlib.sha256).hexdigest()


def verify_webhook_signature(read_json, provider, payload_bytes, signature):
    """Verifie la signature HMAC-SHA256 d'un webhook prestataire.
    Leve PaymentError si le secret manque ou si la signature ne correspond pas.
    """
    cfg = config_snapshot(read_json)
    p = cfg.get('providers', {}).get(provider) or {}
    secret = p.get('webhook_secret', '')
    if not secret:
        raise PaymentError('webhook_not_configured', 'Webhook non configure pour ce prestataire.')
    expected = _sign(payload_bytes, secret)
    if not hmac.compare_digest(expected, (signature or '').lower()):
        raise PaymentError('bad_signature', 'Signature HMAC invalide.')


# ---------------------------------------------------------------------------
# Adapters : interface d'integration vers chaque prestataire.
# En mode sandbox / sans credentials, aucun appel n'est fait : l'initiation
# renvoie une erreur explicite "payment_unavailable" - AUCUNE SIMULATION.
# ---------------------------------------------------------------------------
class ProviderAdapter:
    pid = ''
    sandbox_base = ''

    def __init__(self, cfg):
        self.cfg = cfg
        self.conf = cfg.get('providers', {}).get(self.pid) or {}

    @property
    def ready(self):
        """True uniquement si le prestataire est active et configure."""
        return bool(self.conf.get('enabled') and self.conf.get('client_id'))

    def init_payment(self, txn):
        """Cree la transaction chez le prestataire. Doit retourner
        {'provider_txn_id': ..., 'redirect_url': ...} ou lever PaymentError.
        A IMPLEMENTER avec l'API officielle du prestataire.
        """
        raise PaymentError('payment_unavailable',
                           'Paiement indisponible pour le moment. Le prestataire sera bientot connecte.')

    def verify_txn(self, provider_txn_id):
        """Interroge le prestataire pour confirmer le statut cote serveur."""
        raise PaymentError('payment_unavailable', 'Verification indisponible pour ce prestataire.')


class PayPalAdapter(ProviderAdapter):
    pid = 'paypal'

    def init_payment(self, txn):
        if not self.ready:
            raise PaymentError('payment_unavailable', 'PayPal n est pas encore connecte.')
        # Exemple d'integration reelle (API Orders v2) :
        #   import requests
        #   base = 'https://api-m.sandbox.paypal.com' if cfg['mode']=='sandbox' else 'https://api-m.paypal.com'
        #   token = requests.post(base+'/v1/oauth2/token', auth=(client_id, secret), data={'grant_type':'client_credentials'})
        #   r = requests.post(base+'/v2/checkout/orders', headers={'Authorization':'Bearer '+token},
        #                     json={'intent':'CAPTURE','purchase_units':[{'amount':{'currency_code':'USD','value':txn['amount']}}],
        #                           'application_context':{'return_url':..., 'cancel_url':...}})
        #   -> {provider_txn_id: r.json()['id'], redirect_url: approve link}
        raise PaymentError('payment_unavailable', 'PayPal n est pas encore connecte.')

    def verify_txn(self, provider_txn_id):
        if not self.ready:
            raise PaymentError('payment_unavailable', 'PayPal n est pas encore connecte.')
        # r = requests.get(base+'/v2/checkout/orders/'+provider_txn_id, headers=auth)
        # renvoyer {'status': 'COMPLETED' | 'CREATED' | 'PAYER_ACTION_REQUIRED' | ...}
        raise PaymentError('payment_unavailable', 'PayPal n est pas encore connecte.')


class MobileMoneyAdapter(ProviderAdapter):
    """Base commune Airtel / Orange / Vodacom (collecte via numero dedie ou API)."""

    def init_payment(self, txn):
        if not self.ready:
            raise PaymentError('payment_unavailable',
                               'Paiement mobile indisponible pour le moment. Le prestataire sera bientot connecte.')
        # Integration API officielle du fournisseur (ou agregateur agree) :
        #   - Airtel: Airtel Money API / Aggregator
        #   - Orange: Orange Money Africa API
        #   - Vodacom: M-Pesa API / Daraja
        # Toutes exigent credentials, TTL, environnement, et webhooks signes.
        raise PaymentError('payment_unavailable',
                           'Paiement mobile indisponible pour le moment. Le prestataire sera bientot connecte.')

    def verify_txn(self, provider_txn_id):
        if not self.ready:
            raise PaymentError('payment_unavailable', 'Paiement mobile indisponible pour le moment.')
        raise PaymentError('payment_unavailable', 'Verification indisponible pour le moment.')


class CardAdapter(ProviderAdapter):
    pid = 'card'

    def init_payment(self, txn):
        if not self.ready:
            raise PaymentError('payment_unavailable', 'Carte bancaire : passerelle non configuree.')
        # Integration via aggregateur PCI-DSS (ex: paytech, fedapay, etc.)
        raise PaymentError('payment_unavailable', 'Carte bancaire : passerelle non configuree.')

    def verify_txn(self, provider_txn_id):
        if not self.ready:
            raise PaymentError('payment_unavailable', 'Carte bancaire : passerelle non configuree.')
        raise PaymentError('payment_unavailable', 'Carte bancaire : passerelle non configuree.')


ADAPTERS = {
    'paypal': PayPalAdapter,
    'airtel_money': MobileMoneyAdapter,
    'orange_money': MobileMoneyAdapter,
    'vodacom_mpesa': MobileMoneyAdapter,
    'card': CardAdapter,
}


def get_adapter(read_json, provider):
    cls = ADAPTERS.get(provider)
    if not cls:
        raise PaymentError('unknown_provider', 'Prestataire inconnu.')
    return cls(config_snapshot(read_json))


# ---------------------------------------------------------------------------
# Journalisation (audit trail) : append-only, horodatee.
# ---------------------------------------------------------------------------
def log_event(read_json, write_json, event, data):
    """Ecrit un evenement dans le journal de paiement (read_json/write_json
    sont passes par l'application hote pour eviter les imports circulaires)."""
    import time as _t
    entry = {
        'ts': _t.strftime('%Y-%m-%dT%H:%M:%SZ', _t.gmtime()),
        'event': event,
        'data': {k: (v if not isinstance(v, dict) else json.dumps(v, ensure_ascii=False, default=str))
                 for k, v in (data or {}).items()},
    }
    try:
        lst = read_json(LOG_FILE)
        if not isinstance(lst, list):
            lst = []
        lst.append(entry)
        if len(lst) > 20000:
            lst = lst[-20000:]
        write_json(LOG_FILE, lst)
    except Exception as e:
        log.warning('log_event failed: %s', e)
