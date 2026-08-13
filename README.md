# MRAFIQ | مرافق

Plateforme d'accompagnement des entreprises algériennes à la mise en conformité
avec la **loi n° 18-07** (protection des données à caractère personnel).

> *L'entreprise renseigne. MRAFIQ structure. Le consultant analyse, contrôle et accompagne.*
> MRAFIQ est un outil d'accompagnement : il ne constitue pas une autorité administrative
> et ne délivre aucune autorisation.

## Stack
| Couche | Technologies |
|---|---|
| Backend | Python · Django 5 · Django REST Framework · JWT (SimpleJWT) · Celery + Redis · ReportLab (PDF) · openpyxl (Excel) · PostgreSQL |
| Frontend | React 18 · Vite · TailwindCSS · React Router · React Query · Axios · Recharts |
| Design | Design system MRAFIQ — bilingue FR/AR (RTL natif), dark/light, IBM Plex |

## Démarrage rapide (Docker)
```bash
docker compose up --build
# Frontend : http://localhost      Backend/API : http://localhost:8000/api/
```

## Démarrage manuel (développement)
```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo        # données de démonstration
python manage.py runserver        # http://localhost:8000

# Frontend (autre terminal)
cd frontend
npm install
npm run dev                       # http://localhost:5173 (proxy /api → 8000)
```

## Comptes de démonstration
| Rôle | Identifiant | Mot de passe |
|---|---|---|
| Administrateur | `admin` | `Mrafiq!Admin2026` |
| Consultant | `consultant` | `Mrafiq!Cons2026` |
| Entreprise (SARL Exemple Algérie) | `entreprise` | `Mrafiq!Entr2026` |

## Fonctionnalités livrées (MVP)
- **Authentification JWT** avec rafraîchissement automatique, 4 rôles, isolation des
  données par entreprise (un compte entreprise ne voit que ses données, lecture seule).
- **Fiches entreprises** (identification, RC/NIF, wilaya, SI, contacts).
- **Diagnostic dynamique** : questions et règles configurables en base
  (`IF réponse THEN afficher question / proposer traitement / ouvrir module`) —
  répondre « oui » à *données employés* révèle la question paie et propose la fiche « Gestion RH ».
- **Fiches de traitement** complètes (finalité, personnes, données, sécurité,
  sous-traitants, conservation, transfert, consentement) avec workflow
  proposé → brouillon → renseigné → à vérifier → vérifié → validé/rejeté.
- **Registre des traitements** consolidé + export **Excel**.
- **Moteur de conformité** : évaluation exigence × traitement (référentiel Loi 18-07
  administrable), génération automatique de la **matrice des écarts** (gravités),
  clôture automatique des écarts corrigés.
- **Score de conformité** global et par domaine (12 domaines pondérés, seuils
  configurables : Critique / Faible / Intermédiaire / Bon / Très bon).
- **Plan d'action** : tableau + kanban, priorités, échéances, retards signalés.
- **Rapport de diagnostic PDF** (synthèse, scores, écarts, actions prioritaires).
- **Journal d'audit** immuable (qui, quoi, avant/après, IP) consultable par l'admin.
- **Interface bilingue FR/AR** avec RTL natif (propriétés logiques uniquement),
  **mode sombre**, données démo « SARL Exemple Algérie ».

## Endpoints principaux
```
POST /api/auth/token/                     connexion (JWT)
GET  /api/dashboard/                      KPIs
CRUD /api/companies/  /processings/  /gaps/  /actions/  /questions/  /requirements/
GET  /api/diagnostics/{id}/questions/     questionnaire dynamique
POST /api/diagnostics/{id}/answer/        réponse + effets des règles
POST /api/companies/{id}/compliance/run/  moteur de conformité
GET  /api/companies/{id}/score/           score global + domaines
GET  /api/companies/{id}/export/registre.xlsx | rapport.pdf
GET  /api/audit/                          journal (admin)
```

## Prochaines phases (feuille de route du cahier des charges)
GED et documents justificatifs par exigence · cartographie visuelle des flux ·
administration UI du référentiel juridique et des règles · notifications e-mail
planifiées (Celery beat) · module IA (générations proposées, avec mention
« Proposition générée par l'IA — Validation obligatoire du consultant ») ·
exports Word · multi-consultants et affectations.
