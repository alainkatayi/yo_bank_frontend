# Yo Bank — administration

Interface d’administration du core banking, en Angular et Tailwind CSS. Elle parle à `bank-core-service` sur `http://localhost:9081`.

## Prérequis

- Node.js 22 ou plus
- le backend démarré sur le port 9081
- un compte déjà en base : `admin1` / `admin123` (administrateur) ou `auditor1` / `auditor123` (auditeur)

## Installation

```bash
npm install
npm install tailwindcss @tailwindcss/postcss postcss
```

Les couleurs, rayons et ombres du visuel sont déclarés dans `src/styles.css` (`@theme`). Les composants n’utilisent que ces tokens.

## Lancer

```bash
npm start
```

Puis ouvrir `http://localhost:4200`. La connexion envoie `POST /bank/auth/login` et conserve le jeton Bearer pour les appels suivants.

```bash
npm test
npm run build
```

## Rôles

`BANK_ADMIN` crée, suspend, dépose, bloque et clôture. `BANK_AUDITOR` ne voit pas ces actions. Le refus réel reste celui du backend (403).
