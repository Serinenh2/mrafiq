"""Assistant مرافق — moteur de requêtes déterministe sur les données structurées (§29-30/§48).

Règle absolue : ne jamais halluciner. Chaque réponse est une requête réelle sur les
données déjà saisies par le consultant, avec sa source citée. Aucune génération de
texte libre par un modèle de langage — l'assistant est un composant du système
(données structurées + règles), pas un chatbot.
"""
from django.utils import timezone
from .services import validation_report, company_score

QUERIES = [
    'risques', 'incomplets', 'manquantes', 'documents', 'actions_prioritaires',
    'sous_traitants', 'actions_retard', 'synthese', 'services_non_interroges',
]

def _answer_risques(company):
    from .models import Gap
    order = {'critique': 0, 'eleve': 1, 'moyen': 2, 'faible': 3}
    gaps = list(Gap.objects.filter(company=company, is_open=True)
                .select_related('requirement', 'processing'))
    gaps.sort(key=lambda g: order.get(g.severity, 9))
    items = [{'label': f'{g.get_severity_display()} — {g.description[:140]}',
              'ref': g.processing.reference if g.processing else None} for g in gaps[:10]]
    return {'kind': 'ANALYSE', 'items': items,
            'source': f"{len(gaps)} écart(s) ouvert(s) — module Écarts.",
            'note': 'Vérification du consultant requise pour toute qualification juridique du risque.'}

def _answer_incomplets(company):
    report = validation_report(company)
    return {'kind': 'INFORMATION_COLLECTEE',
            'items': [{'label': f"{p['reference']} · {p['name']}"} for p in report['incomplete_processings']],
            'source': "Traitements sans finalité ou durée de conservation renseignée — module Traitements."}

def _answer_manquantes(company):
    report = validation_report(company)
    items = [{'label': f} for f in report['missing_profile']]
    if report['security_todo']:
        items.append({'label': f"{report['security_todo']} mesure(s) de sécurité à vérifier"})
    if report['rights_todo']:
        items.append({'label': f"{report['rights_todo']} droit(s) des personnes à vérifier"})
    return {'kind': 'INFORMATION_COLLECTEE', 'items': items,
            'source': 'Fiche entreprise, module Sécurité et module Droits des personnes.'}

def _answer_documents(company):
    report = validation_report(company)
    return {'kind': 'INFORMATION_COLLECTEE',
            'items': [{'label': d['title_fr']} for d in report['missing_documents']],
            'source': 'Modèles sans document validé — module Document validé.'}

def _answer_actions_prioritaires(company):
    from .models import Action
    actions = Action.objects.filter(company=company, priority='haute') \
        .exclude(status__in=['termine', 'valide']).order_by('due_date')[:10]
    return {'kind': 'INFORMATION_COLLECTEE',
            'items': [{'label': f"{a.reference} · {a.title}",
                       'ref': a.due_date.strftime('%d/%m/%Y') if a.due_date else None} for a in actions],
            'source': "Actions de priorité haute non terminées — Plan d'action."}

def _answer_sous_traitants(company):
    processings = company.processings.exclude(status__in=['propose', 'rejete']).prefetch_related('processors')
    items = [{'label': f'{p.reference} · {p.name}',
              'ref': ', '.join(pr.name for pr in p.processors.all())}
             for p in processings if p.processors.exists()]
    return {'kind': 'INFORMATION_COLLECTEE', 'items': items,
            'source': 'Traitements liés à au moins un sous-traitant — module Traitements.'}

def _answer_actions_retard(company):
    from .models import Action
    today = timezone.now().date()
    actions = Action.objects.filter(company=company, due_date__lt=today) \
        .exclude(status__in=['termine', 'valide']).order_by('due_date')
    return {'kind': 'INFORMATION_COLLECTEE',
            'items': [{'label': f"{a.reference} · {a.title}",
                       'ref': a.due_date.strftime('%d/%m/%Y')} for a in actions],
            'source': "Échéance dépassée et statut non clôturé — Plan d'action."}

def _answer_synthese(company):
    score = company_score(company)
    report = validation_report(company)
    score_label = (f"Score global : {score['global']} % ({score['level']['fr']})"
                   if score['global'] is not None else 'Score global : non calculé')
    items = [
        {'label': score_label},
        {'label': f"Traitements déclarés : {report['processings_count']}"},
        {'label': f"Écarts ouverts : {report['open_gaps']} (dont {report['critical_gaps']} critiques)"},
        {'label': f"Sécurité : {report['security_total'] - report['security_todo']} / "
                  f"{report['security_total']} mesures en place"},
        {'label': f"Droits des personnes : {4 - report['rights_todo']} / 4 vérifiés"},
        {'label': f"Documents non validés : {len(report['missing_documents'])}"},
    ]
    return {'kind': 'ANALYSE', 'items': items,
            'source': 'Agrégation du score de conformité et du contrôle avant validation.'}

def _answer_services_non_interroges(company):
    from diagnostics.models import Diagnostic
    norm = lambda s: s.strip().lower()
    dept_names = set(company.departments.values_list('name', flat=True))
    interrogated = {norm(s) for s in Diagnostic.objects.filter(company=company)
                    .exclude(service='').values_list('service', flat=True)}
    items = [{'label': d} for d in dept_names if norm(d) not in interrogated]
    return {'kind': 'INFORMATION_COLLECTEE', 'items': items,
            'source': "Services de l'organigramme sans entretien enregistré — module Diagnostic."}

HANDLERS = {
    'risques': _answer_risques, 'incomplets': _answer_incomplets, 'manquantes': _answer_manquantes,
    'documents': _answer_documents, 'actions_prioritaires': _answer_actions_prioritaires,
    'sous_traitants': _answer_sous_traitants, 'actions_retard': _answer_actions_retard,
    'synthese': _answer_synthese, 'services_non_interroges': _answer_services_non_interroges,
}

def answer(company, query_code):
    handler = HANDLERS.get(query_code)
    return handler(company) if handler else None
