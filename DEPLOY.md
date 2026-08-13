# GUIDE DE DÉPLOIEMENT

Site : https://chroniquedejamesmukeshaba.pythonanywhere.com
Hébergement : **PythonAnywhere** (compte `chroniquedejamesmukeshaba`)
Code : https://github.com/chroniquedejamesmukeshaba/james (branche `master`)

> IMPORTANT : le site est hébergé sur PythonAnywhere, PAS sur GitHub Pages.
> Un `git push` vers GitHub ne modifie JAMAIS le site. Il faut synchroniser le
> serveur PythonAnywhere avec le dépôt après chaque push.

---

## 1. Mettre à jour le code sur le serveur (console PythonAnywhere)

```bash
cd ~/james
git fetch origin
git add -A
git commit -m "Donnees live avant MAJ"
git push origin master
git reset --hard origin/master
git clean -fd
```

### Pourquoi ce ordre précis ?

- `git add -A` + `git commit` : sauvegarde sur GitHub les données live
  (commentaires, dons, newsletter, journal d'activité) **AVANT** le reset.
  Sans cela, `git reset --hard` les écraserait avec la version du dépôt.
- `git push` depuis le serveur peut échouer (problème de token GitHub).
  Dans ce cas, ne vous inquiétez pas pour le site : poussez les données depuis
  votre PC (section 3) puis refaites le reset.
- `git reset --hard origin/master` : force le serveur à l'état exact du dépôt.
- `git clean -fd` : supprime les fichiers orphelins.

Les fichiers protégés (`.gitignore`) ne sont jamais touchés : comptes admin,
tokens de session, configs de paiement, visites, logs, médias.

### Si le push depuis le serveur échoue (403 / Permission denied)

Le token GitHub a été créé sur le compte `YagirwaGedeon`, qui n'a pas accès au
dépôt appartenant à `chroniquedejamesmukeshaba`. Solutions :

1. **Pousser depuis le PC** (recommandé) : voir section 3.
2. Refaire un token depuis le compte `chroniquedejamesmukeshaba` :
   https://github.com/settings/tokens → Generate new token (classic) → cocher
   `repo` → puis sur le serveur : `git push origin master`
   (Username : `chroniquedejamesmukeshaba`, Password : le token).

---

## 2. Redémarrer l'application web (après un changement d'app.py)

PythonAnywhere → onglet **Web** → bouton **Reload**.

---

## 3. Récupérer les données live sur le PC (quand le push serveur échoue)

### a) Sur le serveur : créer un patch

```bash
cd ~/james
git add -A
git commit -m "Donnees live"
git format-patch -1 HEAD -o ~/
```

### b) Télécharger le patch

PythonAnywhere → onglet **Files** → dossier `~` → télécharger
`0001-Donnees-live.patch` sur le PC.

### c) Sur le PC (PowerShell) : appliquer et pousser

```powershell
cd "F:\MODIFIER SITE CHRONIQUE DE JAMES MUKESHABA\chroniquedejamesmukeshaba\james"
git am "$env:USERPROFILE\Downloads\0001-Donnees-live.patch"
git push origin master
```

### d) Retour sur le serveur : resynchroniser

```bash
cd ~/james
git fetch origin
git reset --hard origin/master
git clean -fd
```

---

## 4. Forcer le rafraîchissement des navigateurs (service worker)

Le service worker met les fichiers JS/CSS en cache. Après chaque déploiement
de code, il faut incrémenter la version du cache dans `sw.js` :

```js
const CACHE = 'chronique-v17';  // v16 -> v17 -> etc.
```

Puis pousser et resynchroniser le serveur (sections 1 et 3).
Les navigateurs installeront automatiquement la nouvelle version à la
prochaine visite. En cas de doute : Ctrl+Shift+R sur le site.

Stratégie actuelle (v16) : `stale-while-revalidate` — les fichiers modifiés
sont re-téléchargés en arrière-plan à chaque rechargement, sans que
l'utilisateur ne voie d'écran blanc.

---

## 5. Vérifications après déploiement

```powershell
# Depuis le PC
Invoke-WebRequest 'https://chroniquedejamesmukeshaba.pythonanywhere.com/sw.js' | Select-Object -ExpandProperty Content
# Doit contenir "chronique-vXX" avec la bonne version
```

Pages de contrôle :
- https://chroniquedejamesmukeshaba.pythonanywhere.com/admin/login.html
- https://chroniquedejamesmukeshaba.pythonanywhere.com/index.html
- https://chroniquedejamesmukeshaba.pythonanywhere.com/js/main.js

---

## 6. Serveur local (développement)

```powershell
cd "F:\MODIFIER SITE CHRONIQUE DE JAMES MUKESHABA\chroniquedejamesmukeshaba\james"
python app.py   # puis ouvrir http://127.0.0.1:5050
```

> Ne pas oublier de pousser les données modifiées en local avant de
> resynchroniser le serveur, sinon le reset serveur écrasera les données
> locales les plus récentes.
