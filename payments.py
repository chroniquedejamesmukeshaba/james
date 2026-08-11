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


# ---------------------------------------------------------------------------
# MaishaPay (RDC) : agregateur mobile money (Airtel / Orange / M-Pesa).
# API REST server-to-server :
#   Init :  POST https://marchand.maishapay.online/api/payment/rest/vers1.0/merchant
#   Check:  POST https://marchand.maishapay.online/api/transaction/rest/v2/check
# Clés : publicApiKey (client_id) + secretApiKey (client_secret).
# ---------------------------------------------------------------------------
import urllib.request
import urllib.error

MAISHAPAY_BASE = 'https://marchand.maishapay.online/api'
MAISHAPAY_COLLECT = MAISHAPAY_BASE + '/payment/rest/vers1.0/merchant'
MAISHAPAY_CHECK = MAISHAPAY_BASE + '/transaction/rest/v2/check'
MAISHAPAY_UA = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')


def _maishapay_post(url, payload):
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'),
                                 headers={'Content-Type': 'application/json',
                                          'Accept': 'application/json',
                                          'User-Agent': MAISHAPAY_UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        try:
            raw = e.read().decode('utf-8', 'replace')
        except Exception:
            raw = '{}'
    except Exception as e:
        raise PaymentError('network_error', 'Impossible de joindre MaishaPay (%s).' % (e or 'erreur reseau'))
    try:
        body = json.loads(raw or '{}')
    except Exception:
        raise PaymentError('bad_response', 'Reponse MaishaPay illisible.')
    return body


def _maishapay_unwrap(body):
    """Extrait la partie 'original.data' de la reponse MaishaPay (ou la reponse nue)."""
    if isinstance(body, dict):
        if body.get('type') == 'error':
            return {}, {'error_title': body.get('title') or '', 'error_description': body.get('description') or ''}
        original = body.get('original')
        if isinstance(original, dict):
            return original.get('data') or original, original
        return body, body
    return {}, {}


def _maishapay_gateway_mode(cfg):
    return 1 if cfg.get('mode') == 'live' else 0


class MaishaPayAdapter(ProviderAdapter):
    """Collecte mobile money via MaishaPay (RDC)."""

    maishapay_provider = ''  # MPESA | ORANGE | AIRTEL

    @property
    def ready(self):
        return bool(self.conf.get('enabled') and self.conf.get('client_id') and self.conf.get('client_secret'))

    def _auth(self):
        return {
            'gatewayMode': _maishapay_gateway_mode(self.cfg),
            'publicApiKey': self.conf.get('client_id') or '',
            'secretApiKey': self.conf.get('client_secret') or '',
        }

    def init_payment(self, txn):
        if not self.ready:
            raise PaymentError('payment_unavailable', 'MaishaPay n est pas configure (clés manquantes).')
        phone = str(txn.get('phone') or '').strip()
        if not phone:
            raise PaymentError('phone_required', 'Votre numéro de téléphone est requis pour le paiement mobile money.')
        payload = dict(self._auth())
        payload.update({
            'transactionReference': str(txn.get('txn_id') or '')[:50],
            'amount': float(txn.get('amount') or 0),
            'currency': str(txn.get('currency') or 'USD').upper(),
            'customerFullName': str(txn.get('name') or '')[:120],
            'customerPhoneNumber': phone[:20],
            'customerEmailAddress': str(txn.get('email') or '')[:200] or None,
            'chanel': 'MOBILEMONEY',
            'provider': self.maishapay_provider,
            'walletID': phone[:20],
        })
        body = _maishapay_post(MAISHAPAY_COLLECT, payload)
        data, original = _maishapay_unwrap(body)
        status_code = str(data.get('statusCode') or original.get('status') or '')
        if original.get('error_title') or original.get('error_description'):
            raise PaymentError('init_failed', 'MaishaPay : %s' % (original.get('error_description') or original.get('error_title')))
        if str(original.get('status')) not in ('200', 200) or not status_code.startswith('2'):
            detail = data.get('statusDescription') or body.get('exception') or 'echec inconnu'
            raise PaymentError('init_failed', 'MaishaPay : %s' % detail)
        provider_txn_id = str(data.get('transactionId') or '')
        if not provider_txn_id:
            raise PaymentError('init_failed', 'MaishaPay : aucune référence de transaction retournée.')
        log.info('maishapay init ok: ref=%s status=%s desc=%s',
                 provider_txn_id, status_code, data.get('statusDescription'))
        return {'provider_txn_id': provider_txn_id, 'redirect_url': ''}

    def verify_txn(self, provider_txn_id):
        if not self.ready:
            raise PaymentError('payment_unavailable', 'MaishaPay n est pas configure (clés manquantes).')
        payload = dict(self._auth())
        payload['transactionId'] = str(provider_txn_id or '')[:50]
        body = _maishapay_post(MAISHAPAY_CHECK, payload)
        data, original = _maishapay_unwrap(body)
        status = str(data.get('transactionStatus') or '').upper()
        if not status:
            # Certaines reponses placent le statut a un autre niveau.
            status = str(data.get('statusDescription') or original.get('status') or '').upper()
        if not status and not data:
            return {'status': 'PENDING'}  # reponse vide : transaction pas encore visible
        log.info('maishapay check: ref=%s status=%s', provider_txn_id, status)
        if any(k in status for k in ('SUCCESS', 'COMPLETED', 'ACCEPTED', 'PAID')):
            return {'status': 'SUCCESS'}
        if any(k in status for k in ('FAIL', 'ERROR', 'DECLINED', 'REJECTED')):
            return {'status': 'FAILED'}
        if any(k in status for k in ('CANCEL', 'ABORT', 'TIMEOUT')):
            return {'status': 'CANCELLED'}
        return {'status': 'PENDING'}


class MaishaAirtelAdapter(MaishaPayAdapter):
    pid = 'airtel_money'
    maishapay_provider = 'AIRTEL'


class MaishaOrangeAdapter(MaishaPayAdapter):
    pid = 'orange_money'
    maishapay_provider = 'ORANGE'


class MaishaVodacomAdapter(MaishaPayAdapter):
    pid = 'vodacom_mpesa'
    maishapay_provider = 'MPESA'


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
    'airtel_money': MaishaAirtelAdapter,
    'orange_money': MaishaOrangeAdapter,
    'vodacom_mpesa': MaishaVodacomAdapter,
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
